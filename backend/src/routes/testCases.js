import express from 'express';
import multer from 'multer';
import TestCase from '../models/TestCase.js';
import TestPlan from '../models/TestPlan.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { parseXLSX, parseCSV, validateImportData } from '../utils/importUtils.js';
import { generateXLSXTemplate, generateCSVTemplate } from '../utils/templateGenerator.js';
import { buildScopeQuery, resolveWorkspaceForWrite } from '../utils/workspaceAccess.js';
import { logActivity } from '../utils/activityLog.js';
import ActivityLog from '../models/ActivityLog.js';
import { syncPlanStatusFromTestCases } from '../utils/planStatusSync.js';

// Rate limiter: max 10 delete operations per 10 seconds per user
const deleteLimiter = createRateLimiter({ windowMs: 10_000, max: 10, message: 'Too many delete requests. Please slow down.' });

const router = express.Router();

// Fields a client is allowed to set on a test case.
//
// `user` and `workspace` are deliberately absent: they are assigned from the
// request context. Spreading req.body straight into create/update would let a
// caller set those two fields and hand their own record to another account —
// or pull someone else's record into their workspace.
const ALLOWED_FIELDS = [
    'title',
    'description',
    'externalId',
    'preCondition',
    'testData',
    'steps',
    'priority',
    'status',
    'category',
    'feature',
    'tags',
    'executionStatus',
    'executionNotes',
    'bugType',
    'bugSeverity',
    'fixStatus',
    'bugId',
    'jiraTicketUrl',
];

const pickAllowedFields = (source = {}) => {
    const payload = {};
    for (const field of ALLOWED_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            payload[field] = source[field];
        }
    }
    return payload;
};

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only XLSX and CSV files are allowed.'));
        }
    },
});

// All routes require authentication
router.use(isAuthenticated);

// @route   GET /api/testcases
// @desc    Get all test cases for current user in active workspace
router.get('/', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req);

        const testCases = await TestCase.find(query)
            .populate('executedBy', 'name email picture')
            .sort({ createdAt: -1 });
        res.json(testCases);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/testcases/template
// @desc    Download import template (XLSX or CSV)
router.get('/template', async (req, res, next) => {
    try {
        const format = req.query.format || 'xlsx';

        if (format === 'xlsx') {
            const buffer = await generateXLSXTemplate();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=test-cases-template.xlsx');
            res.send(buffer);
        } else if (format === 'csv') {
            const buffer = generateCSVTemplate();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=test-cases-template.csv');
            res.send(buffer);
        } else {
            res.status(400).json({ message: 'Invalid format. Use xlsx or csv.' });
        }
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/testcases/import
// @desc    Import test cases from XLSX or CSV file, optionally attaching
//          them to a test plan (existing, via `planId`, or a new one, via
//          `newPlanName` — both arrive as multipart form fields alongside
//          the file).
router.post('/import', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let testCases;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        // Parse file based on type
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            testCases = await parseXLSX(req.file.buffer);
        } else if (fileExtension === 'csv') {
            testCases = await parseCSV(req.file.buffer);
        } else {
            return res.status(400).json({ message: 'Invalid file format. Only XLSX and CSV are supported.' });
        }

        // Validate imported data
        const validation = validateImportData(testCases);

        if (!validation.valid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors,
                totalRows: validation.totalRows,
                validRows: validation.validRows,
                invalidRows: validation.invalidRows,
            });
        }

        // Resolve the target plan (if any) before writing anything, so a bad
        // planId fails the request without leaving orphaned test cases.
        const { planId, newPlanName } = req.body;
        let existingPlan = null;
        if (planId) {
            const planQuery = await buildScopeQuery(req, { _id: planId });
            existingPlan = await TestPlan.findOne(planQuery);
            if (!existingPlan) {
                return res.status(404).json({ message: 'Test plan not found' });
            }
        }

        // Add user ID and workspace ID to all test cases
        const workspaceId = await resolveWorkspaceForWrite(req);
        const testCasesWithUser = validation.validTestCases.map(tc => ({
            ...pickAllowedFields(tc),
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        }));

        // Bulk insert
        const inserted = await TestCase.insertMany(testCasesWithUser);

        let targetPlanId = null;
        if (existingPlan) {
            existingPlan.testCases.push(...inserted.map(tc => tc._id));
            await existingPlan.save();
            targetPlanId = existingPlan._id;
            await logActivity({
                entityType: 'TestPlan',
                entityId: existingPlan._id,
                workspace: workspaceId || undefined,
                user: req.userId,
                action: 'updated',
                changedFields: ['testCases'],
            });
            await syncPlanStatusFromTestCases({ planId: existingPlan._id, actingUserId: req.userId, io: req.io });
        } else if (newPlanName) {
            const newPlan = await TestPlan.create({
                name: newPlanName,
                description: `Imported from ${req.file.originalname}`,
                testCases: inserted.map(tc => tc._id),
                user: req.userId,
                ...(workspaceId && { workspace: workspaceId }),
            });
            targetPlanId = newPlan._id;
            await logActivity({
                entityType: 'TestPlan',
                entityId: newPlan._id,
                workspace: workspaceId || undefined,
                user: req.userId,
                action: 'created',
            });
            await syncPlanStatusFromTestCases({ planId: newPlan._id, actingUserId: req.userId, io: req.io });
        }

        res.status(201).json({
            message: 'Test cases imported successfully',
            count: inserted.length,
            testCases: inserted,
            planId: targetPlanId,
        });
    } catch (error) {
        console.error('Import error:', error);
        next(error);
    }
});

// @route   POST /api/testcases/batch-delete
// @desc    Delete multiple test cases in a single request (max 50)
router.post('/batch-delete', deleteLimiter, async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids must be a non-empty array' });
        }

        if (ids.length > 50) {
            return res.status(400).json({ message: 'Maximum 50 items per batch delete' });
        }

        const query = await buildScopeQuery(req, { _id: { $in: ids } });

        // Delete all test cases that belong to this user
        const result = await TestCase.deleteMany(query);

        // Clean up references in test plans and auto-obsolete empty plans
        const affectedPlans = await TestPlan.find({
            user: req.userId,
            testCases: { $in: ids },
        });

        for (const plan of affectedPlans) {
            plan.testCases = plan.testCases.filter(tcId => !ids.includes(tcId.toString()));
            if (plan.testCases.length === 0 && plan.status !== 'Obsolete') {
                plan.status = 'Obsolete';
            }
            await plan.save();
        }

        res.json({
            message: `${result.deletedCount} test case(s) deleted`,
            deletedCount: result.deletedCount,
            obsoletedPlans: affectedPlans.filter(p => p.status === 'Obsolete').map(p => p._id),
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/testcases/:id
// @desc    Get single test case
router.get('/:id', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testCase = await TestCase.findOne(query).populate('executedBy', 'name email picture');

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        res.json(testCase);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/testcases/:id/history
// @desc    Get activity history for a test case (who executed/edited it, and when)
router.get('/:id/history', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const exists = await TestCase.exists(query);
        if (!exists) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        const history = await ActivityLog.find({ entityType: 'TestCase', entityId: req.params.id })
            .populate('user', 'name email picture')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/testcases
// @desc    Create new test case
router.post('/', async (req, res, next) => {
    try {
        const workspaceId = await resolveWorkspaceForWrite(req);
        const testCase = await TestCase.create({
            ...pickAllowedFields(req.body),
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        });

        await logActivity({
            entityType: 'TestCase',
            entityId: testCase._id,
            workspace: workspaceId || undefined,
            user: req.userId,
            action: 'created',
        });

        res.status(201).json(testCase);
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/testcases/:id
// @desc    Update test case
router.put('/:id', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const payload = pickAllowedFields(req.body);
        const statusChanged = Object.prototype.hasOwnProperty.call(payload, 'executionStatus');
        // Set from the server's own auth context, never from the client —
        // same rule as `user`/`workspace` above, so this can't be forged.
        if (statusChanged) {
            payload.executedBy = req.userId;
            payload.executedAt = new Date();
        }

        const testCase = await TestCase.findOneAndUpdate(
            query,
            payload,
            { new: true, runValidators: true }
        ).populate('executedBy', 'name email picture');

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        const workspaceId = req.headers['x-workspace-id'] || testCase.workspace || undefined;

        if (statusChanged) {
            await logActivity({
                entityType: 'TestCase',
                entityId: testCase._id,
                workspace: workspaceId,
                user: req.userId,
                action: 'execution_status_changed',
                toStatus: testCase.executionStatus,
            });
        }

        const editedFields = Object.keys(payload).filter(
            f => !['executionStatus', 'executionNotes', 'executedBy', 'executedAt'].includes(f)
        );
        if (editedFields.length > 0) {
            await logActivity({
                entityType: 'TestCase',
                entityId: testCase._id,
                workspace: workspaceId,
                user: req.userId,
                action: 'updated',
                changedFields: editedFields,
            });
        }

        // Emit real-time update if executionStatus was changed
        let affectedPlans = [];
        if (statusChanged) {
            affectedPlans = await TestPlan.find({ testCases: testCase._id });
            affectedPlans.forEach(plan => {
                if (req.io) {
                    req.io.to(plan._id.toString()).emit('testCaseStatusUpdated', {
                        planId: plan._id,
                        testCaseId: testCase._id,
                        status: testCase.executionStatus,
                        updatedBy: req.userId,
                        executedBy: testCase.executedBy,
                        executedAt: testCase.executedAt,
                    });
                }
            });
        }

        // A bug-tracking field change can flip a containing plan's overall
        // status (see planStatusSync.js) — recompute for every plan this
        // test case belongs to, not just ones already fetched above.
        const bugFieldsChanged = ['bugType', 'fixStatus'].some(f => editedFields.includes(f));
        if (bugFieldsChanged) {
            const plansToSync = affectedPlans.length > 0
                ? affectedPlans
                : await TestPlan.find({ testCases: testCase._id }, '_id');
            for (const plan of plansToSync) {
                await syncPlanStatusFromTestCases({ planId: plan._id, actingUserId: req.userId, io: req.io });
            }
        }

        res.json(testCase);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete test case
router.delete('/:id', deleteLimiter, async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testCase = await TestCase.findOneAndDelete(query);

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        // Clean up references in test plans and auto-obsolete empty plans
        const affectedPlans = await TestPlan.find({
            user: req.userId,
            testCases: req.params.id,
        });

        for (const plan of affectedPlans) {
            plan.testCases = plan.testCases.filter(tcId => tcId.toString() !== req.params.id);
            if (plan.testCases.length === 0 && plan.status !== 'Obsolete') {
                plan.status = 'Obsolete';
            }
            await plan.save();
            // Removing the deleted test case can resolve the plan's only
            // unfixed bug — recheck whether that flips its status.
            await syncPlanStatusFromTestCases({ planId: plan._id, actingUserId: req.userId, io: req.io });
        }

        res.json({
            message: 'Test case deleted successfully',
            obsoletedPlans: affectedPlans.filter(p => p.status === 'Obsolete').map(p => p._id),
        });
    } catch (error) {
        next(error);
    }
});

export default router;

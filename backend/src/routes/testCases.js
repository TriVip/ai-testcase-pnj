import express from 'express';
import multer from 'multer';
import TestCase from '../models/TestCase.js';
import TestPlan from '../models/TestPlan.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { parseXLSX, parseCSV, validateImportData } from '../utils/importUtils.js';
import { generateXLSXTemplate, generateCSVTemplate } from '../utils/templateGenerator.js';

// Rate limiter: max 10 delete operations per 10 seconds per user
const deleteLimiter = createRateLimiter({ windowMs: 10_000, max: 10, message: 'Too many delete requests. Please slow down.' });

const router = express.Router();

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
router.get('/', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testCases = await TestCase.find(query).sort({ createdAt: -1 });
        res.json(testCases);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/testcases/template
// @desc    Download import template (XLSX or CSV)
router.get('/template', async (req, res) => {
    try {
        const format = req.query.format || 'xlsx';

        if (format === 'xlsx') {
            const buffer = generateXLSXTemplate();
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
        res.status(500).json({ message: 'Failed to generate template', error: error.message });
    }
});

// @route   POST /api/testcases/import
// @desc    Import test cases from XLSX or CSV file
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let testCases;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        // Parse file based on type
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            testCases = parseXLSX(req.file.buffer);
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

        // Add user ID and workspace ID to all test cases
        const workspaceId = req.headers['x-workspace-id'];
        const testCasesWithUser = validation.validTestCases.map(tc => ({
            ...tc,
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        }));

        // Bulk insert
        const inserted = await TestCase.insertMany(testCasesWithUser);

        res.status(201).json({
            message: 'Test cases imported successfully',
            count: inserted.length,
            testCases: inserted,
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Failed to import test cases', error: error.message });
    }
});

// @route   POST /api/testcases/batch-delete
// @desc    Delete multiple test cases in a single request (max 50)
router.post('/batch-delete', deleteLimiter, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids must be a non-empty array' });
        }

        if (ids.length > 50) {
            return res.status(400).json({ message: 'Maximum 50 items per batch delete' });
        }

        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: { $in: ids }, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/testcases/:id
// @desc    Get single test case
router.get('/:id', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testCase = await TestCase.findOne(query);

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        res.json(testCase);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/testcases
// @desc    Create new test case
router.post('/', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const testCase = await TestCase.create({
            ...req.body,
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        });

        res.status(201).json(testCase);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create test case', error: error.message });
    }
});

// @route   PUT /api/testcases/:id
// @desc    Update test case
router.put('/:id', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testCase = await TestCase.findOneAndUpdate(
            query,
            req.body,
            { new: true, runValidators: true }
        );

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        // Emit real-time update if executionStatus was changed
        if (req.body.executionStatus) {
            const affectedPlans = await TestPlan.find({ testCases: testCase._id });
            affectedPlans.forEach(plan => {
                if (req.io) {
                    req.io.to(plan._id.toString()).emit('testCaseStatusUpdated', {
                        planId: plan._id,
                        testCaseId: testCase._id,
                        status: testCase.executionStatus,
                        updatedBy: req.userId
                    });
                }
            });
        }

        res.json(testCase);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update test case', error: error.message });
    }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete test case
router.delete('/:id', deleteLimiter, async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

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
        }

        res.json({
            message: 'Test case deleted successfully',
            obsoletedPlans: affectedPlans.filter(p => p.status === 'Obsolete').map(p => p._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;

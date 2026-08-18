import express from 'express';
import TestPlan from '../models/TestPlan.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { buildScopeQuery, resolveWorkspaceForWrite } from '../utils/workspaceAccess.js';
import { logActivity } from '../utils/activityLog.js';
import ActivityLog from '../models/ActivityLog.js';
import { syncPlanStatusFromTestCases } from '../utils/planStatusSync.js';

// Nested populate so each test case in a plan carries its own executor info,
// same shape as the standalone /api/testcases endpoints.
const populateTestCasesWithExecutor = {
    path: 'testCases',
    populate: { path: 'executedBy', select: 'name email picture' },
};

// Rate limiter: max 10 delete operations per 10 seconds per user
const deleteLimiter = createRateLimiter({ windowMs: 10_000, max: 10 });

const router = express.Router();

// Fields a client is allowed to set on a test plan. `user` and `workspace` are
// assigned from the request context and must never come from the body — see the
// matching note in routes/testCases.js.
const ALLOWED_FIELDS = [
    'name',
    'description',
    'testCases',
    'status',
    'startDate',
    'endDate',
    'executionStatus',
    'executionNotes',
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

// All routes require authentication
router.use(isAuthenticated);

// @route   GET /api/testplans
// @desc    Get all test plans for current user in active workspace (supports pagination & filtering via query params)
router.get('/', async (req, res, next) => {
    try {
        const { page, limit, search, status, executionStatus } = req.query;
        const extra = {};

        if (search && typeof search === 'string') {
            const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            extra.$or = [
                { name: searchRegex },
                { description: searchRegex },
            ];
        }
        if (status && status !== 'All') extra.status = status;
        if (executionStatus && executionStatus !== 'All') extra.executionStatus = executionStatus;

        const query = await buildScopeQuery(req, extra);

        if (page !== undefined || limit !== undefined) {
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
            const skip = (pageNum - 1) * limitNum;

            const [testPlans, total] = await Promise.all([
                TestPlan.find(query)
                    .populate(populateTestCasesWithExecutor)
                    .populate('executedBy', 'name email picture')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                TestPlan.countDocuments(query),
            ]);

            const totalPages = Math.ceil(total / limitNum) || 1;

            return res.json({
                testPlans,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages,
                    hasMore: pageNum < totalPages,
                },
            });
        }

        const testPlans = await TestPlan.find(query)
            .populate(populateTestCasesWithExecutor)
            .populate('executedBy', 'name email picture')
            .sort({ createdAt: -1 });
        res.json(testPlans);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/testplans/:id
// @desc    Get single test plan
router.get('/:id', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testPlan = await TestPlan.findOne(query)
            .populate(populateTestCasesWithExecutor)
            .populate('executedBy', 'name email picture');

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json(testPlan);
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/testplans/:id/history
// @desc    Get activity history for a test plan (execution changes, edits, membership changes)
router.get('/:id/history', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const exists = await TestPlan.exists(query);
        if (!exists) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        const history = await ActivityLog.find({ entityType: 'TestPlan', entityId: req.params.id })
            .populate('user', 'name email picture')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/testplans
// @desc    Create new test plan
router.post('/', async (req, res, next) => {
    try {
        const workspaceId = await resolveWorkspaceForWrite(req);
        const testPlan = await TestPlan.create({
            ...pickAllowedFields(req.body),
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        });

        await logActivity({
            entityType: 'TestPlan',
            entityId: testPlan._id,
            workspace: workspaceId || undefined,
            user: req.userId,
            action: 'created',
        });

        if (testPlan.testCases.length > 0) {
            const changed = await syncPlanStatusFromTestCases({ planId: testPlan._id, actingUserId: req.userId, io: req.io });
            if (changed) {
                const fresh = await TestPlan.findById(testPlan._id)
                    .populate(populateTestCasesWithExecutor)
                    .populate('executedBy', 'name email picture');
                return res.status(201).json(fresh);
            }
        }

        res.status(201).json(testPlan);
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/testplans/:id
// @desc    Update test plan
router.put('/:id', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const payload = pickAllowedFields(req.body);
        const statusChanged = Object.prototype.hasOwnProperty.call(payload, 'executionStatus');
        if (statusChanged) {
            payload.executedBy = req.userId;
            payload.executedAt = new Date();
        }

        const testPlan = await TestPlan.findOneAndUpdate(
            query,
            payload,
            { new: true, runValidators: true }
        )
            .populate(populateTestCasesWithExecutor)
            .populate('executedBy', 'name email picture');

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        const workspaceId = req.headers['x-workspace-id'] || testPlan.workspace || undefined;

        if (statusChanged) {
            await logActivity({
                entityType: 'TestPlan',
                entityId: testPlan._id,
                workspace: workspaceId,
                user: req.userId,
                action: 'execution_status_changed',
                toStatus: testPlan.executionStatus,
            });
        }

        const editedFields = Object.keys(payload).filter(
            f => !['executionStatus', 'executionNotes', 'executedBy', 'executedAt'].includes(f)
        );
        if (editedFields.length > 0) {
            await logActivity({
                entityType: 'TestPlan',
                entityId: testPlan._id,
                workspace: workspaceId,
                user: req.userId,
                action: 'updated',
                changedFields: editedFields,
            });
        }

        // This is the route the "Edit Test Plan" form actually uses to
        // change plan membership (sending the whole `testCases` array), so
        // it's the real place to recompute the bug-driven status — not just
        // the dedicated add/remove-one-test-case endpoints below, which the
        // UI doesn't call. Skip it if the caller set executionStatus in the
        // same request: that's an explicit manual choice and should win.
        if (!statusChanged && editedFields.includes('testCases')) {
            const changed = await syncPlanStatusFromTestCases({ planId: testPlan._id, actingUserId: req.userId, io: req.io });
            if (changed) {
                const fresh = await TestPlan.findById(testPlan._id)
                    .populate(populateTestCasesWithExecutor)
                    .populate('executedBy', 'name email picture');
                return res.json(fresh);
            }
        }

        res.json(testPlan);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/testplans/:id
// @desc    Delete test plan
router.delete('/:id', deleteLimiter, async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testPlan = await TestPlan.findOneAndDelete(query);

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json({ message: 'Test plan deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/testplans/:id/testcases
// @desc    Add test case to test plan
router.post('/:id/testcases', async (req, res, next) => {
    try {
        const { testCaseId } = req.body;
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testPlan = await TestPlan.findOne(query);

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        if (!testPlan.testCases.includes(testCaseId)) {
            testPlan.testCases.push(testCaseId);
            await testPlan.save();

            await logActivity({
                entityType: 'TestPlan',
                entityId: testPlan._id,
                workspace: req.headers['x-workspace-id'] || testPlan.workspace || undefined,
                user: req.userId,
                action: 'updated',
                changedFields: ['testCases'],
            });

            // The newly added test case may carry an unresolved bug that
            // should flip this plan's status immediately.
            const changed = await syncPlanStatusFromTestCases({ planId: testPlan._id, actingUserId: req.userId, io: req.io });
            if (changed) {
                const fresh = await TestPlan.findById(testPlan._id)
                    .populate(populateTestCasesWithExecutor)
                    .populate('executedBy', 'name email picture');
                return res.json(fresh);
            }
        }

        await testPlan.populate(populateTestCasesWithExecutor);
        res.json(testPlan);
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/testplans/:id/testcases/:testCaseId
// @desc    Remove test case from test plan
router.delete('/:id/testcases/:testCaseId', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req, { _id: req.params.id });

        const testPlan = await TestPlan.findOne(query);

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        testPlan.testCases = testPlan.testCases.filter(
            (tc) => tc.toString() !== req.params.testCaseId
        );

        // Auto-obsolete if no test cases remain
        if (testPlan.testCases.length === 0 && testPlan.status !== 'Obsolete') {
            testPlan.status = 'Obsolete';
        }

        await testPlan.save();

        await logActivity({
            entityType: 'TestPlan',
            entityId: testPlan._id,
            workspace: req.headers['x-workspace-id'] || testPlan.workspace || undefined,
            user: req.userId,
            action: 'updated',
            changedFields: ['testCases'],
        });

        // Removing this test case may have resolved the plan's only
        // unfixed bug — recheck whether that flips its status.
        const changed = await syncPlanStatusFromTestCases({ planId: testPlan._id, actingUserId: req.userId, io: req.io });
        if (changed) {
            const fresh = await TestPlan.findById(testPlan._id)
                .populate(populateTestCasesWithExecutor)
                .populate('executedBy', 'name email picture');
            return res.json(fresh);
        }

        await testPlan.populate(populateTestCasesWithExecutor);

        res.json(testPlan);
    } catch (error) {
        next(error);
    }
});

export default router;

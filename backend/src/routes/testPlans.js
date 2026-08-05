import express from 'express';
import TestPlan from '../models/TestPlan.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { buildScopeQuery, resolveWorkspaceForWrite } from '../utils/workspaceAccess.js';

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
// @desc    Get all test plans for current user in active workspace
router.get('/', async (req, res, next) => {
    try {
        const query = await buildScopeQuery(req);

        const testPlans = await TestPlan.find(query)
            .populate('testCases')
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

        const testPlan = await TestPlan.findOne(query).populate(
            'testCases'
        );

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json(testPlan);
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

        const testPlan = await TestPlan.findOneAndUpdate(
            query,
            pickAllowedFields(req.body),
            { new: true, runValidators: true }
        ).populate('testCases');

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
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
        }

        await testPlan.populate('testCases');
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
        await testPlan.populate('testCases');

        res.json(testPlan);
    } catch (error) {
        next(error);
    }
});

export default router;

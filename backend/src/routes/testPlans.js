import express from 'express';
import TestPlan from '../models/TestPlan.js';
import { isAuthenticated } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

// Rate limiter: max 10 delete operations per 10 seconds per user
const deleteLimiter = createRateLimiter({ windowMs: 10_000, max: 10 });

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// @route   GET /api/testplans
// @desc    Get all test plans for current user in active workspace
router.get('/', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testPlans = await TestPlan.find(query)
            .populate('testCases')
            .sort({ createdAt: -1 });
        res.json(testPlans);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/testplans/:id
// @desc    Get single test plan
router.get('/:id', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testPlan = await TestPlan.findOne(query).populate(
            'testCases'
        );

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json(testPlan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/testplans
// @desc    Create new test plan
router.post('/', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const testPlan = await TestPlan.create({
            ...req.body,
            user: req.userId,
            ...(workspaceId && { workspace: workspaceId }),
        });

        res.status(201).json(testPlan);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create test plan', error: error.message });
    }
});

// @route   PUT /api/testplans/:id
// @desc    Update test plan
router.put('/:id', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testPlan = await TestPlan.findOneAndUpdate(
            query,
            req.body,
            { new: true, runValidators: true }
        ).populate('testCases');

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json(testPlan);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update test plan', error: error.message });
    }
});

// @route   DELETE /api/testplans/:id
// @desc    Delete test plan
router.delete('/:id', deleteLimiter, async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

        const testPlan = await TestPlan.findOneAndDelete(query);

        if (!testPlan) {
            return res.status(404).json({ message: 'Test plan not found' });
        }

        res.json({ message: 'Test plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/testplans/:id/testcases
// @desc    Add test case to test plan
router.post('/:id/testcases', async (req, res) => {
    try {
        const { testCaseId } = req.body;
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

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
        res.status(400).json({ message: 'Failed to add test case', error: error.message });
    }
});

// @route   DELETE /api/testplans/:id/testcases/:testCaseId
// @desc    Remove test case from test plan
router.delete('/:id/testcases/:testCaseId', async (req, res) => {
    try {
        const workspaceId = req.headers['x-workspace-id'];
        const query = { _id: req.params.id, user: req.userId };
        if (workspaceId) query.workspace = workspaceId;

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
        res.status(400).json({ message: 'Failed to remove test case', error: error.message });
    }
});

export default router;

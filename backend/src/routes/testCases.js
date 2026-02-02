import express from 'express';
import TestCase from '../models/TestCase.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// @route   GET /api/testcases
// @desc    Get all test cases for current user
router.get('/', async (req, res) => {
    try {
        const testCases = await TestCase.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json(testCases);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/testcases/:id
// @desc    Get single test case
router.get('/:id', async (req, res) => {
    try {
        const testCase = await TestCase.findOne({ _id: req.params.id, user: req.userId });

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
        const testCase = await TestCase.create({
            ...req.body,
            user: req.userId,
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
        const testCase = await TestCase.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        res.json(testCase);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update test case', error: error.message });
    }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete test case
router.delete('/:id', async (req, res) => {
    try {
        const testCase = await TestCase.findOneAndDelete({ _id: req.params.id, user: req.userId });

        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        res.json({ message: 'Test case deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;

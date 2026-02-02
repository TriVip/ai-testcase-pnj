import express from 'express';
import { 
    generateTestCaseSuggestions, 
    generateTestPlanSuggestions,
    improveTestCase 
} from '../services/openai.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// @route   POST /api/ai/suggest-testcases
// @desc    Generate AI test case suggestions
router.post('/suggest-testcases', async (req, res) => {
    try {
        const { featureDescription } = req.body;

        if (!featureDescription) {
            return res.status(400).json({ message: 'Feature description is required' });
        }

        const suggestions = await generateTestCaseSuggestions(featureDescription);
        res.json({ suggestions });
    } catch (error) {
        console.error('AI suggestion error:', error);
        res.status(500).json({ message: 'Failed to generate suggestions', error: error.message });
    }
});

// @route   POST /api/ai/suggest-testplan
// @desc    Generate AI test plan suggestions
router.post('/suggest-testplan', async (req, res) => {
    try {
        const { projectDescription } = req.body;

        if (!projectDescription) {
            return res.status(400).json({ message: 'Project description is required' });
        }

        const testPlan = await generateTestPlanSuggestions(projectDescription);
        res.json({ testPlan });
    } catch (error) {
        console.error('AI test plan suggestion error:', error);
        res.status(500).json({ message: 'Failed to generate test plan', error: error.message });
    }
});

// @route   POST /api/ai/improve-testcase
// @desc    Improve existing test case using AI
router.post('/improve-testcase', async (req, res) => {
    try {
        const { testCase } = req.body;

        if (!testCase) {
            return res.status(400).json({ message: 'Test case is required' });
        }

        const improved = await improveTestCase(testCase);
        res.json({ improved });
    } catch (error) {
        console.error('AI improve test case error:', error);
        res.status(500).json({ message: 'Failed to improve test case', error: error.message });
    }
});

export default router;

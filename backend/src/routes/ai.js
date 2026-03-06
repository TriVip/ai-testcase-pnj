import express from 'express';
import {
    generateTestCaseSuggestions,
    generateTestPlanSuggestions,
    improveTestCase
} from '../services/openai.js';
import { isAuthenticated } from '../middleware/auth.js';
import multer from 'multer';
import { extractTextFromFile } from '../utils/fileParser.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT, PDF, and DOCX files are allowed.'));
        }
    }
});

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// @route   POST /api/ai/suggest-testcases
// @desc    Generate AI test case suggestions
router.post('/suggest-testcases', upload.single('file'), async (req, res) => {
    try {
        let { featureDescription, count } = req.body;

        // Handle optional file upload
        if (req.file) {
            const fileText = await extractTextFromFile(req.file);
            // Append file text to the description provided by the user
            featureDescription = featureDescription
                ? `${featureDescription}\n\n--- Content from ${req.file.originalname} ---\n${fileText}`
                : `--- Content from ${req.file.originalname} ---\n${fileText}`;
        }

        if (!featureDescription || !featureDescription.trim()) {
            return res.status(400).json({ message: 'Feature description or a document file is required' });
        }

        // If count not provided explicitly, try to detect from description
        let testCaseCount = parseInt(count, 10);
        if (!testCaseCount || isNaN(testCaseCount)) {
            // Try to extract a number from the description ("create 3 test cases", "tạo 2 test case", etc.)
            const match = featureDescription.match(/(\d+)\s*(test\s*case|tc)/i);
            testCaseCount = match ? parseInt(match[1], 10) : null;
        }
        // Clamp between 1 and 20
        if (testCaseCount) testCaseCount = Math.min(Math.max(testCaseCount, 1), 20);

        const suggestions = await generateTestCaseSuggestions(featureDescription, testCaseCount);
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

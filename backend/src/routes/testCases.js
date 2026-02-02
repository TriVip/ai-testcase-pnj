import express from 'express';
import multer from 'multer';
import TestCase from '../models/TestCase.js';
import { isAuthenticated } from '../middleware/auth.js';
import { parseXLSX, parseCSV, validateImportData } from '../utils/importUtils.js';
import { generateXLSXTemplate, generateCSVTemplate } from '../utils/templateGenerator.js';

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
// @desc    Get all test cases for current user
router.get('/', async (req, res) => {
    try {
        const testCases = await TestCase.find({ user: req.userId }).sort({ createdAt: -1 });
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

        // Add user ID to all test cases
        const testCasesWithUser = validation.validTestCases.map(tc => ({
            ...tc,
            user: req.userId,
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

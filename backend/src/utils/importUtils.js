import XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Parse XLSX file buffer and return array of test case objects
 */
const parseXLSX = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data.map(row => transformRowToTestCase(row));
};

/**
 * Parse CSV file buffer and return array of test case objects
 */
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());

        stream
            .pipe(csv())
            .on('data', (row) => {
                results.push(transformRowToTestCase(row));
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

/**
 * Transform a row from import file to test case object
 */
const transformRowToTestCase = (row) => {
    // Parse steps - support both pipe-separated and JSON array formats
    let steps = [];
    if (row.Steps || row.steps) {
        const stepsValue = row.Steps || row.steps;
        if (typeof stepsValue === 'string') {
            // Try to parse as JSON first
            try {
                steps = JSON.parse(stepsValue);
            } catch (e) {
                // If not JSON, treat as pipe-separated
                steps = stepsValue.split('|').map(s => s.trim()).filter(s => s);
            }
        } else if (Array.isArray(stepsValue)) {
            steps = stepsValue;
        }
    }

    return {
        title: row.Title || row.title || '',
        description: row.Description || row.description || '',
        category: row.Category || row.category || '',
        priority: row.Priority || row.priority || 'Medium',
        steps: steps,
        expectedResult: row['Expected Result'] || row.expectedResult || row['Expected_Result'] || '',
        executionStatus: row['Execution Status'] || row.executionStatus || row['Execution_Status'] || 'Pending',
        executionNotes: row['Execution Notes'] || row.executionNotes || row['Execution_Notes'] || '',
    };
};

/**
 * Validate test case data
 */
const validateTestCase = (testCase, rowIndex) => {
    const errors = [];

    // Required fields
    if (!testCase.title || testCase.title.trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Title is required`);
    }
    if (!testCase.description || testCase.description.trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Description is required`);
    }
    if (!testCase.category || testCase.category.trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Category is required`);
    }

    // Priority validation
    const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
    if (!validPriorities.includes(testCase.priority)) {
        errors.push(`Row ${rowIndex + 2}: Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Execution Status validation
    const validStatuses = ['Pending', 'Pass', 'Failed'];
    if (!validStatuses.includes(testCase.executionStatus)) {
        errors.push(`Row ${rowIndex + 2}: Execution Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Steps validation
    if (!Array.isArray(testCase.steps)) {
        errors.push(`Row ${rowIndex + 2}: Steps must be an array`);
    }

    return errors;
};

/**
 * Validate all test cases and return validation results
 */
const validateImportData = (testCases) => {
    const allErrors = [];
    const validTestCases = [];

    testCases.forEach((testCase, index) => {
        const errors = validateTestCase(testCase, index);
        if (errors.length > 0) {
            allErrors.push(...errors);
        } else {
            validTestCases.push(testCase);
        }
    });

    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        validTestCases,
        totalRows: testCases.length,
        validRows: validTestCases.length,
        invalidRows: testCases.length - validTestCases.length,
    };
};

export {
    parseXLSX,
    parseCSV,
    validateImportData,
};

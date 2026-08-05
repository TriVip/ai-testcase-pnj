import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Read the value of a cell as a plain string.
 *
 * ExcelJS returns rich objects for some cell types rather than primitives —
 * formulas carry { result }, hyperlinks carry { text }, and styled text arrives
 * as { richText: [...] }. Flattening here keeps transformRowToTestCase working
 * with plain strings regardless of how the sheet was authored.
 */
const cellToString = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();

    if (typeof value === 'object') {
        if (Array.isArray(value.richText)) {
            return value.richText.map((part) => part.text).join('');
        }
        if (value.text !== undefined) return String(value.text);
        if (value.result !== undefined) return String(value.result);
        if (value.hyperlink !== undefined) return String(value.hyperlink);
        return '';
    }

    return String(value);
};

/**
 * Parse XLSX file buffer and return array of test case objects.
 *
 * Async because ExcelJS parses from a buffer asynchronously.
 */
const parseXLSX = async (buffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    // Row 1 holds the headers; every later row becomes one object keyed by them.
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = cellToString(cell.value).trim();
    });

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const record = {};
        let hasValue = false;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const key = headers[colNumber];
            if (!key) return;
            const value = cellToString(cell.value);
            record[key] = value;
            if (value !== '') hasValue = true;
        });

        // Skip rows that are entirely blank — trailing empty rows are common in
        // hand-edited spreadsheets and would otherwise fail validation.
        if (hasValue) rows.push(record);
    });

    return rows.map(row => transformRowToTestCase(row));
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
 * Turn the Steps cell into the shape the TestCase model stores.
 *
 * The model holds steps as subdocuments ({ stepNumber, action, expectedResult }),
 * but the import format carries them as text — either pipe-separated or a JSON
 * array — so they have to be converted. Previously this returned plain strings,
 * which Mongoose could not cast, and importing the template this app generates
 * failed with a CastError.
 *
 * The sheet has one "Expected Result" column for the whole row rather than one
 * per step, so that value is attached to the final step, which is where the
 * overall outcome belongs.
 */
const parseSteps = (rawValue, rowExpectedResult) => {
    let parts = [];

    if (typeof rawValue === 'string' && rawValue.trim() !== '') {
        try {
            const fromJSON = JSON.parse(rawValue);
            parts = Array.isArray(fromJSON) ? fromJSON : [rawValue];
        } catch {
            parts = rawValue.split('|').map(s => s.trim()).filter(Boolean);
        }
    } else if (Array.isArray(rawValue)) {
        parts = rawValue;
    }

    const steps = parts.map((part, index) => {
        // A JSON array may already hold objects; keep the fields it provides.
        if (part && typeof part === 'object') {
            return {
                stepNumber: part.stepNumber ?? index + 1,
                action: String(part.action ?? ''),
                expectedResult: String(part.expectedResult ?? ''),
            };
        }
        return {
            stepNumber: index + 1,
            action: String(part),
            expectedResult: '',
        };
    });

    if (steps.length > 0 && rowExpectedResult && !steps[steps.length - 1].expectedResult) {
        steps[steps.length - 1].expectedResult = rowExpectedResult;
    }

    return steps;
};

/**
 * Transform a row from import file to test case object
 */
const transformRowToTestCase = (row) => {
    const expectedResult = row['Expected Result'] || row.expectedResult || row['Expected_Result'] || '';

    return {
        title: row.Title || row.title || '',
        description: row.Description || row.description || '',
        category: row.Category || row.category || '',
        priority: row.Priority || row.priority || 'Medium',
        steps: parseSteps(row.Steps ?? row.steps, expectedResult),
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

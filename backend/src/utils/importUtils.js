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
        // Excel writes a UTF-8 BOM at the start of CSV exports. Left in, it
        // attaches to the first header cell (so "ID" is read as "ID" plus a
        // leading zero-width character), so every row['ID'] lookup misses
        // and externalId silently comes back empty for the whole file — no
        // error, just quietly dropped data. Char code 0xFEFF, not a regex
        // escape, so the fix doesn't depend on a literal Unicode character
        // surviving edits to this file.
        let text = buffer.toString('utf8');
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        const stream = Readable.from(text);

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
 * Turn the Test steps cell into the shape the TestCase model stores.
 *
 * The model holds steps as subdocuments ({ stepNumber, action, expectedResult}).
 * The import format carries them as text, in any of three shapes:
 *   - a JSON array (optionally of {action, expectedResult} objects)
 *   - numbered, one-per-line text ("1. Do X\n2. Do Y") — the template's own
 *     format, matching how most hand-written test steps are already written
 *   - a pipe-separated single line ("Do X | Do Y"), kept for compactness
 *
 * The sheet has one "Expect results" column for the whole row rather than one
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
            if (rawValue.includes('\n')) {
                parts = rawValue
                    .split('\n')
                    .map(line => line.replace(/^\s*\d+[.)]\s*/, '').trim())
                    .filter(Boolean);
            } else {
                parts = rawValue.split('|').map(s => s.trim()).filter(Boolean);
            }
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

// Maps the execution-status values the template's dropdown offers (and their
// case-insensitive variants) onto the model's own enum. UNTESTED and BLOCKED
// have no literal equivalent in the model — neither has actually been run,
// which is what Pending means (the reason a BLOCKED row can't run yet
// belongs in, and is normally already captured by, the notes/Ghi chú
// column, not the status itself).
const normalizeExecutionStatus = (raw) => {
    const trimmed = (raw ?? '').toString().trim();
    if (!trimmed) return 'Pending';

    switch (trimmed.toUpperCase()) {
        case 'UNTESTED':
        case 'BLOCKED':
        case 'PENDING':
            return 'Pending';
        case 'PASS':
            return 'Pass';
        case 'FAIL':
        case 'FAILED':
            return 'Failed';
        case 'N/A':
        case 'NA':
            return 'N/A';
        default:
            // Fall through unrecognized as-is so validateTestCase reports it
            // clearly, rather than silently coercing to a default here.
            return trimmed;
    }
};

/**
 * Transform a row from import file to test case object.
 *
 * Column names match the current template (ID, Feature, Descriptions,
 * Pre-condition, Test steps, Test data, Expect results, Trạng thái, Phân loại
 * lỗi, Mức độ lỗi, Trạng thái fix, Actual results / Ghi chú, Bug ID). The
 * app's older column names (Title, Description, Steps, Expected Result,
 * Execution Status, Execution Notes) are still accepted as fallbacks, so a
 * file exported from an earlier version of the template still imports.
 */
const transformRowToTestCase = (row) => {
    const expectedResult = row['Expect results'] || row['Expected Result'] || row.expectedResult || '';

    // The template has one "Descriptions" column, not separate Title and
    // Description fields — the model requires both non-empty, so the same
    // text is used for each rather than inventing a shorter title.
    const descriptions = row['Descriptions'] || row.Description || row.description || row.Title || row.title || '';

    return {
        externalId: row['ID'] || row.externalId || '',
        title: descriptions,
        description: descriptions,
        feature: row['Feature'] || row.feature || 'General',
        category: row['Category'] || row.category || 'General',
        preCondition: row['Pre-condition'] || row.preCondition || '',
        testData: row['Test data'] || row.testData || '',
        priority: row['Priority'] || row.priority || 'Medium',
        steps: parseSteps(row['Test steps'] ?? row.Steps ?? row.steps, expectedResult),
        executionStatus: normalizeExecutionStatus(
            row['Trạng thái'] || row['Execution Status'] || row.executionStatus
        ),
        executionNotes: row['Actual results / Ghi chú'] || row['Execution Notes'] || row.executionNotes || '',
        bugType: row['Phân loại lỗi'] || row.bugType || undefined,
        bugSeverity: row['Mức độ lỗi'] || row.bugSeverity || undefined,
        fixStatus: row['Trạng thái fix'] || row.fixStatus || undefined,
        bugId: row['Bug ID'] || row.bugId || '',
    };
};

/**
 * Validate test case data
 */
const validateTestCase = (testCase, rowIndex) => {
    const errors = [];

    // Required fields. Category is not — the template doesn't collect it and
    // the model already defaults it to 'General', so requiring it here would
    // reject every row the current template produces.
    if (!testCase.title || testCase.title.trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Title/Descriptions is required`);
    }
    if (!testCase.description || testCase.description.trim() === '') {
        errors.push(`Row ${rowIndex + 2}: Description is required`);
    }

    const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
    if (!validPriorities.includes(testCase.priority)) {
        errors.push(`Row ${rowIndex + 2}: Priority must be one of: ${validPriorities.join(', ')}`);
    }

    const validStatuses = ['Pending', 'Pass', 'Failed', 'N/A'];
    if (!validStatuses.includes(testCase.executionStatus)) {
        errors.push(`Row ${rowIndex + 2}: Trạng thái must be one of: PASS, FAIL, UNTESTED, N/A`);
    }

    // Bug-tracking fields are optional — only validated when present, since a
    // row with no bug logged yet leaves them blank.
    if (testCase.bugType && !['Bug', 'Đề xuất'].includes(testCase.bugType)) {
        errors.push(`Row ${rowIndex + 2}: Phân loại lỗi must be one of: Bug, Đề xuất`);
    }
    if (testCase.bugSeverity && !['High', 'Medium', 'Low'].includes(testCase.bugSeverity)) {
        errors.push(`Row ${rowIndex + 2}: Mức độ lỗi must be one of: High, Medium, Low`);
    }
    if (testCase.fixStatus && !['Đã fix', 'Chưa fix', 'Không fix'].includes(testCase.fixStatus)) {
        errors.push(`Row ${rowIndex + 2}: Trạng thái fix must be one of: Đã fix, Chưa fix, Không fix`);
    }

    if (!Array.isArray(testCase.steps)) {
        errors.push(`Row ${rowIndex + 2}: Test steps must be an array`);
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

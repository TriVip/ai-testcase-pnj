import ExcelJS from 'exceljs';

// Column layout shared by the XLSX and CSV templates. `width` is only used by
// the XLSX sheet; the CSV ignores it.
const COLUMNS = [
    { header: 'Title', width: 30 },
    { header: 'Description', width: 50 },
    { header: 'Category', width: 20 },
    { header: 'Priority', width: 12 },
    { header: 'Steps', width: 60 },
    { header: 'Expected Result', width: 40 },
    { header: 'Execution Status', width: 18 },
    { header: 'Execution Notes', width: 30 },
];

// Example rows shown in both templates, demonstrating the two accepted formats
// for Steps: pipe-separated, and a JSON array.
const SAMPLE_ROWS = [
    {
        'Title': 'Login with valid credentials',
        'Description': 'Verify that user can login with valid username and password',
        'Category': 'Authentication',
        'Priority': 'High',
        'Steps': 'Navigate to login page | Enter valid username | Enter valid password | Click login button',
        'Expected Result': 'User should be redirected to dashboard',
        'Execution Status': 'Pending',
        'Execution Notes': ''
    },
    {
        'Title': 'Create new test case',
        'Description': 'Verify that user can create a new test case',
        'Category': 'Test Management',
        'Priority': 'Medium',
        'Steps': '["Click New Test Case button", "Fill in test case details", "Click Save button"]',
        'Expected Result': 'Test case should be created and displayed in the list',
        'Execution Status': 'Pending',
        'Execution Notes': ''
    }
];

/**
 * Generate XLSX template for importing test cases.
 *
 * Async because ExcelJS serialises to a buffer asynchronously.
 */
const generateXLSXTemplate = async () => {
    const sampleData = SAMPLE_ROWS;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Cases');

    // `key` matches the property names in sampleData so addRow can map them.
    worksheet.columns = COLUMNS.map(({ header, width }) => ({
        header,
        key: header,
        width,
    }));
    worksheet.getRow(1).font = { bold: true };

    sampleData.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

/**
 * Quote a CSV field per RFC 4180: wrap in double quotes when it contains a
 * comma, quote, or newline, and double any embedded quotes.
 */
const escapeCSVField = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

/**
 * Generate CSV template for importing test cases.
 *
 * Written directly rather than through a spreadsheet library — the output is a
 * fixed header row plus two sample rows, and escapeCSVField covers the quoting
 * that matters (the sample Steps value contains commas).
 */
const generateCSVTemplate = () => {
    const headers = COLUMNS.map(({ header }) => header);

    const lines = [
        headers.map(escapeCSVField).join(','),
        ...SAMPLE_ROWS.map((row) => headers.map((h) => escapeCSVField(row[h])).join(',')),
    ];

    return Buffer.from(`${lines.join('\r\n')}\r\n`, 'utf-8');
};

export {
    generateXLSXTemplate,
    generateCSVTemplate,
};

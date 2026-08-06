import ExcelJS from 'exceljs';

// Column layout shared by the XLSX and CSV templates. `width` is only used by
// the XLSX sheet; the CSV ignores it.
//
// This mirrors a real-world UAT/bug-tracking sheet a team was already using
// (headers, column order, and the dropdown values below all match it), rather
// than the app's earlier minimal layout — so a team with an existing process
// like that one can bring it in without reshaping their data by hand.
const COLUMNS = [
    { header: 'ID', width: 12 },
    { header: 'Feature', width: 26 },
    { header: 'Descriptions', width: 40 },
    { header: 'Pre-condition', width: 32 },
    { header: 'Test steps', width: 44 },
    { header: 'Test data', width: 24 },
    { header: 'Expect results', width: 40 },
    { header: 'Trạng thái', width: 12 },
    { header: 'Phân loại lỗi', width: 13 },
    { header: 'Mức độ lỗi', width: 12 },
    { header: 'Trạng thái fix', width: 13 },
    { header: 'Actual results / Ghi chú', width: 34 },
    { header: 'Bug ID', width: 10 },
];

// Enum columns get an in-cell dropdown in the XLSX template (matches the
// source sheet this layout was modeled on). Column letters are derived from
// COLUMNS' order below rather than hardcoded, so reordering COLUMNS can't
// silently point a dropdown at the wrong column.
const DROPDOWNS = {
    'Trạng thái': ['PASS', 'FAIL', 'UNTESTED', 'N/A'],
    'Phân loại lỗi': ['Bug', 'Đề xuất'],
    'Mức độ lỗi': ['High', 'Medium', 'Low'],
    'Trạng thái fix': ['Đã fix', 'Chưa fix', 'Không fix'],
};

// Example rows shown in both templates. Deliberately generic/fictional — the
// second row demonstrates the bug-tracking columns by showing a failed case
// with a logged defect; the first shows the common untested/no-bug-yet case.
const SAMPLE_ROWS = [
    {
        'ID': 'TC-001',
        'Feature': 'User Login',
        'Descriptions': 'Login succeeds with a valid username and password',
        'Pre-condition': 'Account already registered; browser is on the login page',
        'Test steps': '1. Enter a valid username\n2. Enter the matching password\n3. Click the Login button',
        'Test data': 'username: testuser01 / password: Passw0rd!',
        'Expect results': 'User is redirected to the Dashboard and their name appears top-right',
        'Trạng thái': 'UNTESTED',
        'Phân loại lỗi': '',
        'Mức độ lỗi': '',
        'Trạng thái fix': '',
        'Actual results / Ghi chú': '',
        'Bug ID': '',
    },
    {
        'ID': 'TC-002',
        'Feature': 'User Login',
        'Descriptions': 'An error message is shown when the password is wrong',
        'Pre-condition': 'Account already registered; browser is on the login page',
        'Test steps': '1. Enter a valid username\n2. Enter an incorrect password\n3. Click the Login button',
        'Test data': 'username: testuser01 / password: wrongpass',
        'Expect results': 'Inline "Invalid credentials" message is shown; user stays on the login page',
        'Trạng thái': 'FAIL',
        'Phân loại lỗi': 'Bug',
        'Mức độ lỗi': 'Medium',
        'Trạng thái fix': 'Chưa fix',
        'Actual results / Ghi chú': 'Page reloads blank instead of showing the error message',
        'Bug ID': 'BUG-101',
    },
];

/**
 * Generate XLSX template for importing test cases.
 *
 * Async because ExcelJS serialises to a buffer asynchronously.
 */
const generateXLSXTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Cases');

    // `key` matches the property names in SAMPLE_ROWS so addRow can map them.
    worksheet.columns = COLUMNS.map(({ header, width }) => ({
        header,
        key: header,
        width,
    }));
    worksheet.getRow(1).font = { bold: true };

    SAMPLE_ROWS.forEach((row) => worksheet.addRow(row));

    // In-cell dropdowns for the enum columns, applied down a generous range
    // (past the sample rows) so pasting in more data keeps the same picker.
    const DATA_VALIDATION_ROWS = 500;
    Object.entries(DROPDOWNS).forEach(([header, options]) => {
        const colNumber = COLUMNS.findIndex((c) => c.header === header) + 1;
        const colLetter = worksheet.getColumn(colNumber).letter;
        const range = `${colLetter}2:${colLetter}${DATA_VALIDATION_ROWS + 1}`;
        worksheet.dataValidations.add(range, {
            type: 'list',
            allowBlank: true,
            formulae: [`"${options.join(',')}"`],
        });
    });

    // Steps/notes columns hold multi-line text; wrap so it's readable without
    // manually resizing rows.
    for (const header of ['Test steps', 'Expect results', 'Actual results / Ghi chú']) {
        const colNumber = COLUMNS.findIndex((c) => c.header === header) + 1;
        worksheet.getColumn(colNumber).alignment = { wrapText: true, vertical: 'top' };
    }

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
 * fixed header row plus sample rows, and escapeCSVField covers the quoting
 * that matters (multi-line Test steps, commas in the sample data).
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

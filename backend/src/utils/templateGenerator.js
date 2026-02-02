import XLSX from 'xlsx';

/**
 * Generate XLSX template for importing test cases
 */
const generateXLSXTemplate = () => {
    // Define headers
    const headers = [
        'Title',
        'Description',
        'Category',
        'Priority',
        'Steps',
        'Expected Result',
        'Execution Status',
        'Execution Notes'
    ];

    // Sample data
    const sampleData = [
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

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // Set column widths
    worksheet['!cols'] = [
        { wch: 30 }, // Title
        { wch: 50 }, // Description
        { wch: 20 }, // Category
        { wch: 12 }, // Priority
        { wch: 60 }, // Steps
        { wch: 40 }, // Expected Result
        { wch: 18 }, // Execution Status
        { wch: 30 }  // Execution Notes
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

/**
 * Generate CSV template for importing test cases
 */
const generateCSVTemplate = () => {
    const headers = [
        'Title',
        'Description',
        'Category',
        'Priority',
        'Steps',
        'Expected Result',
        'Execution Status',
        'Execution Notes'
    ];

    const sampleData = [
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

    // Create worksheet and convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    return Buffer.from(csv, 'utf-8');
};

export {
    generateXLSXTemplate,
    generateCSVTemplate,
};

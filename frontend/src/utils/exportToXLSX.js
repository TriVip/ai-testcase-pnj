import * as XLSX from 'xlsx';

export const exportTestCasesToXLSX = (testCases, filename = 'test-cases.xlsx') => {
    // Prepare data for Excel
    const data = testCases.map((tc, index) => ({
        'No.': index + 1,
        'Title': tc.title,
        'Description': tc.description,
        'Priority': tc.priority,
        'Status': tc.status,
        'Category': tc.category,
        'Steps': tc.steps.map((step, i) =>
            `${i + 1}. ${step.action} | Expected: ${step.expectedResult}`
        ).join('\n'),
        'Tags': tc.tags?.join(', ') || '',
        'Created': new Date(tc.createdAt).toLocaleDateString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const columnWidths = [
        { wch: 5 },  // No.
        { wch: 30 }, // Title
        { wch: 40 }, // Description
        { wch: 10 }, // Priority
        { wch: 10 }, // Status
        { wch: 15 }, // Category
        { wch: 50 }, // Steps
        { wch: 20 }, // Tags
        { wch: 12 }, // Created
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

    // Save file
    XLSX.writeFile(workbook, filename);
};

export const exportTestPlanToXLSX = (testPlan, filename = 'test-plan.xlsx') => {
    // Prepare test plan info
    const planInfo = [
        ['Test Plan Name', testPlan.name],
        ['Description', testPlan.description],
        ['Status', testPlan.status],
        ['Start Date', testPlan.startDate ? new Date(testPlan.startDate).toLocaleDateString() : 'N/A'],
        ['End Date', testPlan.endDate ? new Date(testPlan.endDate).toLocaleDateString() : 'N/A'],
        ['Total Test Cases', testPlan.testCases?.length || 0],
        [],
    ];

    // Prepare test cases data
    const testCasesData = testPlan.testCases?.map((tc, index) => ({
        'No.': index + 1,
        'Title': tc.title,
        'Description': tc.description,
        'Priority': tc.priority,
        'Status': tc.status,
        'Category': tc.category,
    })) || [];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(planInfo);
    XLSX.utils.sheet_add_json(worksheet, testCasesData, { origin: -1 });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Plan');

    // Save file
    XLSX.writeFile(workbook, filename);
};

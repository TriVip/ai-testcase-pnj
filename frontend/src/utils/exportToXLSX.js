/**
 * Load ExcelJS on demand.
 *
 * The library is roughly as large as the rest of the app, and exporting is an
 * occasional action, so importing it at module scope would double the initial
 * bundle for every visitor. A dynamic import lets the bundler split it into its
 * own chunk that is fetched the first time someone exports. The browser caches
 * the module afterwards, so repeat exports do not re-download it.
 */
const loadExcelJS = async () => (await import('exceljs')).default;

/**
 * Write a workbook to the browser as a download.
 *
 * ExcelJS has no browser-side `writeFile`, so the buffer is wrapped in a Blob
 * and handed to a temporary anchor. The object URL is revoked afterwards to
 * avoid holding the buffer in memory for the life of the page.
 */
const downloadWorkbook = async (workbook, filename) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportTestCasesToXLSX = async (testCases, filename = 'test-cases.xlsx') => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Cases');

    worksheet.columns = [
        { header: 'No.', key: 'no', width: 5 },
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Steps', key: 'steps', width: 50 },
        { header: 'Tags', key: 'tags', width: 20 },
        { header: 'Created', key: 'created', width: 12 },
    ];
    worksheet.getRow(1).font = { bold: true };

    testCases.forEach((tc, index) => {
        worksheet.addRow({
            no: index + 1,
            title: tc.title,
            description: tc.description,
            priority: tc.priority,
            status: tc.status,
            category: tc.category,
            steps: (tc.steps || []).map((step, i) =>
                `${i + 1}. ${step.action} | Expected: ${step.expectedResult}`
            ).join('\n'),
            tags: tc.tags?.join(', ') || '',
            created: tc.createdAt ? new Date(tc.createdAt).toLocaleDateString() : '',
        });
    });

    // Steps holds newline-separated text; without this the cell renders as one
    // long line.
    worksheet.getColumn('steps').alignment = { wrapText: true, vertical: 'top' };

    await downloadWorkbook(workbook, filename);
};

export const exportTestPlanToXLSX = async (testPlan, filename = 'test-plan.xlsx') => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Plan');

    // Plan summary as label/value pairs, then a blank row before the table.
    const planInfo = [
        ['Test Plan Name', testPlan.name],
        ['Description', testPlan.description],
        ['Status', testPlan.status],
        ['Start Date', testPlan.startDate ? new Date(testPlan.startDate).toLocaleDateString() : 'N/A'],
        ['End Date', testPlan.endDate ? new Date(testPlan.endDate).toLocaleDateString() : 'N/A'],
        ['Total Test Cases', testPlan.testCases?.length || 0],
    ];
    planInfo.forEach((row) => worksheet.addRow(row));
    worksheet.getColumn(1).font = { bold: true };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
        'No.', 'Title', 'Description', 'Priority', 'Status', 'Category',
    ]);
    headerRow.font = { bold: true };

    (testPlan.testCases || []).forEach((tc, index) => {
        worksheet.addRow([
            index + 1,
            tc.title,
            tc.description,
            tc.priority,
            tc.status,
            tc.category,
        ]);
    });

    // Column 1 carries both the summary labels and the row numbers, so it is
    // sized for the labels.
    worksheet.getColumn(1).width = 18;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 15;

    await downloadWorkbook(workbook, filename);
};

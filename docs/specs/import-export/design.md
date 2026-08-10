# Import / Export — Design

Thiết kế kỹ thuật cho import/export, tổng hợp từ `ARCHITECTURE.md`.

## Import (`POST /api/testcases/import`)

- Định dạng: XLSX (via ExcelJS) hoặc CSV (via `csv-parser`), tối đa 5MB.
- Validate theo dòng (`title`, `description`, `category` bắt buộc; `priority`/`executionStatus` phải là enum hợp lệ) trước khi insert; dòng fail được báo cáo, không bị lặng lẽ bỏ hoặc lặng lẽ nhận.
- **Cột Steps**: chấp nhận JSON array (`["step 1", "step 2"]`, hoặc array các `{action, expectedResult}`) hoặc chuỗi ngăn bởi `|`. Cột "Expected Result" đơn (nếu có) gắn vào bước *cuối cùng* đã parse.
- Code liên quan: `utils/importUtils.js` (`parseXLSX`), route `routes/testCases.js` (endpoint import).

## Template generation

`utils/templateGenerator.js`:
- `generateXLSXTemplate()` → `XLSX.utils.json_to_sheet`, `book_new`, `book_append_sheet`, `XLSX.write(..., { type: 'buffer', bookType: 'xlsx' })`
- `generateCSVTemplate()` → `XLSX.utils.json_to_sheet`, `XLSX.utils.sheet_to_csv`

## Export (client-side, `exportToXLSX.js`)

Export qua ExcelJS được dynamic import (`await import('exceljs')`) thay vì bundle sẵn — ExcelJS xấp xỉ kích thước phần còn lại của app và export là thao tác thỉnh thoảng, nên ship thành chunk riêng, fetch ở lần dùng đầu.

## Phụ thuộc & bảo mật liên quan

Thư viện `xlsx` (SheetJS) dùng cho import có advisory cần vá — xem module [dependencies](../dependencies/requirements.md).

## Nguồn

- [ARCHITECTURE.md — Import/export](../platform-overview/_source/ARCHITECTURE.md)
- [DEPENDENCY_REMEDIATION.md — blast radius của xlsx](../dependencies/_source/DEPENDENCY_REMEDIATION.md)

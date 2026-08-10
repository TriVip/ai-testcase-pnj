# Dependencies Remediation — Tasks

Các bước có thật trong `DEPENDENCY_REMEDIATION.md` (F24). Tất cả chạy từ thư mục `backend/`. Trạng thái gốc: PENDING USER ACTION.

## 1. `xlsx` (SheetJS)

- [ ] `npm rm xlsx` (gỡ bản npm vulnerable).
- [ ] Cài từ SheetJS CDN:
  - Option A (always-latest): `npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`
  - Option B (khuyến nghị, pin version): ví dụ `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- [ ] Xác nhận `import XLSX from 'xlsx'` vẫn chạy nguyên (không đổi code).

## 2. `pdf-parse` (chọn một hướng)

- [ ] Option A — update in place: `npm i pdf-parse@latest` (verify `npm audit`; không đổi code nếu API vẫn trả `{ text }`).
- [ ] Option B-1 — drop-in fork: `npm rm pdf-parse && npm i pdf-parse-fork`, đổi import trong `fileParser.js` sang `pdf-parse-fork`.
- [ ] Option B-2 — pdfjs-dist: `npm rm pdf-parse && npm i pdfjs-dist`, thay nhánh `application/pdf` bằng routine trích text page-by-page (`getTextContent()`).

## 3. Verify sau khi vá

- [ ] `npm audit` — advisory `xlsx`/`pdf-parse` đã hết (hoặc còn note transitive không exploit).
- [ ] Import path XLSX/CSV: upload `.xlsx` và `.csv` qua endpoint import, xác nhận rows parse thành test case.
- [ ] Template download: tải template XLSX và CSV, mở đúng.
- [ ] PDF extraction: upload `.pdf` trong luồng AI suggestion, xác nhận trích text (`routes/ai.js` → `extractTextFromFile`).
- [ ] Commit `backend/package.json` + lockfile.

## Nguồn

- [DEPENDENCY_REMEDIATION.md](_source/DEPENDENCY_REMEDIATION.md)

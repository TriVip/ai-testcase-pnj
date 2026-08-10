# Dependencies Remediation — Requirements

Module vá hai dependency backend bị flag (vulnerable/unmaintained): `xlsx` và `pdf-parse`. Tổng hợp từ DEPENDENCY_REMEDIATION.md (F24).

Trạng thái gốc: **PENDING USER ACTION** — tài liệu chỉ mô tả remediation khuyến nghị; chưa chạy `npm install`, chưa đổi version nào trong `package.json`/lockfile như một phần của task F24.

## User Stories & Acceptance Criteria

### US-1: Là người vận hành, tôi muốn thay `xlsx` npm bằng bản CDN đã vá.

- WHERE `xlsx@0.18.5` (npm) THE SYSTEM SHALL bị coi là có advisory không có bản vá trên npm registry: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) và ReDoS (GHSA-5pgg-2g8v-p4x9).
- WHEN vá THE SYSTEM SHALL gỡ bản npm (`npm rm xlsx`) và cài từ SheetJS CDN (`npm i https://cdn.sheetjs.com/...tgz`), ưu tiên pin version cụ thể để lockfile ghi nguồn deterministic.
- WHEN cài từ CDN THE SYSTEM SHALL giữ nguyên tên import `xlsx` — không cần đổi source code.

### US-2: Là người vận hành, tôi muốn cập nhật/thay `pdf-parse`.

- WHERE `pdf-parse@1.1.1` THE SYSTEM SHALL bị coi là cũ/effectively unmaintained.
- WHEN vá THE SYSTEM SHALL chọn một trong: (A) update in place `pdf-parse@latest` nếu có bản an toàn; (B-1) thay bằng `pdf-parse-fork` (đổi import, giữ API); (B-2) thay bằng `pdfjs-dist` (cần wrapper trích text page-by-page).
- WHEN đổi THE SYSTEM SHALL chỉ ảnh hưởng `backend/src/utils/fileParser.js` (nơi duy nhất dùng `pdf-parse`).

> Khuyến nghị gốc: bắt đầu với Option B-1 (`pdf-parse-fork`) cho thay đổi nhỏ nhất với lợi ích maintenance lớn nhất; chuyển sang `pdfjs-dist` nếu muốn bản maintained nhất và chấp nhận thêm wrapper code.

### US-3: Là người vận hành, tôi muốn verify sau khi vá.

- WHEN verify THE SYSTEM SHALL: chạy `npm audit` xác nhận advisory `xlsx`/`pdf-parse` đã hết; import XLSX và CSV parse thành công; tải template XLSX và CSV mở đúng; upload PDF trong luồng AI suggestion trích text được; commit `package.json` + lockfile (lockfile được track từ F22 nên nguồn/version được ghi cho reproducible builds).

## Blast radius (từ tài liệu gốc)

- `xlsx` dùng ở: `utils/importUtils.js` (`parseXLSX`), `utils/templateGenerator.js` (`generateXLSXTemplate`, `generateCSVTemplate`), route `routes/testCases.js` (import + template download). API `XLSX.read`/`write`/`utils.*` không đổi ở bản CDN → upgrade drop-in.
- `pdf-parse` dùng ở: `utils/fileParser.js` (`extractTextFromFile`, nhánh `application/pdf`); caller `routes/ai.js` khi upload file cho AI suggestion.

## Nguồn

- [DEPENDENCY_REMEDIATION.md](_source/DEPENDENCY_REMEDIATION.md)

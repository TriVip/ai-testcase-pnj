# Import / Export — Requirements

Module import test case từ XLSX/CSV (có validate) và export test case/test plan ra XLSX (phía client). Tổng hợp từ Feature Specification, User Guide và Architecture.

Trạng thái: 🟢 shipped.

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn import test case hàng loạt từ file XLSX hoặc CSV.

- WHEN người dùng upload file import THE SYSTEM SHALL chấp nhận XLSX (qua ExcelJS) hoặc CSV (qua `csv-parser`), tối đa 5MB.
- WHEN xử lý từng dòng THE SYSTEM SHALL validate trước khi insert: `title`, `description`, `category` bắt buộc; `priority`/`executionStatus` phải là giá trị enum hợp lệ.
- WHEN một dòng fail validation THE SYSTEM SHALL báo cáo dòng đó (không lặng lẽ bỏ qua cũng không lặng lẽ nhận), kèm chi tiết lỗi.

### US-2: Là người dùng, tôi muốn nhập steps theo nhiều định dạng linh hoạt.

- WHEN cột Steps là JSON array (`["step 1", "step 2"]` hoặc array các object `{action, expectedResult}`) THE SYSTEM SHALL parse thành các bước.
- WHEN cột Steps là chuỗi ngăn cách bởi dấu `|` (`"step 1 | step 2"`) THE SYSTEM SHALL parse thành các bước.
- WHEN có một cột "Expected Result" đơn THE SYSTEM SHALL gắn nó vào bước *cuối cùng* đã parse.

### US-3: Là người dùng, tôi muốn tải template mẫu để biết đúng định dạng.

- WHEN người dùng tải template THE SYSTEM SHALL cung cấp bản XLSX hoặc CSV thể hiện đúng các cột kỳ vọng và hai dòng ví dụ.

### US-4: Là người dùng, tôi muốn export test case hoặc test plan ra XLSX.

- WHEN người dùng export test case (đang lọc/đang chọn) hoặc cả một test plan THE SYSTEM SHALL sinh file XLSX phía client (không round-trip lên server ngoài dữ liệu).
- WHERE export một test plan THE SYSTEM SHALL gồm khối tổng quan + bảng test case đầy đủ.

## Nguồn

- [FEATURES.md — Import / export](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 6](../platform-overview/_source/USER_GUIDE.md)
- [ARCHITECTURE.md — Import/export](../platform-overview/_source/ARCHITECTURE.md)

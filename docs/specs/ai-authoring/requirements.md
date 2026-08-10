# AI-Assisted Authoring — Requirements

Module tạo/cải thiện test case và test plan bằng OpenAI GPT: AI Test Case Suggestions, AI Test Plan Generator, AI Improve Test Case. Tổng hợp từ AI_FEATURES.md, FEATURES.md, USER_GUIDE.md và ARCHITECTURE.md.

Trạng thái: 🟢 shipped (cần `OPENAI_API_KEY`; không có key thì các endpoint AI fail, phần còn lại của app vẫn chạy).

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn AI gợi ý test case từ mô tả feature.

- WHEN người dùng nhập mô tả feature (tuỳ chọn đính kèm file TXT/PDF/DOCX làm ngữ cảnh) và yêu cầu gợi ý THE SYSTEM SHALL trả về một batch test case bao phủ happy path, edge cases, error handling.
- WHEN AI trả kết quả THE SYSTEM SHALL để người dùng chọn test case nào muốn thêm; hệ thống KHÔNG tự ghi vào database.
- WHERE mỗi test case gợi ý THE SYSTEM SHALL gồm Title, Description, Steps, Priority, Category.

### US-2: Là người dùng, tôi muốn AI tạo nguyên một test plan từ mô tả dự án.

- WHEN người dùng nhập mô tả project/feature-set và yêu cầu tạo test plan THE SYSTEM SHALL trả về plan tổ chức theo scenario, mỗi scenario có vài test case chi tiết.
- WHEN người dùng xác nhận tạo THE SYSTEM SHALL tạo test plan cùng các test case tương ứng.

### US-3: Là người dùng, tôi muốn AI cải thiện một test case đã có.

- WHEN người dùng chọn Improve trên một test case đã viết THE SYSTEM SHALL trả về bản viết lại rõ ràng/đầy đủ hơn (rõ steps, thêm test data, cải thiện expected results) để người dùng chấp nhận hoặc bỏ.

### US-4: Là người vận hành, tôi muốn AI được cấu hình và giới hạn tần suất.

- WHEN AI được cấu hình THE SYSTEM SHALL đọc `OPENAI_API_KEY` và `OPENAI_MODEL` (mặc định `gpt-3.5-turbo`) từ môi trường.
- WHEN `OPENAI_API_KEY` không được cấu hình THE SYSTEM SHALL báo lỗi rõ ràng ở các endpoint AI mà không phá vỡ phần còn lại của app.
- WHEN người dùng gọi `/api/ai/*` quá 30 lần trong 15 phút THE SYSTEM SHALL chặn request vượt ngưỡng (mỗi call là một call API tính phí).
- WHEN mọi route AI được gọi THE SYSTEM SHALL yêu cầu phiên đăng nhập hợp lệ.

### US-5: Là người dùng, tôi muốn output AI khớp ngôn ngữ input.

- WHEN mô tả input bằng tiếng Việt THE SYSTEM SHALL yêu cầu model trả lời bằng tiếng Việt; ngược lại tiếng Anh.

### US-6 (đã biết/behavior): Là người vận hành, tôi cần biết prompt hiện gắn cứng domain PNJ.

- WHEN AI sinh gợi ý THE SYSTEM SHALL đóng khung theo ngữ cảnh e-commerce trang sức PNJ (Phú Nhuận Jewelry) bất kể input mô tả gì — đây là chủ đích cho deployment này, không phải bug. Genericize là thay đổi prompt trong `services/openai.js`.

> Behavior khác đã ghi trong ARCHITECTURE.md: mỗi capability thực hiện một call `chat.completions.create`, trích JSON array/object đầu tiên trong response qua regex (`extractJSON`); **không** dùng `response_format: json_object`, **không** retry lỗi tạm thời, **không** backoff. `insufficient_quota` và `invalid_api_key` được map thành thông báo thân thiện; lỗi khác propagate nguyên message của OpenAI.

## Nguồn

- [AI_FEATURES.md](_source/AI_FEATURES.md)
- [FEATURES.md — AI-assisted authoring](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 5](../platform-overview/_source/USER_GUIDE.md)
- [ARCHITECTURE.md — AI integration (services/openai.js)](../platform-overview/_source/ARCHITECTURE.md)

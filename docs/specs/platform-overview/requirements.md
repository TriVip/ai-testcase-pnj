# Platform Overview — Requirements

Spec tổng quan toàn nền tảng **AI Test Case Generator**. Đây là spec cross-cutting, tổng hợp từ ba tài liệu gốc (Architecture, Feature Specification, User Guide). Các module con (accounts-workspaces, test-case-management, test-plans, ai-authoring, import-export, jira-integration) đi sâu vào từng phần.

## Trạng thái tính năng (từ FEATURES.md)

Ký hiệu: 🟢 đã ship và hoạt động · 🟡 đã ship nhưng có điều kiện/chưa bật · ⚪ chưa triển khai (roadmap/placeholder).

| Nhóm tính năng | Trạng thái |
|---|---|
| Accounts & workspaces | 🟢 |
| Test case management | 🟢 |
| Test plans | 🟢 |
| AI-assisted authoring | 🟢 (cần `OPENAI_API_KEY`) |
| Import / export | 🟢 |
| Jira integration | 🟡 đã code, chưa bật |
| Automation testing | ⚪ chưa triển khai |

## User Stories & Acceptance Criteria

### US-1: Là một người dùng, tôi muốn mọi route (trừ auth/health) đều yêu cầu phiên đăng nhập hợp lệ để dữ liệu được bảo vệ.

- WHEN một request tới bất kỳ route nào ngoài `/api/auth/*` và `/health` mà không có phiên hợp lệ THE SYSTEM SHALL từ chối truy cập.
- WHEN một request tới `/api/auth/*` hoặc `/health` THE SYSTEM SHALL không yêu cầu phiên đăng nhập.

### US-2: Là một người dùng, tôi muốn dữ liệu được scope theo workspace ở phía server, bất kể client khai báo gì.

- WHEN một client gửi header `x-workspace-id` THE SYSTEM SHALL xác minh người dùng là thành viên của workspace đó trước khi trả/ghi dữ liệu, ngược lại trả về HTTP 403 (`code: WORKSPACE_ACCESS_DENIED`).
- WHEN không có header `x-workspace-id` THE SYSTEM SHALL scope dữ liệu về `{ user: req.userId }` (dữ liệu cá nhân).

### US-3: Là người vận hành, tôi muốn các nhóm route tốn kém/nhạy cảm bị giới hạn tần suất để hạn chế chi phí và lạm dụng.

- WHEN người dùng gọi `/api/auth/register` hoặc `/login` quá 10 lần trong 15 phút THE SYSTEM SHALL chặn request vượt ngưỡng.
- WHEN người dùng gọi `/api/ai/*` quá 30 lần trong 15 phút THE SYSTEM SHALL chặn request vượt ngưỡng.
- WHEN người dùng gọi DELETE/batch-delete test case hoặc test plan quá 10 lần trong 10 giây THE SYSTEM SHALL chặn request vượt ngưỡng.

### US-4: Là một người dùng, tôi muốn nhận cập nhật real-time khi trạng thái thực thi test case thay đổi.

- WHEN `executionStatus` của một test case thay đổi qua `PUT /api/testcases/:id` THE SYSTEM SHALL phát sự kiện `testCaseStatusUpdated` tới mọi test plan room chứa test case đó.
- WHEN một client yêu cầu join room của một test plan THE SYSTEM SHALL kiểm tra quyền (chủ plan hoặc thành viên workspace của plan) trước khi cho phép join.

### US-5: Là một người dùng, tôi muốn ứng dụng chỉ chấp nhận body JSON cho các request thay đổi dữ liệu.

- WHEN backend nhận request THE SYSTEM SHALL chỉ chấp nhận body `application/json` (không mount `express.urlencoded()`), trừ upload file multipart trên các route có opt-in.

## Ràng buộc & phạm vi đã biết (từ ARCHITECTURE.md — Known gaps)

- Jira integration đã code (`routes/jira.js`) nhưng `app.use('/api/jira', ...)` bị comment trong `server.js` → nút UI hiện 404. Xem module `jira-integration`.
- Trang Automation Testing chỉ là placeholder, không có backend. Xem module `automation-runner`.
- Docker build không hoàn toàn reproducible: `package-lock.json` ở root nằm ngoài build context của `backend`/`frontend` nên Dockerfile dùng `npm install` thay vì `npm ci`. Xem module `deployment`.

## Nguồn

- [ARCHITECTURE.md](_source/ARCHITECTURE.md)
- [FEATURES.md](_source/FEATURES.md)
- [USER_GUIDE.md](_source/USER_GUIDE.md)

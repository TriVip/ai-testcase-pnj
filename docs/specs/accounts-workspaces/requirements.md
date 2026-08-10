# Accounts & Workspaces — Requirements

Module quản lý tài khoản (đăng ký/đăng nhập bằng username/password) và workspace (không gian làm việc cá nhân/nhóm). Tổng hợp từ các phần liên quan trong Architecture, Feature Specification và User Guide.

Trạng thái: 🟢 shipped.

## User Stories & Acceptance Criteria

### US-1: Là người dùng mới, tôi muốn đăng ký bằng username/password để tạo tài khoản.

- WHEN người dùng gửi đăng ký với username, password, email, full name THE SYSTEM SHALL tạo tài khoản và tự động đăng nhập, chuyển tới Dashboard.
- WHEN mật khẩu ngắn hơn 8 ký tự THE SYSTEM SHALL từ chối (mật khẩu phải từ 8 ký tự trở lên).
- WHEN đăng ký/đăng nhập thành công THE SYSTEM SHALL phát hành JWT (`{ userId }`, hết hạn 7 ngày) và set vào cookie `httpOnly` tên `token`, không trả token trong response body.

> Lưu ý: không có third-party OAuth — bản Google OAuth trước đây đã bị gỡ.

### US-2: Là người dùng, tôi muốn đăng nhập lại bằng username + password.

- WHEN người dùng đăng nhập với username + password hợp lệ THE SYSTEM SHALL xác thực qua bcrypt và cấp phiên.
- WHEN bản ghi mật khẩu là plaintext legacy (từ phiên bản trước bcrypt) THE SYSTEM SHALL phát hiện qua prefix (`$2a$`/`$2b$`/`$2y$` vs không) và tự rehash trong lần đăng nhập thành công kế tiếp.

> Không có luồng "quên mật khẩu" tự động — cần quản trị viên hỗ trợ trực tiếp trên database.

### US-3: Là người dùng, tôi muốn có sẵn một Personal Workspace riêng tư.

- WHEN người dùng login/register/kiểm tra current-user lần đầu THE SYSTEM SHALL tạo lazy đúng một personal workspace cho người dùng đó (xem `ensurePersonalWorkspace`).
- WHEN dữ liệu được tạo mà không chọn workspace cụ thể THE SYSTEM SHALL giữ dữ liệu đó riêng tư cho chính người dùng.

### US-4: Là người dùng, tôi muốn tạo workspace nhóm và mời thành viên để làm việc chung.

- WHEN người dùng tạo một workspace mới (non-personal) THE SYSTEM SHALL cho phép và ghi nhận người tạo là `createdBy`.
- WHEN người tạo workspace mời một người dùng đã đăng ký bằng email THE SYSTEM SHALL thêm người đó vào `members`.
- WHEN người không phải người tạo cố mời thành viên THE SYSTEM SHALL từ chối (chỉ người tạo workspace mới được mời).
- WHEN nhiều người là thành viên của cùng một workspace THE SYSTEM SHALL cho họ thấy chung bộ test case/test plan trong workspace đó.

### US-5: Là người dùng, tôi muốn chuyển workspace đang hoạt động để đổi phạm vi dữ liệu hiển thị.

- WHEN người dùng chọn một workspace khác trong selector ở sidebar THE SYSTEM SHALL scope test case/test plan hiển thị theo workspace đó.
- WHEN client gửi `x-workspace-id` mà người dùng không phải thành viên THE SYSTEM SHALL trả HTTP 403 với `code: WORKSPACE_ACCESS_DENIED` (không lộ dữ liệu người khác).

### US-6: Là người dùng, tôi muốn phiên tự phục hồi khi mất quyền vào workspace đang chọn.

- WHEN quyền truy cập workspace đang chọn bị thu hồi (bị gỡ khỏi members, hoặc workspace bị xoá) trong lúc app đang mở THE SYSTEM SHALL phát hiện ở request kế tiếp, tự chuyển về personal workspace và hiển thị thông báo một dòng, không báo lỗi hay bắt reload thủ công.
- WHEN response trả về `code: WORKSPACE_ACCESS_DENIED` THE SYSTEM SHALL (ở frontend) bỏ workspace id đã cache, refetch qua `WorkspaceContext`, và retry request một lần không kèm workspace header.

## Nguồn

- [ARCHITECTURE.md — Authentication](../platform-overview/_source/ARCHITECTURE.md)
- [ARCHITECTURE.md — Authorization / workspace scoping](../platform-overview/_source/ARCHITECTURE.md)
- [FEATURES.md — Accounts & workspaces](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 1 & 2](../platform-overview/_source/USER_GUIDE.md)

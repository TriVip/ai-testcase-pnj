# Accounts & Workspaces — Design

Thiết kế kỹ thuật cho xác thực và phân quyền theo workspace, tổng hợp từ `ARCHITECTURE.md`.

## Authentication

- `POST /api/auth/register` và `/login` phát hành JWT (`{ userId }`, hết hạn 7 ngày) và set cookie `httpOnly` tên `token`. Token không bao giờ trả trong response body — XSS ở frontend không đọc được qua `document.cookie` hay JS.
- **Hash mật khẩu**: bcrypt, cost factor 12, qua Mongoose hook `pre('save')` trên `User`. Bản ghi plaintext legacy được phát hiện qua prefix và tự rehash ở lần login thành công kế tiếp (`comparePassword`/`isPasswordPlaintext` trong `models/User.js`).
- `middleware/auth.js#isAuthenticated` đọc cookie (hoặc header `Authorization: Bearer` cho client không phải browser), verify với `JWT_SECRET`, và set `req.userId`.
- **Cookie attributes**: mặc định `Secure`, `SameSite=None`, `maxAge` 7 ngày — cần cho frontend khác origin với API. `COOKIE_SECURE=false` hạ xuống `SameSite=Lax`, không `Secure`, cho deployment HTTP thuần; không bao giờ set khi có TLS.
- `JWT_SECRET` không có fallback. `server.js` từ chối khởi động nếu thiếu, dưới 32 ký tự, hoặc là một placeholder đã biết.

## Authorization — workspace scoping

Active workspace do client cung cấp: frontend gửi qua header `x-workspace-id`, lấy từ `localStorage`. Vì giá trị này hoàn toàn do client kiểm soát, mọi read/write tôn trọng nó đều đi qua `utils/workspaceAccess.js`:

- `buildScopeQuery(req, extra)` — không có header → scope về `{ user: req.userId }`. Có header → verify `req.userId` nằm trong `workspace.members` (`userCanAccessWorkspace`) trước khi scope về `{ workspace: workspaceId }`; nếu không phải thành viên → ném `WorkspaceAccessError` (HTTP 403, `code: WORKSPACE_ACCESS_DENIED`).
- `resolveWorkspaceForWrite(req)` — cùng kiểm tra membership, cho workspace mà một bản ghi *mới* sẽ được tạo trong đó.

## Personal workspace

```
Workspace
 ├─ createdBy: User, members: [User], isPersonal: bool
```

Mỗi user có đúng một personal workspace, tạo lazy ở lần login/register/current-user check đầu tiên (`ensurePersonalWorkspace` trong `auth.js`).

## Frontend recovery flow

Axios response interceptor (`services/api.js`) theo dõi riêng `code: WORKSPACE_ACCESS_DENIED`: khi gặp (và chỉ khi đó — các 403 khác như "không có quyền mời thành viên" được để nguyên) nó bỏ workspace id cache, báo `WorkspaceContext` refetch, và retry request một lần không kèm workspace header. Đây là cơ chế phục hồi phiên khi workspace bị xoá hoặc user bị gỡ khỏi nó trong lúc app đang mở.

## Nguồn

- [ARCHITECTURE.md — Authentication](../platform-overview/_source/ARCHITECTURE.md)
- [ARCHITECTURE.md — Authorization / workspace scoping](../platform-overview/_source/ARCHITECTURE.md)

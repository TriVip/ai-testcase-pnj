# Jira Integration — Requirements

Module tạo Jira ticket từ test case bị Failed. Tổng hợp từ Feature Specification, User Guide, Architecture và Deployment.

Trạng thái: 🟡 **đã code, chưa bật** — route chưa mount trong `server.js`, nút UI hiện trả 404.

## User Stories & Acceptance Criteria

### US-1: Là người dùng, tôi muốn tạo Jira ticket từ một test case bị Failed trong test plan.

- WHEN người dùng bấm "Create Jira Ticket" trên một test case đánh dấu `Failed` trong test plan THE SYSTEM SHALL (khi được bật) tạo một Jira Cloud issue pre-populated với description, steps và execution notes của test case.
- WHEN ticket được tạo THE SYSTEM SHALL lưu link ticket vào `jiraTicketUrl` của test case.
- WHEN route Jira chưa được mount THE SYSTEM SHALL trả 404 khi bấm nút (trạng thái hiện tại).

### US-2: Là người vận hành, tôi muốn bật tính năng Jira qua cấu hình.

- WHEN muốn bật THE SYSTEM SHALL yêu cầu uncomment dòng `app.use('/api/jira', jiraRoutes)` trong `server.js` và set bốn biến môi trường `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`.
- WHEN các biến `JIRA_*` chưa set THE SYSTEM SHALL coi tính năng là không liên quan (chỉ cần khi mount `routes/jira.js`).

### US-3 (quyết định cần người dùng): xử lý phần UI dead.

- Tài liệu gốc nêu hai lựa chọn: mount route (và set `JIRA_*`) HOẶC gỡ affordance UI dead. 
- > TODO: chưa có trong tài liệu gốc — quyết định cuối cùng (bật hẳn hay gỡ nút).

## Chi tiết triển khai đã biết (từ ARCHITECTURE.md)

`routes/jira.js` implement `POST /api/jira/ticket` (tạo Jira Cloud issue từ test case Failed qua các env var `JIRA_*`); UI Test Plans có nút "Create Jira Ticket" gọi tới nó — nhưng `app.use('/api/jira', jiraRoutes)` bị comment trong `server.js`, nên bấm hiện 404.

## Nguồn

- [FEATURES.md — Jira integration](../platform-overview/_source/FEATURES.md)
- [USER_GUIDE.md — mục 7](../platform-overview/_source/USER_GUIDE.md)
- [ARCHITECTURE.md — Known gaps](../platform-overview/_source/ARCHITECTURE.md)
- [DEPLOYMENT.md — biến JIRA_*](../deployment/_source/DEPLOYMENT.md)

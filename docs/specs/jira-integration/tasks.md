# Jira Integration — Tasks

Hạng mục để bật tính năng Jira, suy ra từ tài liệu gốc (ARCHITECTURE Known gaps, DEPLOYMENT).

- [ ] Uncomment `app.use('/api/jira', jiraRoutes)` trong `server.js`.
- [ ] Set bốn biến môi trường: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`.
- [ ] (Thay thế) Nếu không bật: gỡ affordance UI "Create Jira Ticket" đang dead để tránh 404.

> TODO: chưa có trong tài liệu gốc — không có checklist bước-chi-tiết hơn (ví dụ test end-to-end tạo ticket) trong tài liệu gốc.

## Nguồn

- [ARCHITECTURE.md — Known gaps](../platform-overview/_source/ARCHITECTURE.md)
- [DEPLOYMENT.md — biến JIRA_*](../deployment/_source/DEPLOYMENT.md)
- [FEATURES.md — Jira integration](../platform-overview/_source/FEATURES.md)

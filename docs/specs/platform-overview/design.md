# Platform Overview — Design

Tổng hợp thiết kế kỹ thuật toàn nền tảng từ `ARCHITECTURE.md`. Chi tiết theo module nằm trong các spec con.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js (ESM), Express 4, Mongoose 8 |
| Frontend | React 18, Vite 7, React Router 7 |
| Database | MongoDB (Atlas hoặc self-hosted) |
| Real-time | Socket.io 4 |
| AI | OpenAI API (`gpt-3.5-turbo` mặc định, cấu hình được) |
| Auth | JWT trong cookie `httpOnly`, bcrypt hash mật khẩu |
| Deployment | Docker Compose: hai container (`backend`, `frontend`) + MongoDB ngoài |

Repo là monorepo npm workspaces (`backend/`, `frontend/`, `shared/`) với một lockfile ở root.

## Directory layout (rút gọn từ ARCHITECTURE.md)

```
backend/src/
  config/database.js        Kết nối Mongoose
  middleware/
    auth.js                 isAuthenticated — verify JWT cookie, set req.userId
    rateLimit.js            Rate limiter in-memory per-identity, per-endpoint
  models/                   User, Workspace, TestCase, TestPlan (Mongoose schemas)
  routes/                   auth, testCases, testPlans, ai, workspaces, jira (unmounted)
  services/openai.js        Dựng prompt OpenAI, parse response
  utils/
    workspaceAccess.js      Scope query theo membership workspace
    importUtils.js          Parse XLSX/CSV → TestCase
    templateGenerator.js    Sinh template import XLSX/CSV
    fileParser.js           Trích text TXT/PDF/DOCX cho input AI
  server.js                 App wiring: middleware order, Socket.io, routes, error handler

frontend/src/
  pages/                    Dashboard, TestCases, TestPlans, Automation (stub), Login
  components/               Modals, forms, AppShell/Sidebar/Navbar, Toast
  contexts/                 AuthContext, WorkspaceContext
  services/
    api.js                  Axios; interceptor gắn x-workspace-id, phục hồi workspace id cũ
    socket.js               Socket.io client, manual connect
  utils/exportToXLSX.js     Export XLSX phía client (ExcelJS, lazy-loaded)
```

## Data model (từ ARCHITECTURE.md)

```
User
 ├─ username (unique, sparse), email (unique), password (bcrypt hash), name, picture

Workspace
 ├─ createdBy: User, members: [User], isPersonal: bool
 │  Mỗi user có đúng một personal workspace, tạo lazy ở lần login/register/current-user đầu tiên.

TestCase
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ title, description, steps: [{stepNumber, action, expectedResult}]
 ├─ priority: Low|Medium|High|Critical
 ├─ status: Draft|Active|Deprecated
 ├─ executionStatus: Pending|Pass|Failed, executionNotes
 ├─ category, feature, tags: [String]
 └─ jiraTicketUrl (do Jira integration set — hiện chưa mount)

TestPlan
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ name, description, testCases: [TestCase]
 ├─ status: Planning|In Progress|Completed|On Hold|Obsolete
 ├─ startDate, endDate
 └─ executionStatus, executionNotes (rollup cấp plan, tách khỏi từng TestCase)
```

`workspace` là optional theo schema nhưng thực tế mọi write path đều resolve một workspace (active workspace của caller, hoặc personal workspace làm mặc định ngầm khi không có header `x-workspace-id`).

## Các cơ chế cross-cutting

- **Mass-assignment protection**: POST/PUT test case & test plan whitelist field qua `ALLOWED_FIELDS`; `user` và `workspace` luôn set từ context, không nhận từ body.
- **CORS & cookie transport**: `cors({ origin: FRONTEND_URL, credentials: true })`; chỉ chấp nhận `application/json`; `helmet()` cho security headers (CSP tắt vì process chỉ phục vụ JSON).
- **Real-time**: Socket.io handshake auth bằng cùng JWT với REST; room theo test plan id; kiểm tra quyền khi join.
- **AI integration**: ba capability trong `services/openai.js` — xem module `ai-authoring`.
- **Import/export**: import XLSX/CSV ≤ 5MB có validate; export XLSX phía client — xem module `import-export`.

## Nguồn

- [ARCHITECTURE.md](_source/ARCHITECTURE.md)
- [FEATURES.md](_source/FEATURES.md)
- [USER_GUIDE.md](_source/USER_GUIDE.md)

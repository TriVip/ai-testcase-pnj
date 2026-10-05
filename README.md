# AI Test Case Generator (QA Manager) 🚀

A comprehensive, full-stack AI-powered test case and test plan management platform built for modern QA and engineering teams. Features real-time collaboration, workspace data isolation, bug tracking, AI-assisted authoring, and Excel/CSV import/export.

---

## Features ✨

- 🔐 **Secure Authentication** — Username/email & password login with bcrypt hashing (12 rounds) and JWT in `httpOnly` secure cookies.
- 🏢 **Multi-Tenant Workspaces** — Personal and team workspaces with strict member-level authorization and anti-IDOR isolation. The selected workspace is remembered server-side, so it follows you across devices.
- 🗂️ **Projects** — Tag test cases with a project (mPOS, eOffice, Website, OmniHub, CDP, Promotion Engine, POB), view them grouped by project, and bulk-move selections between projects.
- 📝 **Test Case Management** — Rich test cases with preconditions, test data, ordered steps, priority, category, feature modules, tags, execution attribution, and server-side pagination.
- 📋 **Test Plan Management** — Group test cases into structured plans with natural-order module categorization, progress KPI bars, and deep-linking navigation. The test-case picker supports search and filters.
- 📈 **Dashboard** — KPI tiles plus an execution-status donut and a per-project stacked bar chart.
- 🔄 **Plan Status Auto-Sync** — Real-time auto-computation of plan pass/fail status derived from test cases' bug tracking resolution (veto rule).
- 🐛 **Integrated Bug Tracking** — Log defect types, severity, fix status, and bug IDs directly on failed test cases, aggregated in a dedicated Bug Tracking view.
- 🤖 **AI-Powered Generation** — Generate comprehensive test cases from descriptions or uploaded documents (TXT/PDF/DOCX), suggest complete test plans, and improve existing test cases using OpenAI.
- ⚡ **Real-Time Updates** — Live status synchronization across active teammates via authenticated Socket.io rooms.
- 📊 **Excel & CSV Import/Export** — Import spreadsheets with validation against a pre-built downloadable template (including the Project column), with client-side XLSX export. Imports are all-or-nothing: one invalid row rejects the whole file.
- 🎨 **Enterprise Design System** — Data-dense, power-user UI supporting light & dark themes with keyboard shortcuts (`Cmd/Ctrl + 1-5`, `/` for search).
- 🧪 **Automated Test Suite** — Fast unit and integration tests covering authentication, workspace scoping, model constraints, rate limiting, and business logic.

---

## Tech Stack 💻

### Frontend
- **React 18** — Component-based UI library
- **Vite 7** — High-speed build tool and dev server
- **React Router 7** — Client-side SPA routing with deep-state navigation
- **Tailwind CSS & CSS Custom Properties** — Modular design system with dark mode
- **Socket.io Client** — Real-time event streaming
- **Axios** — HTTP client with automated workspace recovery interceptors
- **ExcelJS** — In-browser spreadsheet generation
- **Recharts** — SVG charts on the Dashboard (lazy-loaded)

### Backend
- **Node.js (ESM)** — Runtime environment (>= 18.0.0)
- **Express.js 4** — REST API framework
- **MongoDB & Mongoose 8** — Database and ODM with automated indexing & enum handling
- **Socket.io 4** — Authenticated WebSocket rooms
- **OpenAI API** — AI generation engine (`gpt-3.5-turbo` / configurable)
- **Bcrypt.js** — Salted password hashing with legacy migration
- **Helmet & Rate Limiting** — Security headers and per-identity rate limiting

---

## Prerequisites 📋

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **OpenAI API Key** (from [OpenAI Platform](https://platform.openai.com/))

---

## Setup Instructions 🛠️

### 1. Clone & Install Dependencies

```bash
cd ai-testcase-gen
npm run install:all
```

### 2. Configure Environment Variables

The backend reads `.env` from the repository root. Copy the example:

```bash
cp .env.example .env
```

Configure your variables in `.env`:

```env
# Server Configuration
PORT=9999
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Connection (Local MongoDB or Atlas URI)
MONGODB_URI=mongodb://localhost:27017/testcase-gen

# JWT Secret (Must be >= 32 characters of random data)
# Generate with: openssl rand -base64 48
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars-length

# OpenAI API Key
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Session Cookie Setting
# Set to 'false' only for plain HTTP deployments without TLS (e.g. a bare VM IP)
COOKIE_SECURE=true
```

The frontend needs no `.env` locally: Vite proxies `/api` and Socket.io to `http://127.0.0.1:9999`. Set `VITE_API_URL` (the backend origin) only when the frontend is hosted separately, as on Cloudflare Pages.

### 3. Run the Application

```bash
# Run both frontend (5173) and backend (9999) concurrently
npm run dev

# Or run individually:
npm run dev:backend   # API server on http://localhost:9999
npm run dev:frontend  # Vite dev server on http://localhost:5173
```

---

## Deployment 🚀

Production runs on free tiers:

| Part | Host | URL |
|---|---|---|
| Frontend | Cloudflare Pages | https://ai-testcase-pnj.pages.dev |
| Backend | Render (`render.yaml`) | https://testcase-gen-backend.onrender.com |
| Database | MongoDB Atlas M0 | — |

Merging to `main` redeploys both automatically. Render's free tier sleeps after ~15 minutes idle, so the first request after that can take 30–60s. `FRONTEND_URL` on Render must exactly match the Pages origin (CORS and cookies). Setup steps and caveats are in [docs/specs/deployment/_source/DEPLOYMENT.md](docs/specs/deployment/_source/DEPLOYMENT.md). `docker-compose.yml` still works for a self-hosted VM.

---

## Running Tests 🧪

Execute the backend automated test suite:

```bash
npm test
```

Build and validate the frontend production bundle:

```bash
cd frontend && npm run build
```

---

## Project Structure 📁

```
ai-testcase-gen/
├── frontend/                     # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/           # UI components, forms, DashboardCharts
│   │   │   ├── common/           # Shared components (Pagination, Skeleton, ConfirmDialog, etc.)
│   │   │   ├── testcases/        # Modular test case table, row, filters
│   │   │   ├── testplans/        # Modular plan tree & detail panels
│   │   ├── constants/            # Project list (keep in sync with backend)
│   │   ├── contexts/             # AuthContext, WorkspaceContext
│   │   ├── pages/                # Dashboard, TestCases, TestPlans, BugTracking, Automation, Login
│   │   ├── services/             # Axios API client & Socket.io
│   │   └── utils/                # XLSX export & lookup helpers
│   └── package.json
├── backend/                      # Express.js REST API & WebSocket Server
│   ├── src/
│   │   ├── config/               # Database connection
│   │   ├── constants/            # Project list
│   │   ├── middleware/           # Auth verification & rate limiter
│   │   ├── models/               # User, Workspace, TestCase, TestPlan, ActivityLog
│   │   ├── routes/               # Auth, TestCases, TestPlans, AI, Workspaces
│   │   ├── services/             # OpenAI service integration
│   │   └── utils/                # Workspace scoping, plan sync, import utils
│   ├── tests/                    # Automated Node.js test suite
│   └── package.json
├── shared/                       # Shared type definitions
├── docs/                         # Specifications & technical documentation
├── docker-compose.yml            # Docker container deployment configuration
└── package.json                  # Root npm workspace configuration
```

---

## Key API Endpoints 🔌

Test case and test plan endpoints are scoped by the optional `x-workspace-id` header. The server verifies membership before using it; without the header, requests only see rows the caller created.

### Authentication
- `POST /api/auth/register` — Register new user and initialize personal workspace
- `POST /api/auth/login` — Login user with password verification & issue httpOnly cookie
- `GET /api/auth/current` — Get currently authenticated user profile (includes `lastWorkspace`)
- `POST /api/auth/logout` — Clear session cookie

### Workspaces
- `GET /api/workspaces` — List workspaces accessible by the user
- `POST /api/workspaces` — Create a new team workspace
- `PUT /api/workspaces/active` — Remember the selected workspace for the user (synced across devices)
- `POST /api/workspaces/:id/invite` — Invite a member by email (owner only)
- `DELETE /api/workspaces/:id/members/:userId` — Remove member (owner only)
- `POST /api/workspaces/:id/leave` — Leave workspace

### Test Cases
- `GET /api/testcases?page=1&limit=25` — Get test cases (supports server-side pagination & filtering)
- `POST /api/testcases` — Create a test case
- `GET /api/testcases/:id` — Get single test case with execution attribution
- `PUT /api/testcases/:id` — Update test case or execution status / bug fields
- `DELETE /api/testcases/:id` — Delete test case & auto-cleanup plan references
- `POST /api/testcases/batch-delete` — Batch delete test cases (max 50) with workspace-scoped plan cleanup
- `POST /api/testcases/batch-project` — Move test cases (max 1000) to a project, or `''` to unassign
- `POST /api/testcases/import` — Multipart XLSX/CSV import
- `GET /api/testcases/template?format=xlsx|csv` — Download the import template
- `GET /api/testcases/:id/history` — Get activity audit trail

### Test Plans
- `GET /api/testplans?page=1&limit=25` — Get test plans (supports server-side pagination & filtering)
- `POST /api/testplans` — Create test plan
- `GET /api/testplans/:id` — Get single plan with populated test cases
- `PUT /api/testplans/:id` — Update test plan or execution status
- `DELETE /api/testplans/:id` — Delete test plan
- `POST /api/testplans/:id/testcases` — Add a test case to a plan
- `DELETE /api/testplans/:id/testcases/:testCaseId` — Remove a test case from a plan
- `GET /api/testplans/:id/history` — Get plan activity audit trail

### AI Authoring
- `POST /api/ai/suggest-testcases` — Generate test cases from prompt or document
- `POST /api/ai/suggest-testplan` — Generate full modular test plan
- `POST /api/ai/improve-testcase` — Review and enhance existing test case

---

## License 📄

MIT

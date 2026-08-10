# Architecture

Technical reference for the AI Test Case Generator. Audience: engineers working on or reviewing this codebase.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js (ESM), Express 4, Mongoose 8 |
| Frontend | React 18, Vite 7, React Router 7 |
| Database | MongoDB (Atlas or self-hosted) |
| Real-time | Socket.io 4 |
| AI | OpenAI API (`gpt-3.5-turbo` by default, configurable) |
| Auth | JWT in an `httpOnly` cookie, bcrypt password hashing |
| Deployment | Docker Compose: two containers (`backend`, `frontend`) + external MongoDB |

The repo is an npm workspaces monorepo (`backend/`, `frontend/`, `shared/`) with one lockfile at the root.

## Directory layout

```
backend/src/
  config/database.js        Mongoose connection
  middleware/
    auth.js                 isAuthenticated — verifies the JWT cookie, sets req.userId
    rateLimit.js             In-memory per-identity, per-endpoint rate limiter
  models/                    User, Workspace, TestCase, TestPlan (Mongoose schemas)
  routes/                    auth, testCases, testPlans, ai, workspaces, jira (unmounted)
  services/openai.js         OpenAI prompt construction, retry/backoff, response parsing
  utils/
    workspaceAccess.js       Workspace-membership-aware query scoping (see Authorization)
    importUtils.js           XLSX/CSV → TestCase parsing
    templateGenerator.js     XLSX/CSV import template generation
    fileParser.js            TXT/PDF/DOCX text extraction for AI suggestion input
  server.js                  App wiring: middleware order, Socket.io, routes, error handler

frontend/src/
  pages/                     Dashboard, TestCases, TestPlans, Automation (stub), Login
  components/                Modals, forms, AppShell/Sidebar/Navbar, Toast
  contexts/                  AuthContext, WorkspaceContext
  services/
    api.js                   Axios instance; request interceptor attaches x-workspace-id;
                              response interceptor recovers from a stale workspace id (see below)
    socket.js                Socket.io client, manual connect
  utils/exportToXLSX.js      Client-side XLSX export (ExcelJS, lazy-loaded)
```

## Data model

```
User
 ├─ username (unique, sparse), email (unique), password (bcrypt hash), name, picture

Workspace
 ├─ createdBy: User, members: [User], isPersonal: bool
 │  Every user gets exactly one personal workspace, created lazily on first
 │  login/register/current-user check (see ensurePersonalWorkspace in auth.js).

TestCase
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ title, description, steps: [{stepNumber, action, expectedResult}]
 ├─ priority: Low|Medium|High|Critical
 ├─ status: Draft|Active|Deprecated
 ├─ executionStatus: Pending|Pass|Failed, executionNotes
 ├─ category, feature, tags: [String]
 └─ jiraTicketUrl (populated by the Jira integration, currently unmounted — see Known gaps)

TestPlan
 ├─ user: User (owner), workspace: Workspace (optional)
 ├─ name, description, testCases: [TestCase]
 ├─ status: Planning|In Progress|Completed|On Hold|Obsolete
 ├─ startDate, endDate
 └─ executionStatus, executionNotes (plan-level rollup, separate from each TestCase's own)
```

`workspace` is optional on `TestCase`/`TestPlan` by schema, but in practice every write path resolves one (the caller's active workspace, or their personal workspace as the implicit default when no `x-workspace-id` header is sent).

## Authentication

- `POST /api/auth/register` and `/login` issue a JWT (`{ userId }`, 7-day expiry) and set it as an `httpOnly` cookie named `token`. The token is never returned in the response body — XSS on the frontend can't read it via `document.cookie` or JS.
- Password hashing: bcrypt, cost factor 12, via a Mongoose `pre('save')` hook on `User`. Legacy plaintext rows (from a pre-bcrypt version of this app) are detected by prefix (`$2a$`/`$2b$`/`$2y$` vs not) and transparently rehashed on the next successful login — see `comparePassword`/`isPasswordPlaintext` in `models/User.js`.
- `middleware/auth.js#isAuthenticated` reads the cookie (or an `Authorization: Bearer` header, for non-browser clients), verifies it against `JWT_SECRET`, and sets `req.userId`.
- Cookie attributes: `Secure`, `SameSite=None`, 7-day `maxAge`, by default — required for a frontend on a different origin than the API. `COOKIE_SECURE=false` downgrades this to `SameSite=Lax`, no `Secure`, for a plain-HTTP deployment (see [DEPLOYMENT.md](DEPLOYMENT.md)); never set it behind TLS.
- `JWT_SECRET` has no fallback. `server.js` refuses to start if it's missing, under 32 characters, or one of a list of known placeholder values — a weak signing key that any deployment could accidentally ship with used to be the single highest-severity finding in this codebase.

## Authorization — workspace scoping

The active workspace is client-supplied: the frontend sends it as the `x-workspace-id` header, sourced from `localStorage`. Because that value is fully attacker-controlled, every read/write that honors it goes through `utils/workspaceAccess.js`:

- `buildScopeQuery(req, extra)` — no header present → scope to `{ user: req.userId }`. Header present → verify `req.userId` is in `workspace.members` (`userCanAccessWorkspace`) before scoping to `{ workspace: workspaceId }`; if the caller isn't a member, throws `WorkspaceAccessError` (HTTP 403, `code: WORKSPACE_ACCESS_DENIED`).
- `resolveWorkspaceForWrite(req)` — same membership check, for the workspace a *new* record should be created in.

This is what makes workspace sharing safe: members of a shared workspace all see each other's test cases/plans, but naming a workspace you don't belong to (by editing `localStorage`) gets a 403, not someone else's data.

The frontend's axios response interceptor (`services/api.js`) specifically watches for `code: WORKSPACE_ACCESS_DENIED`: on that (and only that — other 403s, like "not authorized to invite members", are left alone) it drops the cached workspace id, notifies `WorkspaceContext` to refetch, and retries the request once with no workspace header. This is what recovers a session when a workspace is deleted or the user is removed from it while the app is open.

## Mass-assignment protection

`POST`/`PUT` on test cases and test plans whitelist which body fields are accepted (`ALLOWED_FIELDS` in each route file) rather than spreading `req.body` into the document. `user` and `workspace` are deliberately excluded from the whitelist and always set from request context — otherwise a client could set `user` to someone else's id and hand them the record, or set `workspace` to move a record into a workspace they don't belong to.

## Rate limiting

`middleware/rateLimit.js` is an in-memory, per-process limiter keyed by `${identity}:${baseUrl}${path}` (identity = authenticated user id, or IP for unauthenticated routes). Applied to:

| Route | Window | Max |
|---|---|---|
| `/api/auth/register`, `/login` | 15 min | 10 requests |
| `/api/ai/*` | 15 min | 30 requests |
| `DELETE`/batch-delete on test cases, test plans | 10 sec | 10 requests |

**Does not scale horizontally.** Counters live in one process's memory — with N backend replicas behind a load balancer, the effective limit is `max × N`, and counters reset on restart. Fine for a single-instance deployment (the current one); a shared store (Redis) is needed before running more than one backend replica. See `docs/SCALING_SHARED_STATE.md` for the fuller writeup.

## CORS and cookie transport

- `cors({ origin: process.env.FRONTEND_URL, credentials: true })` — the *only* origin allowed to make credentialed requests. `FRONTEND_URL` has no default in `docker-compose.yml` (compose refuses to start without it) precisely because a wrong value here plus `SameSite=None` credentialed cookies is a real cross-origin exposure, not just a CORS annoyance.
- The backend accepts `application/json` bodies only — `express.urlencoded()` is deliberately not mounted. A `SameSite=None` cookie is attached to cross-site requests by the browser; a urlencoded form POST is a CORS "simple request" that skips preflight, so accepting only JSON forces a preflight (and thus a same-origin check) on every mutating request. Multipart file uploads are unaffected — `multer` parses those on the specific routes that opt in.
- `helmet()` is applied for the standard security headers (HSTS, `X-Content-Type-Options`, frameguard, referrer policy). CSP is left off — this process serves JSON, not HTML it renders itself.

## Real-time updates (Socket.io)

- The socket handshake is authenticated with the same JWT as the REST API (read from the `token` cookie, or `socket.handshake.auth.token` for non-cookie clients).
- Rooms are keyed by test plan id. `joinRoom` checks the same authorization rule as the REST API (plan owner, or a member of the plan's workspace) before allowing the join — an anonymous or unauthorized client can't subscribe to another user's plan.
- Event: `testCaseStatusUpdated`, emitted by `PUT /api/testcases/:id` when `executionStatus` changes, broadcast to every test plan room that test case belongs to. The frontend's Test Plans page joins the room for whichever plan is currently open and live-updates the displayed status without a refetch.

## AI integration (`services/openai.js`)

Three capabilities:

- `generateTestCaseSuggestions(featureDescription, count)`
- `generateTestPlanSuggestions(projectDescription)`
- `improveTestCase(testCase)`

Each makes a single `chat.completions.create` call (`OPENAI_MODEL`, default `gpt-3.5-turbo`) and extracts the first JSON array or object found in the response text via regex (`extractJSON`) — there's no `response_format: json_object`, no retry on transient failures, and no backoff. `insufficient_quota` and `invalid_api_key` are mapped to a friendlier message; any other error propagates with its raw OpenAI message. All three routes require auth and share the `aiLimiter` (30 req / 15 min per user) — every call here is a paid API call.

**The system prompts are domain-specific, not generic.** All three hardcode "You are a senior QA engineer... focused exclusively on the e-commerce website PNJ (Phú Nhuận Jewelry)" and instruct the model to frame suggestions around that business context (jewelry, promotions, store pickup) regardless of what the user actually describes. This is intentional for this deployment (the repo itself is scoped to PNJ), not a bug — but it means feeding this a feature description unrelated to that domain will still get PNJ-flavored output. Genericizing it is a prompt change in `services/openai.js`, not an architectural one.

Output language mirrors the input: the prompts instruct the model to respond in Vietnamese if the input feature/project description is in Vietnamese, English otherwise.

## Import/export

- **Import** (`POST /api/testcases/import`): XLSX (via ExcelJS) or CSV (via `csv-parser`), max 5MB. Rows are validated (`title`, `description`, `category` required; `priority`/`executionStatus` must be a valid enum value) before insert; a row that fails validation is reported, not silently dropped or silently accepted.
- **Steps column**: accepts either a JSON array (`["step 1", "step 2"]`, or an array of `{action, expectedResult}` objects) or a pipe-separated string (`"step 1 | step 2"`). The row's single "Expected Result" column, if present, attaches to the *last* parsed step.
- **Export**: client-side, via `exportToXLSX.js`. ExcelJS is dynamically imported (`await import('exceljs')`) rather than bundled eagerly — it's roughly the size of the rest of the app, and exporting is an occasional action, so it ships as its own chunk fetched on first use.

## Known gaps

- **Jira integration is coded but not wired up.** `routes/jira.js` implements `POST /api/jira/ticket` (creates a Jira Cloud issue from a failed test case via `JIRA_*` env vars), and the Test Plans UI has a "Create Jira Ticket" button that calls it — but `app.use('/api/jira', jiraRoutes)` is commented out in `server.js`. Clicking that button currently 404s. Either mount the route (and set the `JIRA_*` env vars) or remove the dead UI affordance.
- **Automation Testing page is a placeholder.** `pages/Automation.jsx` renders a "Planned Capabilities" list (Playwright integration, sandboxed test runs, reports) — there is no backend for it. A prior implementation of this existed on an unmerged branch and was deliberately discarded (security concerns around running arbitrary browser-automation scripts server-side hadn't been resolved); nothing here is a regression, it's genuinely unbuilt.
- **Docker builds aren't fully reproducible.** `docker-compose.yml` builds with `context: ./backend` / `./frontend`, so the root `package-lock.json` sits outside both contexts and neither Dockerfile can use `npm ci` — they fall back to `npm install`, which re-resolves within each dependency's semver range.

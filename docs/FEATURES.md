# Feature Specification

What this product does, feature by feature, and the current status of each. For the technical implementation behind any of this, see [ARCHITECTURE.md](ARCHITECTURE.md). For step-by-step usage, see [USER_GUIDE.md](USER_GUIDE.md) (Vietnamese).

Status legend: 🟢 shipped and working · 🟡 shipped with a caveat · ⚪ not implemented (roadmap/placeholder only)

## Accounts & workspaces

**Status: 🟢**

- Username/password registration and login (no third-party OAuth — an earlier Google OAuth integration was removed).
- Every account gets a personal workspace automatically, created on first login/register.
- A user can create additional (non-personal) workspaces and invite other registered users by email. Only the workspace creator can invite.
- Switching the active workspace (via a selector in the sidebar) scopes which test cases and test plans are visible — everyone who's a member of a workspace sees the same shared set of test cases and test plans in it. Data created outside a specific workspace (no workspace selected) is private to that user only.
- If your access to the currently-selected workspace is revoked while the app is open (removed as a member, or the workspace is deleted), the app detects this on the next request, silently falls back to your personal workspace, and shows a one-line notice explaining why — it doesn't error out or require a manual reload.

## Test case management

**Status: 🟢**

- Create, edit, delete individual test cases: title, description, ordered steps (each with an action and an expected result), priority (Low/Medium/High/Critical), status (Draft/Active/Deprecated), category, feature grouping, free-form tags.
- Track execution outcome separately from the test case's own status: `executionStatus` (Pending/Pass/Failed) plus free-text execution notes, updatable independently and reflected live wherever that test case is shown (including inside a test plan, via the real-time layer below).
- Search (title/description/category), filter by priority/status/category, sort by any column, and select multiple rows for a batch delete.
- Deleting a test case automatically removes it from any test plan that referenced it; a plan left with zero test cases as a result is automatically marked `Obsolete`.

## Test plans

**Status: 🟢**

- Group test cases into a named plan with its own status (Planning/In Progress/Completed/On Hold/Obsolete), start/end dates, and a plan-level execution result + notes separate from the individual test cases inside it.
- Test cases inside a plan are grouped by their `feature` field in the UI for navigation on larger plans.
- Per-test-case pass/fail/pending marking directly from the plan view, without leaving the plan.
- **Real-time**: if a test case's execution status changes (from anywhere — another tab, another user with access to the same workspace), anyone with that plan open sees the update live, no refresh needed.
- Export a plan to XLSX (summary block + full test case table) for sharing outside the app.

## AI-assisted authoring

**Status: 🟢** (requires an `OPENAI_API_KEY` — inert without one, doesn't break anything else)

Three capabilities, all reviewable before anything is saved — the AI never writes directly to the database, it returns suggestions the user explicitly accepts:

1. **Generate test case suggestions** from a plain-language feature description (optionally with an attached TXT/PDF/DOCX document as additional context). Returns a batch of test cases covering happy path, edge cases, and error handling; the user picks which ones to actually add.
2. **Generate a full test plan** from a project/feature-set description — organized into scenarios, each with several detailed test cases, created together as one plan.
3. **Improve an existing test case** — given one already-written test case, returns a refined version (clearer steps, better coverage) that the user can accept or discard.

Full usage walkthrough with example prompts: [AI_FEATURES.md](AI_FEATURES.md).

**Note:** the prompts are currently tuned for one specific domain — an e-commerce jewelry retailer (PNJ) — and will frame suggestions around that context regardless of what feature is actually described. Expected for this deployment, worth knowing if reusing this codebase for something else.

## Import / export

**Status: 🟢**

- **Import**: XLSX or CSV, up to 5MB, up to the row-level validation described in ARCHITECTURE.md. A downloadable template (in either format) shows the exact expected columns and two example rows.
- **Export**: selected or filtered test cases, or an entire test plan, to XLSX — generated client-side, no round-trip to the server beyond the data itself.

## Jira integration

**Status: 🟡 built, not enabled**

The Test Plans page has a "Create Jira Ticket" action on any test case marked `Failed` — it's meant to file a Jira issue (via the Jira Cloud REST API) pre-populated with the test case's description, steps, and execution notes, and store the resulting ticket link on the test case. The backend implementation exists (`routes/jira.js`) but its route isn't mounted in `server.js`, so this currently returns a 404 if used. Enabling it requires uncommenting one line in `server.js` and setting the four `JIRA_*` environment variables (see [DEPLOYMENT.md](DEPLOYMENT.md)).

## Automation testing

**Status: ⚪ not implemented**

The "Automation Testing" nav item exists in the UI as a placeholder describing planned capabilities (Playwright integration, sandboxed test execution, generated reports/screenshots). There is no backend behind it today — clicking through shows a static "under development" page, not an error, but also not a working feature. A prior implementation existed on an unmerged branch; it was set aside rather than shipped because the security model for running arbitrary browser-automation scripts server-side (on behalf of a user, potentially against arbitrary URLs) hadn't been resolved to a standard consistent with the rest of this codebase.

## Cross-cutting: what every feature above sits on

- **Auth**: every route except `/api/auth/*` and `/health` requires a valid session.
- **Workspace scoping**: shared or private, enforced server-side regardless of what the client claims — see [ARCHITECTURE.md](ARCHITECTURE.md#authorization--workspace-scoping).
- **Rate limits**: registration/login, AI calls, and bulk deletes are all throttled per account (or per IP, pre-login) to bound cost and abuse — see ARCHITECTURE.md for the exact numbers.

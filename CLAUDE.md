# Project context for Claude Code

This file is loaded automatically at the start of every Claude Code session in this
repo. It summarizes what's been built, the conventions this project follows, and
things a fresh session would otherwise have to rediscover the hard way. Written
after a long session (2026-08-06 → 2026-08-10) covering a security hardening pass,
several rounds of workspace-collaboration features, and production deployment work.

**Auth**: Google Sign-In only (Google Identity Services ID token → verified via
Google's tokeninfo in `backend/src/routes/auth.js` → our JWT in an httpOnly
cookie). No passwords/usernames are stored; `users` holds only email/name/
picture, matched case-insensitively by email. `connectDB` unsets any leftover
`password`/`username` fields on startup. Needs `GOOGLE_CLIENT_ID` (backend) and
`VITE_GOOGLE_CLIENT_ID` (frontend), same value.

## What this is

A QA test-case/test-plan management tool: Node/Express (ESM) + MongoDB/Mongoose
backend, React 18 + Vite + React Router 7 frontend, Socket.io for live updates,
OpenAI integration for AI-suggested test cases. Deployed on
free tiers (migrated off AWS EC2 on 2026-10-02 when its free tier ended):
backend on **Render** (`render.yaml`, service `testcase-gen-backend`,
`https://testcase-gen-backend.onrender.com`), frontend on **Cloudflare Pages**
(`https://ai-testcase-pnj.pages.dev`, root `frontend`, `VITE_API_URL` points at
Render), MongoDB on Atlas M0 (external). The EC2 account is closed. Details and
caveats: `docs/specs/deployment/_source/DEPLOYMENT.md`.

## Architecture patterns — follow these, don't reinvent

- **Workspace scoping** (`backend/src/utils/workspaceAccess.js`): the active
  workspace arrives as a client-supplied `x-workspace-id` header. It is **never**
  trusted directly — `buildScopeQuery`/`resolveWorkspaceForWrite` always verify
  the caller is actually a member before using it to widen a query beyond
  `{user: req.userId}`. No `x-workspace-id` header → scoped to the caller's own
  rows (personal workspace). Any new workspace-owned resource must go through
  these helpers, not roll its own scoping.
- **Mass-assignment whitelist**: every route file that accepts writes has an
  `ALLOWED_FIELDS` array + `pickAllowedFields()` helper. Ownership/actor fields
  (`user`, `workspace`, `executedBy`) are **never** in that whitelist — they're
  always set server-side from `req.userId`/resolved context, never from the
  request body. Follow this pattern for any new actor-attribution field.
- **Mongoose enum-clearing gotcha**: sending `undefined` for a field in an
  update does **not** clear it — the Mongo driver silently drops `undefined`
  keys rather than unsetting them. Enums that need to be clearable (bug
  fields on `TestCase`) explicitly include `''` as a valid enum member instead.
- **Activity log is deliberately lean** (`backend/src/models/ActivityLog.js`):
  records *which field(s) changed*, never old/new content. This was an explicit
  user decision to keep storage small on the free-tier deployment — don't
  "improve" this into a full audit diff without checking with the user first.
- **`executedBy`/`executedAt`** on `TestCase`/`TestPlan`: set server-side only
  when `executionStatus` changes via `PUT`, never on create/import (importing
  historical data shouldn't attribute it to the importer). A Test Plan's own
  `executionStatus` can also be **auto-computed** from its test cases' bug
  fields (`backend/src/utils/planStatusSync.js`) — veto rule: any bug-tracked
  test case still `Chưa fix` fails the whole plan; only passes when every
  bug-tracked test case is `Đã fix`; `Không fix` is left ambiguous for manual
  control. This fires from **every** route that can change a plan's test-case
  membership or a test case's bug fields — when adding a new one, check
  `planStatusSync.js`'s callers list, don't just add the sync call to one route
  and assume it's covered everywhere.
- **Cross-page deep-select**: `TestPlans.jsx` reads `{selectPlanId, selectTCId}`
  from React Router `location.state` on load to auto-select a specific
  plan/test-case when arriving from another page (Bug Tracking's "View in
  Plan", Test Cases' "In Test Plans" links). Reusable — don't build a second
  mechanism for the same need.
- **`TestPlan` only stores test cases in one direction** (plan → test cases).
  "Which plan(s) is this test case in" is always derived client-side via
  `frontend/src/utils/testPlanLookup.js`'s `buildTcToPlansMap`, not queried
  directly — there's no reverse index.

## Conventions established this session

- **One branch + one PR per logical change, even for one-line fixes.** Branch
  off `main` fresh each time (`git fetch origin && git checkout main && git pull
  && git checkout -b ...`) — don't stack unrelated work on a branch that's
  already been merged. PR body goes in a scratchpad `.md` file first
  (`gh pr create --body-file ...`), not inline.
- **Verification discipline before calling anything done**: syntax-check
  (`node --check`), full build (`npm run build` in `frontend/`), then an
  isolated local MongoDB (`mongod --dbpath <scratchpad>/mongo-data<N> --port
  271xx`, a fresh port per test run) + backend pointed at it + real `curl`
  through the actual HTTP routes — **not** just unit-testing the parser/logic
  in isolation. For UI changes, also drive it with a real browser (Claude
  Browser tools) end to end. This session repeatedly caught real bugs
  (staleness in optimistic UI updates, a route the UI doesn't actually call
  still missing the new logic) that unit-level checks alone would have missed.
- **The `x-workspace-id` curl gotcha**: when curl-testing against a *shared*
  workspace, you must pass `x-workspace-id: <id>` explicitly, and when testing
  against the *browser's* current workspace, you must fetch that workspace's
  real ID first — data created via curl with no header lands in
  `{user}`-scoped storage, invisible to a browser session that has a workspace
  selected (and vice versa). Hit this mismatch repeatedly; check which scope
  you're actually targeting before concluding data "isn't there."
- **Secrets discipline**: this repo is **public**. Before including any file in
  a commit that touches `docs/`, grep the diff for secret-shaped strings
  (`sk-proj-`, Mongo connection strings with embedded credentials, etc.) — this
  session found real live-looking secrets about to be swept into git history by
  a docs restructure. Four files are intentionally kept out of git (see the
  "Documentation" section of `.gitignore` — it explains why for each).
- **Never blindly `git add -A` / `git add .` in this repo.** There is
  often unrelated, pre-existing uncommitted work sitting in the working tree
  (e.g. a docs restructuring) that isn't yours to sweep into your own commit.
  Stage only the specific files your change touches.
- **Deploys are automatic now**: merging to `main` redeploys both Render and
  Pages. Render free sleeps after ~15 min idle (first request ~30-60s); Atlas
  M0 pauses after prolonged inactivity (data kept — resume in the Atlas UI).
  `FRONTEND_URL` on Render must exactly equal the Pages origin (CORS + cookie).
  Secrets live only in the Render dashboard (`sync: false` in `render.yaml`).

## Known gotchas (already fixed, but the failure modes are worth knowing)

(The EC2-specific ones below — OOM/swap and nginx caching — only apply to the
old VM setup; the nginx cache headers still matter for the Docker path.)

- **EC2 OOM during frontend builds**: the box has ~900MB RAM and had 0 swap.
  `docker compose up --build` was getting SIGKILLed (exit 137) mid-build, which
  could also make SSH itself unresponsive for a few minutes afterward. Fixed by
  adding a 1GB swapfile (`/swapfile`, persisted in `/etc/fstab`). If builds
  start failing/hanging again, check `free -h` and `swapon --show` first.
- **Browser caching silently hid every deploy from returning visitors**:
  `frontend/nginx.conf` set no `Cache-Control` at all, so `index.html` (which
  references the current build's hashed JS/CSS filenames) fell back to browser
  heuristic caching — a visitor could stay pinned to a build from before their
  last visit indefinitely, with a normal reload never fetching anything new
  (only a hard-refresh bypassed it). Fixed: `index.html` → `no-cache`,
  `/assets/*` → `public, max-age=31536000, immutable` (safe because Vite's
  filenames are content-hashed). If a user reports "I merged/rebuilt but still
  see old UI," check this class of issue before assuming the deploy failed —
  verify server-side headers/content with `curl -sI` first (bypasses browser
  cache entirely), *then* suspect the deploy.
- **CSV imports from Excel carry a UTF-8 BOM** that silently breaks the first
  column's header match (`row['ID']` misses because the real key is `"﻿"
  + "ID"`) — no error, just quietly dropped data. `parseCSV` in
  `backend/src/utils/importUtils.js` strips it via a char-code check now.
- **Import validation is all-or-nothing**: one invalid row rejects the entire
  batch. This is still true today (only the specific `BLOCKED`-status case that
  triggered it got fixed, not the underlying all-or-nothing design) — if this
  comes up again, it may be worth asking the user whether partial-import
  (import the valid rows, report the rest) is wanted, since it hasn't been
  built and would be a real behavior change to discuss first, not just do.
- **Dropdown menus positioned `absolute; top: 100%` must live in their own
  `position: relative` wrapper**, not share one with unrelated content that
  renders after them — otherwise "100%" resolves against that trailing
  content's height too. Hit this in `WorkspaceSelector.jsx`; worth checking
  for the same pattern if another dropdown-positioning bug is reported.

## Where things stand

Everything is merged to `main` and live on Render + Pages (PR #24 added
`VITE_API_URL` support and `render.yaml`; PR #33 switched login to Google).
See `git log --oneline main` and each PR's description for history.

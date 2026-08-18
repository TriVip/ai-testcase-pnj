# UI/UX & Design Review — 2026-08-18

## Overview
Comprehensive review of Design System, Light/Dark mode, Layout Shell, Spacing & Padding, Data Tables, Forms & Modals, and Accessibility.

## Evaluation Summary

| Category | Score | Key Findings |
|----------|-------|--------------|
| **1. Light / Dark Mode** | 6.5/10 | Theme toggle not persisted to localStorage; Login page has hardcoded Tailwind light classes; Dark mode `--text-tertiary` contrast ratio is 2.7:1 (below WCAG AA 4.5:1). |
| **2. Layout & Shell** | 7.0/10 | Desktop sidebar is fixed at 220px with no collapse/icon mode; Test Plans master-detail layout lacks resizable split pane; Automation placeholder lacks proper layout anchoring. |
| **3. Spacing & Padding** | 6.5/10 | Inline style padding overrides `.input-field` across JSX files; inconsistent modal paddings; large KPI tile paddings push content below the fold on 13" screens. |
| **4. Data Tables & Density** | 7.5/10 | Action button hit targets are small (28px) with tight 2px gap; hardcoded action column widths vary across pages; sticky header broken by table wrapper overflow. |
| **5. Form & Modal UX** | 6.5/10 | Uses blocking native `window.confirm()`; modals lack ESC key handling and auto-focus; Bug Tracking view is read-only. |
| **6. Micro-interactions & a11y** | 6.0/10 | Spinner causes layout shifts (needs Skeleton screens); buttons lack `:active` mechanical feedback; lacks `:focus-visible` keyboard rings. |

## Action Plan & Resolution Status

### Phase 1: Core UX & Visual Fixes (Immediate)
- [x] **1. Persist Dark Mode to `localStorage` & Fix `Login.jsx` dark theme:**
  - `Sidebar.jsx` loads/stores theme in `localStorage`, falls back to `prefers-color-scheme`.
  - `Login.jsx` rewritten with 100% design system tokens, supporting instant light/dark toggle.
- [x] **2. Fix Dark Mode contrast for `--text-tertiary` and status colors:**
  - `--text-tertiary: #8b949e`, `--text-secondary: #c9d1d9`, `--text-primary: #f0f6fc` for WCAG AA compliance.
  - High-contrast status colors `--status-fail-text: #f87171`, `--status-pass-text: #4ade80`, `--status-warn-text: #fbbf24`.
- [x] **3. Replace `window.confirm()` with custom `ConfirmDialog` component:**
  - Created `ConfirmDialog.jsx` with accessible styling, `danger` / `warning` / `primary` variants, and keyboard support.
  - Replaced native `confirm()` in `TestCases.jsx`, `TestPlans.jsx`, and `WorkspaceSelector.jsx`.
- [x] **4. Add ESC key listener and autoFocus to all modals:**
  - Added Escape listener to `TestCaseForm.jsx`, `TestPlanForm.jsx`, `AISuggestionModal.jsx`, `AITestPlanModal.jsx`, `ImportTestCaseModal.jsx`, `ConfirmDialog.jsx`, `KeyboardShortcutsModal.jsx`.
- [x] **5. Unify `StatusTag` and `StatusDot` components:**
  - Enhanced `StatusTag.jsx` with `variant="tag" | "dot"`. Replaced inline status dots across `Dashboard.jsx`, `TestPlanTree.jsx`, `TestPlanDetailPanel.jsx`.

### Phase 2: Layout & Data Density Polish
- [x] **6. Add Desktop Sidebar collapse toggle (56px icon-only mode):**
  - Added collapse button `[<<]` in sidebar header and `Cmd+B` shortcut, persisting state to `localStorage.sidebar_collapsed`.
- [x] **7. Implement Skeleton Loading screens:**
  - Created `Skeleton.jsx` (`SkeletonText`, `SkeletonTile`, `SkeletonTable`) with pulse-shimmer animation, integrated into `Dashboard.jsx`, `TestCases.jsx`, `BugTracking.jsx`.
- [x] **8. Enable inline fix status editing on `BugTracking.jsx`:**
  - Added interactive quick-update dropdown on the Fix Status column in `BugTracking.jsx`.
- [x] **9. Fix sticky table headers & optimize KPI tile padding:**
  - Standardized `.col-actions-sm/md/lg`, increased button hit targets to 32px (`.btn-icon`), adjusted `.kpi-tile` padding to `var(--space-4) var(--space-5)`.

### Phase 3: Micro-Interactions & Accessibility
- [x] **10. Add keyboard shortcut cheat-sheet modal (`?`):**
  - Created `KeyboardShortcutsModal.jsx`, triggered by pressing `?` from any screen.
- [x] **11. Add button active states and focus-visible rings:**
  - Added `:active { transform: scale(0.98); }` and `:focus-visible { outline: 2px solid var(--brand); }` in `index.css`.


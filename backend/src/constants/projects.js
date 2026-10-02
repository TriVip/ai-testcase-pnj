// Projects a test case can belong to. '' = unassigned (all pre-existing data).
// Keep in sync with frontend/src/constants/projects.js.
export const PROJECTS = ['mPOS', 'eOffice', 'Website', 'OmniHub', 'CDP', 'Promotion Engine', 'POB'];

// Case-insensitive match to the canonical name; anything unknown -> ''.
export const normalizeProject = (value) =>
    PROJECTS.find((p) => p.toLowerCase() === String(value ?? '').trim().toLowerCase()) || '';

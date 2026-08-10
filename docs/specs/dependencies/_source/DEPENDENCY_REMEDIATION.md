# Dependency Remediation — F24 (🟡 DEP)

Status: **PENDING USER ACTION.** This document only describes the recommended
remediation. No `npm install` was run, and no versions in `package.json` or any
lockfile were changed as part of task F24. Apply the steps below yourself, then
commit the resulting `package.json` + lockfile changes (lockfiles are tracked in
version control as of F22, so the updates will be captured automatically).

Scope: two backend dependencies flagged as vulnerable / unmaintained.

| Package     | Current version (`backend/package.json`) | Issue                                   | Recommended action                          |
| ----------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------- |
| `xlsx`      | `^0.18.5`                                | Prototype Pollution + ReDoS, no npm fix | Reinstall from the official SheetJS CDN      |
| `pdf-parse` | `^1.1.1`                                 | Old / effectively unmaintained          | Update if a safe release exists, or replace |

All commands below are run from the `backend/` directory (where the
`package.json` for these deps lives).

---

## 1. `xlsx` (SheetJS)

### Why

The version published on the public npm registry (`xlsx@0.18.5`) has known
security advisories with **no fixed version available on the npm registry**:

- **Prototype Pollution** — [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
- **Regular Expression Denial of Service (ReDoS)** — [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)

SheetJS stopped publishing to npm; the maintained, patched builds are
distributed only from the official SheetJS CDN. The recommended fix is to
uninstall the npm copy and install from the CDN tarball.

### Blast radius (what uses `xlsx` today)

The import name stays `xlsx` after the CDN install, so **no source code changes
are required** — only the install source changes. Verify these paths still work
after updating:

- `backend/src/utils/importUtils.js` → `parseXLSX()`
  - `XLSX.read(buffer, { type: 'buffer' })`
  - `XLSX.utils.sheet_to_json(worksheet)`
- `backend/src/utils/templateGenerator.js`
  - `generateXLSXTemplate()` → `XLSX.utils.json_to_sheet`, `XLSX.utils.book_new`,
    `XLSX.utils.book_append_sheet`, `XLSX.write(..., { type: 'buffer', bookType: 'xlsx' })`
  - `generateCSVTemplate()` → `XLSX.utils.json_to_sheet`, `XLSX.utils.sheet_to_csv`
- Routes wired to the above (`backend/src/routes/testCases.js`):
  - `POST` import endpoint → `parseXLSX(req.file.buffer)` (line ~145)
  - Template download endpoints → `generateXLSXTemplate()` / `generateCSVTemplate()` (lines ~114 / ~119)

All of these use the stable `XLSX.read` / `XLSX.write` / `XLSX.utils.*` API,
which is unchanged in the CDN builds, so the upgrade is expected to be
drop-in.

### Commands

```bash
cd backend

# remove the vulnerable npm copy
npm rm xlsx

# install the maintained build from the SheetJS CDN
# option A: always-latest
npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz

# option B (recommended for reproducible builds): pin an explicit version, e.g.
# npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Notes:
- After install, `import XLSX from 'xlsx'` continues to work unchanged.
- Pinning an explicit version URL (option B) is preferable so the lockfile
  records a deterministic source.
- `package.json` will show `xlsx` pointing at the CDN URL instead of a semver
  range — this is expected and is the officially documented install method.

---

## 2. `pdf-parse`

### Why

`pdf-parse@1.1.1` is old and effectively unmaintained. There is no in-place
patch to rely on long-term. Two viable directions — **the user decides**:

- **Option A — Update in place.** If a newer, safe `pdf-parse` release is
  available at the time you apply this, bump to it. Lowest-effort, minimal code
  change, but the package remains lightly maintained.
- **Option B — Replace with a maintained alternative.**
  - `pdf-parse-fork` — a community fork that keeps a nearly identical API, so the
    code change is minimal (swap the import).
  - `pdfjs-dist` (Mozilla PDF.js) — actively maintained and widely used, but has
    a different, lower-level API; text extraction must be done page-by-page, so
    it needs a small wrapper.

### Blast radius (what uses `pdf-parse` today)

- `backend/src/utils/fileParser.js` → `extractTextFromFile()`, only in the
  `application/pdf` branch:

  ```js
  import pdfParse from 'pdf-parse';
  // ...
  if (mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
  }
  ```

- Caller: `backend/src/routes/ai.js` (line ~70) → `extractTextFromFile(req.file)`
  during file upload for AI test-case suggestions.

This is the **only** place `pdf-parse` is used, so the change is contained to
`fileParser.js`.

### Commands / code changes

Option A (update in place):

```bash
cd backend
npm i pdf-parse@latest   # verify the resolved version has no open advisories via `npm audit`
```
No code change needed if the API is unchanged (still returns `{ text }`).

Option B-1 (drop-in fork — minimal change):

```bash
cd backend
npm rm pdf-parse
npm i pdf-parse-fork
```
Then update the import in `backend/src/utils/fileParser.js`:

```js
// from
import pdfParse from 'pdf-parse';
// to
import pdfParse from 'pdf-parse-fork';
```
The `pdfParse(buffer)` → `{ text }` usage stays the same.

Option B-2 (pdfjs-dist — most maintained, needs a wrapper):

```bash
cd backend
npm rm pdf-parse
npm i pdfjs-dist
```
Then in `backend/src/utils/fileParser.js`, replace the `application/pdf` branch
with a PDF.js text-extraction routine that iterates pages and concatenates
`getTextContent()` items. This is more code but removes the unmaintained
dependency entirely.

Recommendation: start with **Option B-1 (`pdf-parse-fork`)** for the smallest
change with the biggest maintenance win; move to `pdfjs-dist` only if you want
the most actively maintained option and can absorb the wrapper code.

---

## 3. How to verify after applying

1. **Audit:**
   ```bash
   cd backend
   npm audit
   ```
   Confirm the `xlsx` and `pdf-parse` advisories are gone (or reduced to
   acceptable, non-exploitable transitive notes).

2. **XLSX / CSV import path:** upload an `.xlsx` and a `.csv` file through the
   test-case import endpoint and confirm rows parse into test cases.

3. **Template download:** download both the XLSX and CSV templates and confirm
   they open correctly.

4. **PDF extraction:** upload a `.pdf` in the AI suggestion flow and confirm text
   is extracted (route `backend/src/routes/ai.js` → `extractTextFromFile`).

5. **Commit:** commit the updated `backend/package.json` and lockfile. Because
   lockfiles are tracked (F22), the exact resolved sources/versions will be
   captured for reproducible builds.

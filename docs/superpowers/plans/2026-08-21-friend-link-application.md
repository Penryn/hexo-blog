# Friend Link Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors submit a friend-link Issue that becomes a validated, reviewable PR updating the Fluid links page.

**Architecture:** Fluid reads canonical friend-link data from `source/_data/fluid_config.json`. A GitHub Issue Form collects untrusted input; an `issues` workflow calls a tested CommonJS module that validates input, updates one automation branch, and creates or refreshes one PR.

**Tech Stack:** Hexo 8, Fluid, Node.js 24, `node:test`, GitHub Issue Forms, GitHub Actions, `actions/github-script`.

**Spec:** `docs/superpowers/specs/2026-08-21-friend-link-application-design.md`

## Global Constraints

- Do not deploy a backend or store a browser-side GitHub token.
- Do not fetch applicant URLs; validate syntax only.
- Only `http:` and `https:` URLs without credentials are accepted.
- Automation may modify only `source/_data/fluid_config.json`.
- Friend-link PRs are never automatically merged.
- Issue input must be escaped when rendered by Fluid.

---

### Task 1: Pure friend-link parsing and data updates

**Files:**
- Create: `.github/scripts/create-friend-link-pr.cjs`
- Create: `test/friend-link-automation.test.js`

**Interfaces:**
- Produces: `parseIssueBody(body)`, `validateFields(fields)`, `normalizeUrl(url)`, `appendFriendLink(config, entry)`, `createFriendLinkPullRequest({ github, context, core })`.

- [x] **Step 1: Write failing parser and validation tests**

Test a literal Issue Form body, missing and duplicate headings, unchecked confirmation, control characters, invalid protocols, credentials, maximum lengths, and URL normalization.

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test test/friend-link-automation.test.js`

Expected: FAIL because the automation module and its exported functions do not exist.

- [x] **Step 3: Implement the minimal pure functions**

Parse exact `###` headings, reject duplicate recognized headings, return a validated `{ title, intro, link, avatar }`, and append to a cloned `links.items` array after normalized duplicate detection.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `node --test test/friend-link-automation.test.js`

Expected: all pure-function tests pass.

- [x] **Step 5: Add failing orchestration tests**

Use an in-memory GitHub API fake with complete response shapes. Assert the real orchestration creates one branch, updates only the canonical file, opens one PR with `Closes #<n>`, updates the bot comment on repeat runs, and skips a URL already present on `main`.

- [x] **Step 6: Run the focused test and verify RED**

Expected: FAIL because `createFriendLinkPullRequest` has no API orchestration yet.

- [x] **Step 7: Implement minimal GitHub API orchestration**

Use `repos.getContent`, `git.getRef/createRef`, `repos.createOrUpdateFileContents`, `pulls.list/create/update`, and `issues.listComments/createComment/updateComment`. Branch names are `automation/friend-link-<issue-number>`.

- [x] **Step 8: Run focused tests and verify GREEN**

Run: `node --test test/friend-link-automation.test.js`

Expected: all tests pass.

### Task 2: Fluid data migration and safe rendering

**Files:**
- Create: `source/_data/fluid_config.json`
- Modify: `themes/fluid/_config.yml`
- Modify: `themes/fluid/layout/links.ejs`
- Create: `test/friend-link-page.test.js`

**Interfaces:**
- Consumes: `{ links: { items: FriendLink[], custom: { enable, content } } }`.
- Produces: the existing links page plus an “申请友链” button.

- [x] **Step 1: Write failing EJS rendering and generated-page tests**

Render the real Fluid EJS template with HTML-shaped names and descriptions and assert escaped output. Run Hexo against the production data and assert the generated links page contains all migrated links and the GitHub application URL.

- [x] **Step 2: Run focused tests and verify RED**

Run: `node --test test/friend-link-page.test.js`

Expected: FAIL because the template renders applicant text unescaped and the canonical data/button do not exist.

- [x] **Step 3: Migrate data and escape output**

Move all existing items unchanged into `fluid_config.json`, enable `links.custom` with a GitHub Issue Form button, remove the duplicated theme items, and change EJS title/intro output from unescaped to escaped tags.

- [x] **Step 4: Build and run focused tests**

Run: `pnpm build && node --test test/friend-link-page.test.js`

Expected: build succeeds and tests pass.

### Task 3: Issue Form and workflow wiring

**Files:**
- Create: `.github/ISSUE_TEMPLATE/friend-link.yml`
- Create: `.github/workflows/friend-link-pr.yml`
- Modify: `test/friend-link-automation.test.js`

**Interfaces:**
- Issue headings must match `parseIssueBody` field labels exactly.
- Workflow calls `createFriendLinkPullRequest({ github, context, core })`.

- [x] **Step 1: Add failing repository contract tests**

Assert the Issue Form produces the field labels accepted by a literal sample body and the workflow event fixture is accepted by the real orchestration entry point. Configuration syntax is verified separately by parsing YAML in CI/build tooling where available.

- [x] **Step 2: Run focused tests and verify RED**

Expected: FAIL because the Issue Form and workflow are absent.

- [x] **Step 3: Add Issue Form and least-privilege workflow**

Create the four data fields, required confirmation checkbox, fixed title prefix, `opened/edited/reopened` trigger, title guard, concurrency group, timeout, and `contents/issues/pull-requests: write` permissions.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `node --test test/friend-link-automation.test.js test/friend-link-page.test.js`

Expected: all tests pass.

### Task 4: Full verification

**Files:**
- Verify all changed files.

- [x] **Step 1: Run repository tests**

Run: `pnpm test`

Expected: build and all Node tests pass.

- [x] **Step 2: Run a clean production build**

Run: `pnpm build`

Expected: Hexo generates `/links/` without errors.

- [x] **Step 3: Check diffs and repository state**

Run: `git diff --check && git status --short && git diff --stat`

Expected: only planned files changed and no whitespace errors.

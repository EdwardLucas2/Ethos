---
name: review-pr-comments
description: Fetch all comments on a PR, investigate each one against the codebase, validate whether the concern is real or already addressed, then produce a prioritised implementation plan.
argument-hint: "<pr-number>"
allowed-tools: Bash Read
---

# review-pr-comments

Fetch every comment on a pull request, investigate each one in code context, and produce a prioritised, actionable implementation plan.

## Step 1 — Get the PR number

Use `$ARGUMENTS` if provided. Otherwise ask the user which PR to review.

Confirm the PR number before proceeding.

## Step 2 — Fetch the PR diff and metadata

Run these in parallel:

```bash
# PR title, description, base/head branches
gh pr view <pr-number> --json title,body,baseRefName,headRefName,author,files

# Full diff for reading file context later
gh pr diff <pr-number>
```

Store the file list and diff — you will need them when investigating comments.

## Step 3 — Fetch all comments

Run the fetch script:

```bash
.claude/skills/review-pr-comments/fetch-pr-comments.sh <pr-number>
```

If the script fails:
- `gh CLI not authenticated` — tell the user to run `gh auth login`
- `could not determine repo` — confirm the user is inside a git repository with a GitHub remote

## Step 4 — Investigate each comment

For every inline comment thread and every review summary, do the following:

1. **Read the referenced file** at the flagged line. For inline comments the script prints `[INLINE] path:line` — read a window of ~20 lines centred on that line so you have enough context.
2. **Check the current state** — does the PR diff already address the concern? Has the code changed since the comment was posted?
3. **Classify** the comment as one of:
   - `ALREADY_FIXED` — the issue is addressed in the current diff or no longer present in the file
   - `VALID` — the concern is legitimate and requires action
   - `QUESTION` — a clarifying question or discussion point with no code change required
   - `FALSE_POSITIVE` — the reviewer misread the code or the concern does not apply

For `VALID` items, determine:
- **Severity**: `critical` (breaks correctness/security) | `major` (real defect or design flaw) | `minor` (style, naming, readability)
- **Effort**: `small` (<30 min) | `medium` (30 min–2 h) | `large` (>2 h)
- **Concrete fix**: what exactly needs to change, which file, which line

## Step 5 — Report and plan

Present a structured summary followed by the implementation plan:

```
## PR #<N> Comment Review

### Summary
- <N> inline threads  |  <N> review summaries  |  <N> discussion comments
- Valid issues: <count> critical / <count> major / <count> minor
- Already fixed: <count>   |   Questions: <count>   |   False positives: <count>

---

### Valid issues — implementation plan

#### Critical
| # | File:line | Comment author | Issue | Fix | Effort |
|---|-----------|----------------|-------|-----|--------|
...

#### Major
| # | File:line | Comment author | Issue | Fix | Effort |
...

#### Minor
| # | File:line | Comment author | Issue | Fix | Effort |
...

---

### Already addressed (<count>)
- [brief list — one line per item, why it's addressed]

### Questions / discussion (<count>)
- [brief list — what was asked, no code change needed]

### False positives (<count>)
- [brief list — why each does not apply]

---

### Recommendation
[One of: safe to merge / fix criticals then merge / significant rework needed]
[Estimated total effort for all valid issues]
```

## Step 6 — Offer to fix

If there are valid issues, ask the user:

> There are <N> valid issues (total estimated effort: <X>). Would you like me to fix them — all at once, or starting with the critical ones?

Wait for confirmation before making any changes.

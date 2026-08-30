---
name: codacy-pr
description: Fetch and triage all Codacy cloud issues for a pull request. Use this before reviewing or merging a PR to see what Codacy found.
argument-hint: "<pr-number>"
allowed-tools: Bash Read
---

# codacy-pr

Fetch all Codacy cloud issues for a pull request, categorise them as real vs false positive, and summarise what needs fixing.

## Step 1 — Get the PR number

Use `$ARGUMENTS` if provided. Otherwise ask the user which PR to check.

Confirm the PR number before proceeding.

## Step 2 — Fetch issues

Run the fetch script:

```bash
.claude/skills/codacy-pr/codacy-pr-issues.sh <pr-number>
```

The script loads `CODACY_API_TOKEN` from `.env.local` automatically.

If the script fails:

- `CODACY_API_TOKEN not set` — tell the user to add it to `.env.local` (get it from https://app.codacy.com/account/apiTokens)
- HTTP error — check the PR number is correct and the repo is `EdwardLucas2/Ethos`

## Step 3 — Triage each issue

For every issue, determine whether it is **real** or a **false positive**.

## Step 4 — Report

Present a structured summary:

```
## Codacy Issues — PR #<N>

### Real issues (<count>)
[table: severity | tool | file:line | issue | suggested fix]

### False positives (<count>)
[one-line list of patterns ignored and why]

### Recommendation
[merge / fix before merge / needs investigation]
```

If there are real issues, offer to fix them.

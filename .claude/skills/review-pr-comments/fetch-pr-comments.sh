#!/usr/bin/env bash
# Fetch all comments on a GitHub pull request: inline review comments, review bodies, and top-level discussion.
# Usage: .claude/skills/review-pr-comments/fetch-pr-comments.sh <pr-number>
# Requires: gh CLI authenticated

set -euo pipefail

PR="${1:-}"
if [ -z "$PR" ]; then
    echo "Usage: $0 <pr-number>" >&2
    exit 1
fi

if ! gh auth status &>/dev/null; then
    echo "Error: gh CLI not authenticated. Run: gh auth login" >&2
    exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
    echo "Error: could not determine repo. Run from inside a git repository." >&2
    exit 1
fi

echo "PR comments for #$PR ($REPO)"
echo "=========================================="

python3 - "$REPO" "$PR" <<'PYEOF'
import sys, json, subprocess, textwrap

repo, pr = sys.argv[1], sys.argv[2]

def gh_api(path):
    result = subprocess.run(
        ["gh", "api", "--paginate", path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Error calling gh api {path}: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    # --paginate may concatenate multiple JSON arrays; wrap in a list parse
    raw = result.stdout.strip()
    # gh --paginate outputs concatenated JSON arrays; join them
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # multiple arrays concatenated — wrap and flatten
        fixed = "[" + raw.replace("][", "],[") + "]"
        nested = json.loads(fixed)
        flat = []
        for item in nested:
            if isinstance(item, list):
                flat.extend(item)
            else:
                flat.append(item)
        return flat

# ── Inline review comments (attached to diff lines) ──────────────────────────
inline = gh_api(f"/repos/{repo}/pulls/{pr}/comments")
inline_by_thread = {}
for c in inline:
    root = c.get("in_reply_to_id") or c["id"]
    inline_by_thread.setdefault(root, []).append(c)

# ── PR reviews (overall review body + state) ──────────────────────────────────
reviews = gh_api(f"/repos/{repo}/pulls/{pr}/reviews")

# ── Top-level issue comments (general discussion) ─────────────────────────────
issue_comments = gh_api(f"/repos/{repo}/issues/{pr}/comments")

# ── Output ────────────────────────────────────────────────────────────────────

section_header = lambda t: print(f"\n{'─'*50}\n## {t}\n{'─'*50}")

# Review bodies (non-empty, exclude auto-generated)
meaningful_reviews = [
    r for r in reviews
    if r.get("body", "").strip() and r["state"] not in ("COMMENTED",)
    or r.get("body", "").strip()
]
meaningful_reviews = [r for r in reviews if r.get("body", "").strip()]

if meaningful_reviews:
    section_header(f"Review summaries ({len(meaningful_reviews)})")
    for r in meaningful_reviews:
        author = r["user"]["login"]
        state  = r.get("state", "COMMENTED")
        body   = r["body"].strip()
        print(f"\n[REVIEW] @{author} ({state})")
        print(textwrap.indent(body, "  "))

# Inline comments (grouped into threads)
if inline_by_thread:
    thread_list = sorted(inline_by_thread.values(), key=lambda t: (t[0].get("path",""), t[0].get("line") or t[0].get("original_line") or 0))
    section_header(f"Inline code comments ({len(thread_list)} threads, {len(inline)} total)")
    for thread in thread_list:
        root = thread[0]
        path = root.get("path", "?")
        line = root.get("line") or root.get("original_line") or "?"
        diff_hunk = root.get("diff_hunk", "").strip()
        print(f"\n[INLINE] {path}:{line}")
        if diff_hunk:
            # show last few lines of the hunk for context
            hunk_lines = diff_hunk.splitlines()
            preview = hunk_lines[-min(5, len(hunk_lines)):]
            print("  diff context:")
            for dl in preview:
                print(f"    {dl}")
        for c in thread:
            author = c["user"]["login"]
            body   = c["body"].strip()
            reply  = "  ↳ reply" if c.get("in_reply_to_id") else ""
            print(f"  {reply}@{author}: {body}")

# Top-level issue comments
if issue_comments:
    section_header(f"Discussion comments ({len(issue_comments)})")
    for c in issue_comments:
        author = c["user"]["login"]
        body   = c["body"].strip()
        if body:
            print(f"\n@{author}:")
            print(textwrap.indent(body, "  "))

total = len(inline_by_thread) + len(meaningful_reviews) + len(issue_comments)
print(f"\n--- Total: {len(inline_by_thread)} inline threads | {len(meaningful_reviews)} review summaries | {len(issue_comments)} discussion comments ---")
PYEOF

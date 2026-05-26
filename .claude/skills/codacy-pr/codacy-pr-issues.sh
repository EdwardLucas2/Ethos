#!/usr/bin/env bash
# Fetch Codacy cloud issues for a pull request.
# Usage: .claude/skills/codacy-pr/codacy-pr-issues.sh <pr-number>
# Requires CODACY_API_TOKEN in environment or .env.local

set -euo pipefail

PR="${1:-}"
if [ -z "$PR" ]; then
    echo "Usage: $0 <pr-number>" >&2
    exit 1
fi

source .env.local

if [ -z "${CODACY_API_TOKEN:-}" ]; then
    echo "Error: CODACY_API_TOKEN not set. Add it to .env.local or export it." >&2
    exit 1
fi

ORG="EdwardLucas2"
REPO="Ethos"
PROVIDER="gh"
LIMIT=100

echo "Codacy issues for PR #$PR ($ORG/$REPO)"
echo "==========================================="

python3 - "$CODACY_API_TOKEN" "$PROVIDER" "$ORG" "$REPO" "$PR" "$LIMIT" <<'EOF'
import sys, json
try:
    import urllib.request as req
except ImportError:
    print("Error: python3 urllib not available", file=sys.stderr)
    sys.exit(1)

token, provider, org, repo, pr, limit = sys.argv[1:]
base = f"https://app.codacy.com/api/v3/analysis/organizations/{provider}/{org}/repositories/{repo}/pull-requests/{pr}/issues"
cursor = None
total = 0

while True:
    url = f"{base}?limit={limit}"
    if cursor:
        url += f"&cursor={cursor}"

    request = req.Request(url, headers={"api-token": token})
    try:
        with req.urlopen(request) as r:
            data = json.loads(r.read())
    except Exception as e:
        print(f"Error fetching from Codacy API: {e}", file=sys.stderr)
        sys.exit(1)

    issues = data.get("data", [])
    total += len(issues)

    for i in issues:
        ci = i["commitIssue"]
        pat = ci["patternInfo"]
        level = pat.get("level", "?")
        category = pat.get("category", "?")
        tool = ci["toolInfo"]["name"]
        path = ci["filePath"]
        line = ci["lineNumber"]
        msg = ci["message"]
        code = ci.get("lineText", "").strip()
        print(f"[{level}] [{category}] {tool} — {path}:{line}")
        print(f"  {msg}")
        if code:
            print(f"  > {code}")
        print()

    cursor = data.get("pagination", {}).get("cursor")
    if not cursor:
        break

print(f"--- Total: {total} issues ---")
EOF

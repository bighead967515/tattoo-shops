#!/usr/bin/env bash
set -euo pipefail

# Creates issue backlog for onboarding readiness checklist sections.
# Requires: gh auth login, and repository context set.

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Required command not found: $1"; exit 1; }
}

require_cmd gh

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

LABEL="launch-readiness"
gh label create "$LABEL" --color "1f6feb" --description "Pre-onboarding launch readiness" 2>/dev/null || true

create_issue() {
  local title="$1"
  local body="$2"
  gh issue create --title "$title" --label "$LABEL" --body "$body"
}

create_issue "[IONOS] DNS and connectivity cutover" "Checklist:\n- Set apex A/AAAA to target\n- Set www CNAME to apex\n- Remove conflicting records\n- TTL 300 during migration\n- Verify with dig +short"

create_issue "[IONOS] SSL and redirect hardening" "Checklist:\n- Cert covers apex and www SAN\n- HTTP 301 to HTTPS\n- Optional HSTS enablement\n- Verify with curl and openssl"

create_issue "[IONOS] Reverse proxy and app process setup" "Checklist:\n- Nginx proxy_pass to localhost app port\n- Forward Host/X-Real-IP/X-Forwarded-For\n- client_max_body_size tuned\n- systemd restart policy and boot enablement\n- app logs routed to /var/log"

create_issue "[IONOS] Environment and secrets hardening" "Checklist:\n- No .env secrets in git\n- Dedicated production DB user\n- Rotate exposed keys\n- Restart service after env changes"

create_issue "[Launch] Compliance and validation gate" "Checklist:\n- Legal footer links reachable\n- HTTPS padlock valid\n- Signup/login and email verification\n- Tail logs for runtime stack traces"

echo "Issue bootstrap complete."

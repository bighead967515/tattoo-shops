#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/cutover.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy cutover.env.example to cutover.env and edit values."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Required command not found: $1"; exit 1; }
}

require_cmd curl
require_cmd dig
require_cmd openssl

echo "== DNS validation =="
echo "A apex:"
dig +short "$DOMAIN" A

echo "AAAA apex:"
dig +short "$DOMAIN" AAAA || true

echo "CNAME www:"
dig +short "$WWW_DOMAIN" CNAME || true

echo "A www:"
dig +short "$WWW_DOMAIN" A || true

echo "== HTTP/HTTPS validation =="
HTTP_HEADERS="$(mktemp)"
HTTPS_HEADERS="$(mktemp)"
WWW_HTTPS_HEADERS="$(mktemp)"

curl -sSI "http://${DOMAIN}" > "$HTTP_HEADERS"
curl -sSI "https://${DOMAIN}" > "$HTTPS_HEADERS"
curl -sSI "https://${WWW_DOMAIN}" > "$WWW_HTTPS_HEADERS"

echo "HTTP status/redirect:" 
grep -E "^HTTP/|^Location:" "$HTTP_HEADERS"

echo "HTTPS apex status:" 
grep -E "^HTTP/" "$HTTPS_HEADERS"

echo "HTTPS www status/redirect:" 
grep -E "^HTTP/|^Location:" "$WWW_HTTPS_HEADERS"

echo "== TLS SAN validation =="
openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" < /dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -ext subjectAltName

echo "== App health validation =="
curl -fsS "https://${DOMAIN}${HEALTH_PATH}" | sed -n '1,120p'

echo "== Service and logs =="
echo "App runs on Render — check logs in the Render dashboard or run:"
echo "  render logs --tail --service theinkednetwork"

echo "== Required manual checks =="
echo "1) Confirm legal footer links are reachable from homepage and auth pages"
echo "2) Run signup/login happy path manually"
echo "3) Verify transactional email delivery end-to-end"

echo "Post-deploy validation complete."

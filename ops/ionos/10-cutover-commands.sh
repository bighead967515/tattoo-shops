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

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [[ -n "$result" ]]; then
    echo "  [OK]  $label: $result"
    (( PASS++ )) || true
  else
    echo "  [!!]  $label: EMPTY or not set"
    (( FAIL++ )) || true
  fi
}

echo "==> 1) cutover.env required variables"
check "DOMAIN" "${DOMAIN:-}"
check "WWW_DOMAIN" "${WWW_DOMAIN:-}"
check "RENDER_DNS_TARGET" "${RENDER_DNS_TARGET:-}"
check "HEALTH_PATH" "${HEALTH_PATH:-}"

echo ""
echo "==> 2) Render service reachability"
if [[ -n "${RENDER_DNS_TARGET:-}" ]]; then
  RENDER_HEALTH_URL="https://${RENDER_DNS_TARGET}${HEALTH_PATH}"
  echo "  Checking $RENDER_HEALTH_URL ..."
  HTTP_CODE="$(curl -sSo /dev/null -w "%{http_code}" "$RENDER_HEALTH_URL" || true)"
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "  [OK]  Render health check returned 200"
    (( PASS++ )) || true
  else
    echo "  [!!]  Render health check returned $HTTP_CODE (expected 200)"
    (( FAIL++ )) || true
  fi
else
  echo "  [SKIP] RENDER_DNS_TARGET not set"
fi

echo ""
echo "==> 3) Current DNS for ${DOMAIN}"
dig +short "${DOMAIN}" A || true
dig +short "${WWW_DOMAIN}" CNAME || true

echo ""
echo "==> 4) Manual steps before switching DNS in IONOS"
echo "  [ ] Custom domain '${DOMAIN}' added in Render dashboard"
echo "  [ ] Custom domain '${WWW_DOMAIN}' added in Render dashboard"
echo "  [ ] All production env vars set in Render environment tab"
echo "  [ ] PUBLIC_BASE_URL=https://${DOMAIN} set in Render env"
echo "  [ ] CORS_ALLOWED_ORIGINS includes https://${DOMAIN} and https://${WWW_DOMAIN}"
echo "  [ ] Stripe webhook endpoint updated to https://${DOMAIN}/api/stripe/webhook"
echo "  [ ] Resend sender domain DNS records added and verified"

echo ""
echo "==> Summary: ${PASS} passed, ${FAIL} failed"
if [[ "$FAIL" -gt 0 ]]; then
  echo "Resolve the items above before switching DNS."
  exit 1
fi

echo "Pre-cutover checks passed. Switch DNS in IONOS, then run 40-post-deploy-validate.sh."

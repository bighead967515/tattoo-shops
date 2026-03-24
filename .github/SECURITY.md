# Security Policy

## Supported Versions

Security fixes are provided for:

| Version | Supported |
| --- | --- |
| `main` branch | Yes |
| Latest production release | Yes |
| Older releases | No |

If you are running an older version, upgrade to the latest release before reporting a vulnerability.

## Reporting a Vulnerability

Please do **not** open public issues for security reports.

Use one of these private channels:

1. GitHub private vulnerability reporting (preferred):
   - Go to the repository `Security` tab
   - Click `Report a vulnerability`
2. If private reporting is unavailable, contact maintainers directly through GitHub with a private message and request a secure follow-up channel.

## What to Include in a Report

Please include:

- A clear description of the issue and affected component
- Reproduction steps and proof of concept
- Impact assessment (data exposure, auth bypass, payment risk, etc.)
- Affected environment and commit SHA/version
- Suggested remediation, if available

## Response Targets

- Initial acknowledgement: within 72 hours
- Triage and severity assessment: within 7 days
- Fix target:
  - Critical/High: as soon as possible, typically 7-14 days
  - Medium/Low: next scheduled patch window

These are targets, not guarantees.

## Disclosure Policy

- Coordinate disclosure with maintainers until a fix is available.
- Public disclosure should wait until patches and mitigation guidance are released.
- Credit will be provided (if requested) after disclosure.

## Scope

In scope:

- Authentication/session handling (`/api/auth/*`, tRPC protected procedures)
- Authorization and role/tier enforcement
- Stripe checkout/webhook handling
- Supabase auth/storage integration
- Input validation/sanitization and data access controls
- Dependency vulnerabilities with practical impact

Out of scope (unless chainable to a practical impact):

- Missing best-practice headers without exploit path
- Theoretical-only attacks with no reproducible impact
- Social engineering and physical access attacks
- Denial-of-service volume testing from shared environments

## Security Baseline Requirements

- Never commit secrets, API keys, or tokens
- Rotate compromised credentials immediately
- Use least-privilege credentials for Stripe/Supabase/service accounts
- Validate and sanitize untrusted input on all API boundaries
- Keep dependencies updated and monitor advisories
- Log and monitor webhook/auth anomalies

## Safe Harbor

If you act in good faith, avoid privacy violations, and do not disrupt service integrity, maintainers will treat your research as authorized under this policy.

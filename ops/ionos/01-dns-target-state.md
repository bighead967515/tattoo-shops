# IONOS DNS Target State

Apply in IONOS authoritative DNS for zone theinkednetwork.website.

| Host | Type | Value | TTL | Required |
| --- | --- | --- | --- | --- |
| @ | A | TARGET_IPV4 from cutover.env | 300 during migration, 3600 after | Yes |
| @ | AAAA | TARGET_IPV6 from cutover.env | 300 during migration, 3600 after | Optional |
| www | CNAME | theinkednetwork.website. | 300 during migration, 3600 after | Recommended |

Conflict cleanup rules:
- Remove old A/AAAA/CNAME records for @ and www that do not match target state.
- Keep MX/TXT only if needed for mail or verification.
- Do not delete SPF, DKIM, or DMARC TXT records if email is active.

Verification commands:
- dig +short theinkednetwork.website A
- dig +short theinkednetwork.website AAAA
- dig +short www.theinkednetwork.website CNAME
- dig +short www.theinkednetwork.website A

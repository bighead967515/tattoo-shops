#!/usr/bin/env python3
"""
Ink Connect — Environment Variable Checker
==========================================
Reads the project .env file and validates every required and optional
variable.  Exits with code 1 if any required variable is missing or
looks like a placeholder so CI/CD pipelines can catch bad configs early.

Usage:
    python3 scripts/check_env.py                  # checks .env in project root
    python3 scripts/check_env.py --env .env.prod  # checks a specific file
"""

import os
import re
import sys
import argparse
from pathlib import Path

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

OK      = f"{GREEN}✔  OK{RESET}"
WARN    = f"{YELLOW}⚠  WARN{RESET}"
MISSING = f"{RED}✘  MISSING{RESET}"
PLACEHOLDER = f"{RED}✘  PLACEHOLDER{RESET}"
BAD_FMT = f"{RED}✘  BAD FORMAT{RESET}"

# ── Generic placeholder patterns (apply to every variable) ───────────────────
# These are patterns that are NEVER valid real values.
GLOBAL_PLACEHOLDER_PATTERNS = [
    r"^$",                        # empty string
    r"^<[^>]+>$",                 # <PLACEHOLDER>
    r"(?i)^change[_\-]?me$",
    r"(?i)^your[_\-]",
    r"(?i)^replace[_\-]",
    r"(?i)^todo$",
    r"(?i)^example",
    r"(?i)^null$",
    r"(?i)^undefined$",
    r"(?i)^test[_\-]?key$",
    r"(?i)^dummy",
    r"(?i)^fake",
    r"(?i)^placeholder",
    r"^xxx+$",
    r"^0{8,}$",                   # 00000000...
]

# ── Variable definitions ───────────────────────────────────────────────────────
# Each entry is a dict:
#   name        : env var name
#   required    : True = error if missing; False = warning if missing
#   description : human-readable purpose
#   prefix      : if set, value MUST start with this string
#   min_len     : minimum value length (catches obviously short/fake values)
#   extra_check : optional lambda(value) -> error_message | None
VARIABLES = [
    # ── Supabase ──────────────────────────────────────────────────────────────
    dict(name="SUPABASE_URL",           required=True,
         description="Supabase project URL (server)",
         prefix="https://", min_len=20,
         extra_check=lambda v: None if ".supabase.co" in v else "expected *.supabase.co URL"),

    dict(name="SUPABASE_ANON_KEY",      required=True,
         description="Supabase anon/public key (server)",
         prefix="eyJ", min_len=100),

    dict(name="SUPABASE_SERVICE_KEY",   required=True,
         description="Supabase service role key (server)",
         prefix="eyJ", min_len=100),

    dict(name="VITE_SUPABASE_URL",      required=True,
         description="Supabase project URL (frontend/Vite)",
         prefix="https://", min_len=20,
         extra_check=lambda v: None if ".supabase.co" in v else "expected *.supabase.co URL"),

    dict(name="VITE_SUPABASE_ANON_KEY", required=True,
         description="Supabase anon key (frontend/Vite)",
         prefix="eyJ", min_len=100),

    dict(name="DATABASE_URL",           required=True,
         description="PostgreSQL connection string for Drizzle",
         prefix="postgresql://", min_len=30),

    # ── Stripe ────────────────────────────────────────────────────────────────
    dict(name="STRIPE_SECRET_KEY",      required=True,
         description="Stripe secret key",
         prefix=None, min_len=30,
         extra_check=lambda v: None if v.startswith("sk_live_") or v.startswith("sk_test_")
                               else "must start with sk_live_ or sk_test_"),

    dict(name="STRIPE_WEBHOOK_SECRET",  required=True,
         description="Stripe webhook signing secret",
         prefix="whsec_", min_len=30),

    # Stripe Price IDs — optional in .env (defaults hardcoded in env.ts)
    dict(name="STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH", required=False,
         description="Artist Amateur monthly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR",  required=False,
         description="Artist Amateur yearly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_ARTIST_PRO_PRICE_ID_MONTH",     required=False,
         description="Artist Pro monthly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_ARTIST_PRO_PRICE_ID_YEAR",      required=False,
         description="Artist Pro yearly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_ARTIST_ICON_PRICE_ID_MONTH",    required=False,
         description="Artist Icon monthly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_ARTIST_ICON_PRICE_ID_YEAR",     required=False,
         description="Artist Icon yearly Price ID (default in env.ts)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_CLIENT_PLUS_PRICE_ID",          required=False,
         description="Client Plus Price ID (not yet used)",
         prefix="price_", min_len=10),

    dict(name="STRIPE_CLIENT_ELITE_PRICE_ID",         required=False,
         description="Client Elite Price ID (not yet used)",
         prefix="price_", min_len=10),

    # ── Email ─────────────────────────────────────────────────────────────────
    dict(name="RESEND_API_KEY",         required=True,
         description="Resend transactional email API key",
         prefix="re_", min_len=20),

    # ── Maps ──────────────────────────────────────────────────────────────────
    dict(name="MAPTILER_API_KEY",       required=True,
         description="MapTiler API key (server)",
         prefix=None, min_len=10),

    dict(name="VITE_MAPTILER_API_KEY",  required=True,
         description="MapTiler API key (frontend/Vite)",
         prefix=None, min_len=10),

    # ── AI / ML ───────────────────────────────────────────────────────────────
    dict(name="GROQ_API_KEY",           required=True,
         description="Groq LLM API key",
         prefix="gsk_", min_len=20),

    dict(name="HUGGINGFACE_API_KEY",    required=True,
         description="Hugging Face API key",
         prefix="hf_", min_len=10),

    # ── App config ────────────────────────────────────────────────────────────
    dict(name="NODE_ENV",               required=True,
         description="Node environment",
         prefix=None, min_len=1,
         extra_check=lambda v: None if v in ("production", "development", "test")
                               else f"unexpected value '{v}' — expected production/development/test"),

    dict(name="PORT",                   required=True,
         description="HTTP server port",
         prefix=None, min_len=1,
         extra_check=lambda v: None if v.isdigit() else "must be a number"),

    dict(name="JWT_SECRET",             required=True,
         description="JWT signing secret (UUID or long random string)",
         prefix=None, min_len=16),

    dict(name="OWNER_OPEN_ID",          required=True,
         description="Supabase user ID of the platform owner/admin",
         prefix=None, min_len=10),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_env_file(path: Path) -> dict:
    """Parse a .env file into a dict, ignoring comments and blank lines."""
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, val = line.partition("=")
            val = val.strip().strip('"').strip("'")
            env[key.strip()] = val
    return env


def is_global_placeholder(value: str) -> bool:
    for pat in GLOBAL_PLACEHOLDER_PATTERNS:
        if re.search(pat, value):
            return True
    return False


def validate(var: dict, value: str) -> tuple[str, str]:
    """
    Returns (status_label, note).
    status_label is one of: 'ok', 'placeholder', 'bad_format', 'missing'
    """
    if not value:
        return "missing", ""

    if is_global_placeholder(value):
        return "placeholder", f"value looks like a placeholder: '{value[:50]}'"

    # Prefix check
    prefix = var.get("prefix")
    if prefix and not value.startswith(prefix):
        return "bad_format", f"must start with '{prefix}' (got '{value[:20]}...')"

    # Minimum length check
    min_len = var.get("min_len", 0)
    if len(value) < min_len:
        return "bad_format", f"too short — expected at least {min_len} characters (got {len(value)})"

    # Custom extra check
    extra_check = var.get("extra_check")
    if extra_check:
        err = extra_check(value)
        if err:
            return "bad_format", err

    masked = value[:6] + "***" if len(value) > 6 else "***"
    return "ok", masked


# ── Main ──────────────────────────────────────────────────────────────────────

def print_row(status_str, name, description, note):
    note_str = f"  {CYAN}→ {note}{RESET}" if note else ""
    print(f"  {status_str:<30} {BOLD}{name:<46}{RESET} {description}{note_str}")


def main():
    parser = argparse.ArgumentParser(description="Ink Connect env variable checker")
    parser.add_argument("--env", default=".env", help="Path to .env file (default: .env)")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    env_path = project_root / args.env

    print(f"\n{BOLD}{'='*72}{RESET}")
    print(f"{BOLD}  Ink Connect — Environment Variable Checker{RESET}")
    print(f"{BOLD}{'='*72}{RESET}")
    print(f"  File   : {env_path}")
    print(f"  Checks : {len(VARIABLES)} variables\n")

    if not env_path.exists():
        print(f"{RED}  ERROR: File not found: {env_path}{RESET}\n")
        sys.exit(1)

    env = load_env_file(env_path)

    errors, warnings, oks = [], [], []

    for var in VARIABLES:
        name     = var["name"]
        required = var["required"]
        desc     = var["description"]
        value    = env.get(name, "")

        status, note = validate(var, value)

        if status == "ok":
            oks.append((OK, name, desc, note))
        elif status == "missing":
            if required:
                errors.append((MISSING, name, desc, "variable is not set in .env"))
            else:
                warnings.append((WARN, name, desc, "not set — using hardcoded default in env.ts"))
        elif status == "placeholder":
            if required:
                errors.append((PLACEHOLDER, name, desc, note))
            else:
                warnings.append((WARN, name, desc, note))
        elif status == "bad_format":
            if required:
                errors.append((BAD_FMT, name, desc, note))
            else:
                warnings.append((WARN, name, desc, note))

    # ── Print results ──────────────────────────────────────────────────────────
    if oks:
        print(f"{BOLD}{GREEN}  PASSED ({len(oks)}){RESET}")
        for row in oks:
            print_row(*row)
        print()

    if warnings:
        print(f"{BOLD}{YELLOW}  WARNINGS ({len(warnings)}){RESET}")
        for row in warnings:
            print_row(*row)
        print()

    if errors:
        print(f"{BOLD}{RED}  ERRORS ({len(errors)}){RESET}")
        for row in errors:
            print_row(*row)
        print()

    # ── Summary ────────────────────────────────────────────────────────────────
    print(f"{BOLD}{'─'*72}{RESET}")
    print(f"  Total checked : {len(VARIABLES)}")
    print(f"  {GREEN}Passed        : {len(oks)}{RESET}")
    print(f"  {YELLOW}Warnings      : {len(warnings)}{RESET}")
    print(f"  {RED}Errors        : {len(errors)}{RESET}")
    print(f"{BOLD}{'─'*72}{RESET}")

    if errors:
        print(f"\n{RED}{BOLD}  RESULT: FAIL — fix the errors above before deploying.{RESET}\n")
        sys.exit(1)
    elif warnings:
        print(f"\n{YELLOW}{BOLD}  RESULT: PASS WITH WARNINGS — review warnings before going live.{RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{GREEN}{BOLD}  RESULT: ALL CLEAR — every environment variable is set correctly.{RESET}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()

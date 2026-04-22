#!/usr/bin/env python3
"""
Ink Connect — Stripe Price ID Injector
=======================================
Fetches all active Price objects from your live Stripe account, maps them
to the correct environment variable names using their metadata, and writes
the values into the project .env file.

The script is idempotent — running it multiple times is safe.  It only
updates lines that are currently missing or blank; it never overwrites a
value that is already set unless you pass --force.

Usage:
    python3 scripts/set_stripe_prices.py
    python3 scripts/set_stripe_prices.py --env .env.production
    python3 scripts/set_stripe_prices.py --force     # overwrite existing values
    python3 scripts/set_stripe_prices.py --dry-run   # preview without writing

Requirements:
    pip install stripe
    STRIPE_SECRET_KEY must be set in .env  OR  passed via --key flag.
"""

import argparse
import sys
from pathlib import Path

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── Mapping: (tier_key in Stripe metadata, billing interval) → .env var name ──
TIER_INTERVAL_TO_ENV = {
    ("artist_amateur", "month"): "STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH",
    ("artist_amateur", "year"):  "STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR",
    ("artist_pro",     "month"): "STRIPE_ARTIST_PRO_PRICE_ID_MONTH",
    ("artist_pro",     "year"):  "STRIPE_ARTIST_PRO_PRICE_ID_YEAR",
    ("artist_icon",    "month"): "STRIPE_ARTIST_ICON_PRICE_ID_MONTH",
    ("artist_icon",    "year"):  "STRIPE_ARTIST_ICON_PRICE_ID_YEAR",
}


# ── .env file helpers ─────────────────────────────────────────────────────────

def load_env_lines(path: Path) -> list:
    """
    Parse .env into a list of (key_or_None, raw_line) tuples preserving
    comments, blank lines, and ordering.
    """
    lines = []
    if path.exists():
        for raw in path.read_text().splitlines():
            stripped = raw.strip()
            if stripped and not stripped.startswith("#") and "=" in stripped:
                key = stripped.split("=", 1)[0].strip()
                lines.append((key, raw))
            else:
                lines.append((None, raw))
    return lines


def get_value(lines: list, key: str) -> str:
    for k, raw in lines:
        if k == key:
            return raw.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def set_value(lines: list, key: str, value: str) -> list:
    """Update an existing key in-place, or append it at the end."""
    new_raw = f"{key}={value}"
    for i, (k, _) in enumerate(lines):
        if k == key:
            lines[i] = (key, new_raw)
            return lines
    lines.append((key, new_raw))
    return lines


def write_env(path: Path, lines: list):
    path.write_text("\n".join(raw for _, raw in lines) + "\n")


# ── Stripe helpers ────────────────────────────────────────────────────────────

def get_meta(price) -> dict:
    """Safely extract metadata from a Stripe Price object."""
    try:
        raw = price.metadata
        if hasattr(raw, "_data") and isinstance(raw._data, dict):
            return raw._data
        # Fallback: iterate the StripeObject like a dict
        return {k: raw[k] for k in raw}
    except Exception:
        return {}


def fetch_prices(api_key: str) -> list:
    try:
        import stripe
    except ImportError:
        print(f"{RED}ERROR: stripe package not installed.  Run: pip install stripe{RESET}")
        sys.exit(1)

    stripe.api_key = api_key
    print("  Connecting to Stripe... ", end="", flush=True)
    try:
        all_prices = list(stripe.Price.list(limit=100))
        print(f"{GREEN}OK{RESET}  ({len(all_prices)} prices retrieved)\n")
        return all_prices
    except Exception as exc:
        print(f"\n{RED}ERROR: {exc}{RESET}")
        sys.exit(1)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ink Connect Stripe Price ID injector")
    parser.add_argument("--env",     default=".env",       help="Path to .env file (default: .env)")
    parser.add_argument("--key",     default=None,         help="Stripe secret key (overrides .env)")
    parser.add_argument("--force",   action="store_true",  help="Overwrite already-set values")
    parser.add_argument("--dry-run", action="store_true",  help="Preview changes without writing")
    args = parser.parse_args()

    script_dir   = Path(__file__).parent
    project_root = script_dir.parent
    env_path     = project_root / args.env

    print(f"\n{BOLD}{'='*68}{RESET}")
    print(f"{BOLD}  Ink Connect — Stripe Price ID Injector{RESET}")
    print(f"{BOLD}{'='*68}{RESET}")
    print(f"  File   : {env_path}")
    print(f"  Mode   : {'DRY RUN (no changes written)' if args.dry_run else 'LIVE'}")
    print(f"  Force  : {'yes — will overwrite existing values' if args.force else 'no — skip already-set values'}\n")

    if not env_path.exists():
        print(f"{RED}  ERROR: .env file not found at {env_path}{RESET}\n")
        sys.exit(1)

    lines = load_env_lines(env_path)

    # Resolve Stripe secret key
    api_key = args.key or get_value(lines, "STRIPE_SECRET_KEY")
    if not api_key:
        print(f"{RED}  ERROR: STRIPE_SECRET_KEY not found in {env_path}.\n"
              f"  Add it to .env or pass it with --key sk_live_...{RESET}\n")
        sys.exit(1)

    prices = fetch_prices(api_key)

    # ── Map each price to its env var ─────────────────────────────────────────
    updates: dict[str, str] = {}   # env_var → price_id

    for p in prices:
        if not p.active:
            continue

        meta     = get_meta(p)
        tier_key = meta.get("tier_key")
        interval = p.recurring["interval"] if p.recurring else None

        if not tier_key or not interval:
            continue

        env_var = TIER_INTERVAL_TO_ENV.get((tier_key, interval))
        if env_var:
            updates[env_var] = p.id

    if not updates:
        print(f"{YELLOW}  No matching prices found in your Stripe account.{RESET}")
        print(f"  Prices must have metadata fields: tier_key and billing.\n")
        sys.exit(0)

    # ── Print and apply updates ───────────────────────────────────────────────
    col_var = 48
    col_id  = 32
    print(f"  {'Variable':<{col_var}} {'Price ID':<{col_id}} Action")
    print(f"  {'─'*(col_var-2)} {'─'*(col_id-2)} {'─'*12}")

    written = 0
    skipped = 0

    for env_var in sorted(updates):
        price_id = updates[env_var]
        current  = get_value(lines, env_var)

        if current == price_id:
            print(f"  {CYAN}{env_var:<{col_var}}{RESET} {price_id:<{col_id}} {YELLOW}already set{RESET}")
            skipped += 1
            continue

        if current and not args.force:
            print(f"  {CYAN}{env_var:<{col_var}}{RESET} {price_id:<{col_id}} "
                  f"{YELLOW}skipped (current: {current[:20]}...) — use --force to overwrite{RESET}")
            skipped += 1
            continue

        action = "updated" if current else "added"
        print(f"  {CYAN}{env_var:<{col_var}}{RESET} {price_id:<{col_id}} {GREEN}{action}{RESET}")

        if not args.dry_run:
            lines = set_value(lines, env_var, price_id)
        written += 1

    print()

    if not args.dry_run and written > 0:
        write_env(env_path, lines)
        print(f"{GREEN}{BOLD}  ✔  {written} variable(s) written to {env_path}{RESET}")
    elif args.dry_run and written > 0:
        print(f"{YELLOW}{BOLD}  DRY RUN: {written} variable(s) would be written "
              f"(run without --dry-run to apply){RESET}")
    else:
        print(f"{YELLOW}  No changes made — {skipped} variable(s) already set correctly.{RESET}")

    print(f"{BOLD}{'='*68}{RESET}\n")


if __name__ == "__main__":
    main()

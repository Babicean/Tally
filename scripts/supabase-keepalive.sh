#!/usr/bin/env bash
# Keeps the free-tier Supabase project awake.
#
# Supabase pauses free projects after about a week without database
# traffic, and permanently freezes them after 90 days paused. This makes
# one real, harmless database read through the REST API: a select on
# `backups` with the PUBLIC publishable key. Row Level Security filters
# it to nothing (an anonymous caller owns no rows), so it reads no user
# data, writes nothing, and needs no secret.
#
# Exit 0 when the database answered; non-zero otherwise, so a failed run
# shows up red in GitHub Actions and emails the repo owner. A failure
# usually means the project is already paused: restore it from the
# Supabase dashboard.
#
# URL and key are read from src/lib/syncConfig.ts so they stay in one
# place. SUPABASE_URL / SUPABASE_KEY override them (used by the tests).
set -uo pipefail

CONFIG="${CONFIG:-src/lib/syncConfig.ts}"
URL="${SUPABASE_URL:-$(sed -n 's/.*SYNC_URL = "\([^"]*\)".*/\1/p' "$CONFIG")}"
KEY="${SUPABASE_KEY:-$(sed -n 's/.*SYNC_KEY = "\([^"]*\)".*/\1/p' "$CONFIG")}"
ATTEMPTS="${ATTEMPTS:-3}"
DELAY="${DELAY:-20}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "Could not read SYNC_URL / SYNC_KEY from $CONFIG" >&2
  exit 2
fi

body="$(mktemp)"
trap 'rm -f "$body"' EXIT

for attempt in $(seq 1 "$ATTEMPTS"); do
  code="$(curl -sS -o "$body" -w '%{http_code}' -m 30 \
    "$URL/rest/v1/backups?select=user_id&limit=1" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" 2>/dev/null || true)"
  case "$code" in
    2??)
      echo "Supabase answered ($code) on attempt $attempt: the project is awake."
      exit 0
      ;;
    401|403)
      # Postgres itself refused the anonymous read: still a database
      # round trip, which is all the keep-alive needs.
      if grep -q '"code"' "$body"; then
        echo "Supabase answered ($code, permission check) on attempt $attempt: the project is awake."
        exit 0
      fi
      ;;
  esac
  echo "Attempt $attempt: HTTP ${code:-none}. $(head -c 300 "$body" 2>/dev/null)"
  [ "$attempt" -lt "$ATTEMPTS" ] && sleep "$DELAY"
done

echo "Supabase did not answer after $ATTEMPTS attempts." >&2
echo "If the project is paused, restore it at https://supabase.com/dashboard before it hits 90 days." >&2
exit 1

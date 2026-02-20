#!/usr/bin/env bash
#
# Check if data.db is stale compared to diffable/ and reload if needed.
# Called automatically before dev server starts.
#

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DB_PATH="$PROJECT_ROOT/.pocketbase/pb_data/data.db"
readonly DIFFABLE_DIR="$PROJECT_ROOT/.pocketbase/pb_data/diffable"

# If no database exists, restore from diffable
if [ ! -f "$DB_PATH" ]; then
    echo "→ No data.db found, restoring from diffable/..."
    cd "$PROJECT_ROOT"
    npx tsx scripts/db-diffable.ts load "$DB_PATH" "$DIFFABLE_DIR"
    echo "✓ Database restored"
    exit 0
fi

# Compare modification times: if any diffable file is newer than data.db, reload
db_mtime=$(stat -f "%m" "$DB_PATH" 2>/dev/null || stat -c "%Y" "$DB_PATH" 2>/dev/null)
newest_diffable=$(find "$DIFFABLE_DIR" -name "*.ndjson" -newer "$DB_PATH" 2>/dev/null | head -1)

if [ -n "$newest_diffable" ]; then
    echo "→ diffable/ has changes newer than data.db, reloading..."
    rm -f "$DB_PATH" "${DB_PATH}-wal" "${DB_PATH}-shm"
    cd "$PROJECT_ROOT"
    npx tsx scripts/db-diffable.ts load "$DB_PATH" "$DIFFABLE_DIR"
    echo "✓ Database reloaded from diffable/"
else
    echo "✓ data.db is up to date with diffable/"
fi

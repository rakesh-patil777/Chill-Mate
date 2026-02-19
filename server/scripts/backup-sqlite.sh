#!/usr/bin/env bash
set -euo pipefail

# Configurable via env for future migration
DB_FILE="${DATABASE_URL:-$(pwd)/chillmate.db}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-7}"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$DB_FILE" ]]; then
  echo "Database file not found: $DB_FILE"
  exit 1
fi

timestamp="$(date +'%Y%m%d-%H%M%S')"
backup_file="$BACKUP_DIR/chillmate-$timestamp.db"

# Online backup using sqlite3 to avoid heavy locking/copy contention.
sqlite3 "$DB_FILE" ".timeout 5000" ".backup '$backup_file'"

# Keep only the latest N backups.
mapfile -t backups < <(ls -1t "$BACKUP_DIR"/chillmate-*.db 2>/dev/null || true)
if (( ${#backups[@]} > KEEP_COUNT )); then
  for old in "${backups[@]:$KEEP_COUNT}"; do
    rm -f "$old"
  done
fi

echo "Backup created: $backup_file"

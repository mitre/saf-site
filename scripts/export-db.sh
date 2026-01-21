#!/usr/bin/env bash
#
# Export Pocketbase database to git-friendly format
#
# Run this after making changes in Pocketbase to prepare for commit.
#
# Usage:
#   ./scripts/export-db.sh              Export database
#   ./scripts/export-db.sh --dry-run    Preview what would happen
#   ./scripts/export-db.sh --diff       Export and show git diff
#

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DB_PATH="$PROJECT_ROOT/.pocketbase/pb_data/data.db"
readonly DIFFABLE_DIR="$PROJECT_ROOT/.pocketbase/pb_data/diffable"

# -----------------------------------------------------------------------------
# Colors
# -----------------------------------------------------------------------------

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*"; }
info()  { echo -e "${BLUE}→${NC} $*"; }

# -----------------------------------------------------------------------------
# Flags
# -----------------------------------------------------------------------------

DRY_RUN=false
SHOW_DIFF=false

# -----------------------------------------------------------------------------
# Argument Parsing
# -----------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -d|--diff)
            SHOW_DIFF=true
            shift
            ;;
        -h|--help)
            cat << 'EOF'
Export Pocketbase database to git-friendly format

USAGE:
    ./scripts/export-db.sh [OPTIONS]

OPTIONS:
    -n, --dry-run   Preview what would happen
    -d, --diff      Export and show git diff of changes
    -h, --help      Show this help

WORKFLOW:
    1. Make changes in Pocketbase UI (http://localhost:8090/_/)
    2. Run: ./scripts/export-db.sh
    3. Review changes: git diff .pocketbase/pb_data/diffable/
    4. Commit: git add .pocketbase/pb_data/diffable/ && git commit

EOF
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

echo ""
echo "=========================================="
if [ "$DRY_RUN" = true ]; then
    echo -e "  Database Export ${BLUE}[DRY RUN]${NC}"
else
    echo "  Database Export"
fi
echo "=========================================="
echo ""

# Check prerequisites
if ! command -v sqlite-diffable &> /dev/null; then
    error "sqlite-diffable not found"
    echo "    Install: pip install sqlite-diffable"
    exit 1
fi
ok "sqlite-diffable available"

# Check database exists
if [ ! -f "$DB_PATH" ]; then
    error "Database not found: $DB_PATH"
    echo "    Run ./scripts/setup.sh first"
    exit 1
fi

DB_SIZE=$(ls -lh "$DB_PATH" | awk '{print $5}')
ok "Database found: data.db ($DB_SIZE)"

# Count current tables
CURRENT_TABLES=$(find "$DIFFABLE_DIR" -name "*.ndjson" 2>/dev/null | wc -l | tr -d ' ')
info "Current diffable/ has $CURRENT_TABLES tables"

echo ""

# Export
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}[DRY RUN]${NC} Would run:"
    echo "    cd $PROJECT_ROOT/.pocketbase/pb_data"
    echo "    sqlite-diffable dump data.db diffable/ --all"
else
    info "Exporting database..."
    cd "$PROJECT_ROOT/.pocketbase/pb_data"
    sqlite-diffable dump data.db diffable/ --all

    # Remove SQLite internal statistics tables (cannot be restored, breaks sqlite-diffable load)
    rm -f diffable/sqlite_stat*.metadata.json diffable/sqlite_stat*.ndjson 2>/dev/null || true

    cd "$PROJECT_ROOT"

    NEW_TABLES=$(find "$DIFFABLE_DIR" -name "*.ndjson" | wc -l | tr -d ' ')
    ok "Exported $NEW_TABLES tables to diffable/"
fi

echo ""

# Show diff if requested
if [ "$SHOW_DIFF" = true ] && [ "$DRY_RUN" = false ]; then
    echo "=========================================="
    echo "  Git Diff"
    echo "=========================================="
    echo ""
    git -C "$PROJECT_ROOT" diff --stat .pocketbase/pb_data/diffable/ || true
    echo ""
fi

# Summary
echo "=========================================="
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  Dry run complete${NC}"
else
    echo -e "${GREEN}  Export complete!${NC}"
fi
echo "=========================================="
echo ""

if [ "$DRY_RUN" = false ]; then
    echo "Next steps:"
    echo "  1. Review:  git diff .pocketbase/pb_data/diffable/"
    echo "  2. Stage:   git add .pocketbase/pb_data/diffable/"
    echo "  3. Commit:  git commit -m 'Update content data'"
    echo ""
fi

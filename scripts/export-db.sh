#!/usr/bin/env bash
#
# Export database to git-friendly format
#
# Run this after making changes to the database to prepare for commit.
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
readonly DB_PATH="$PROJECT_ROOT/docs/.vitepress/database/drizzle.db"
readonly DIFFABLE_DIR="$PROJECT_ROOT/docs/.vitepress/database/diffable"

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
Export database to git-friendly format

USAGE:
    ./scripts/export-db.sh [OPTIONS]

OPTIONS:
    -n, --dry-run   Preview what would happen
    -d, --diff      Export and show git diff of changes
    -h, --help      Show this help

WORKFLOW:
    1. Make changes via CLI: pnpm cli content add/update
    2. Run: ./scripts/export-db.sh
    3. Review changes: git diff docs/.vitepress/database/diffable/
    4. Commit: git add docs/.vitepress/database/diffable/ && git commit

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

# Check prerequisites (tsx for TypeScript db-diffable script)
if [ ! -f "$PROJECT_ROOT/node_modules/.bin/tsx" ]; then
    error "tsx not found - run pnpm install first"
    exit 1
fi
ok "tsx available"

# Check database exists
if [ ! -f "$DB_PATH" ]; then
    error "Database not found: $DB_PATH"
    echo "    Run ./scripts/setup.sh first"
    exit 1
fi

DB_SIZE=$(ls -lh "$DB_PATH" | awk '{print $5}')
ok "Database found: drizzle.db ($DB_SIZE)"

# Count current tables
CURRENT_TABLES=$(find "$DIFFABLE_DIR" -name "*.ndjson" 2>/dev/null | wc -l | tr -d ' ')
info "Current diffable/ has $CURRENT_TABLES tables"

echo ""

# Export
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}[DRY RUN]${NC} Would run:"
    echo "    pnpm db:dump"
else
    info "Exporting database..."
    cd "$PROJECT_ROOT"

    # Use TypeScript db-diffable script
    npx tsx scripts/db-diffable.ts dump "$DB_PATH" "$DIFFABLE_DIR"

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
    git -C "$PROJECT_ROOT" diff --stat docs/.vitepress/database/diffable/ || true
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
    echo "  1. Review:  git diff docs/.vitepress/database/diffable/"
    echo "  2. Stage:   git add docs/.vitepress/database/diffable/"
    echo "  3. Commit:  git commit -m 'Update content data'"
    echo ""
fi

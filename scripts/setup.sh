#!/usr/bin/env bash
#
# MITRE SAF Site - Development Setup
#
# Idempotent setup script - safe to run anytime.
# First-time setup or returning after git pull? Just run this.
#
# Usage:
#   ./scripts/setup.sh              Run setup (safe, idempotent)
#   ./scripts/setup.sh --check      Validate setup without changes
#   ./scripts/setup.sh --dry-run    Preview what would happen
#   ./scripts/setup.sh --force      Force fresh database restore
#   ./scripts/setup.sh --help       Show this help
#
# Flags:
#   -c, --check     Check/validate only, no changes
#   -n, --dry-run   Show what would happen without doing it
#   -f, --force     Force database restore (overwrites local data.db)
#   -y, --yes       Skip confirmation prompts (for CI/CD)
#   -h, --help      Show help message
#

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DATABASE_DIR="$PROJECT_ROOT/docs/.vitepress/database"
readonly DB_PATH="$DATABASE_DIR/drizzle.db"
readonly DIFFABLE_DIR="$DATABASE_DIR/diffable"
readonly LEGACY_POCKETBASE_DIR="$PROJECT_ROOT/.pocketbase"

# -----------------------------------------------------------------------------
# Colors and Output
# -----------------------------------------------------------------------------

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Status indicators
ok()      { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}!${NC} $*"; }
error()   { echo -e "${RED}✗${NC} $*"; }
info()    { echo -e "${BLUE}→${NC} $*"; }
skip()    { echo -e "${BLUE}○${NC} $*"; }
dry()     { echo -e "${BLUE}[DRY RUN]${NC} $*"; }
check_only() { echo -e "${BLUE}[CHECK]${NC} $*"; }

# -----------------------------------------------------------------------------
# Flags
# -----------------------------------------------------------------------------

CHECK_MODE=false
DRY_RUN=false
FORCE=false
YES=false

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------

show_help() {
    cat << 'EOF'
MITRE SAF Site - Development Setup

USAGE:
    ./scripts/setup.sh [OPTIONS]

OPTIONS:
    -c, --check     Validate setup without making changes
    -n, --dry-run   Preview what would happen
    -f, --force     Force database restore (overwrites local data.db)
    -y, --yes       Skip confirmation prompts (for CI/CD)
    -h, --help      Show this help message

EXAMPLES:
    ./scripts/setup.sh              # Normal setup (safe, idempotent)
    ./scripts/setup.sh --check      # Just validate everything is OK
    ./scripts/setup.sh --dry-run    # See what would happen
    ./scripts/setup.sh --force      # Fresh database from diffable
    ./scripts/setup.sh --force -y   # CI/CD: non-interactive fresh setup

WHAT IT DOES:
    1. Checks prerequisites (Node.js, pnpm)
    2. Installs/updates Node dependencies
    3. Restores database from diffable (only if missing, unless --force)
    4. Cleans up legacy .pocketbase/ directory (if present)

IDEMPOTENT:
    Safe to run multiple times. Will not overwrite your local database
    unless you explicitly use --force.

EOF
    exit 0
}

# -----------------------------------------------------------------------------
# Argument Parsing
# -----------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -c|--check)
                CHECK_MODE=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -y|--yes)
                YES=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                error "Unknown option: $1"
                echo "Run './scripts/setup.sh --help' for usage"
                exit 1
                ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

confirm() {
    local prompt="$1"
    if [ "$YES" = true ]; then
        return 0
    fi
    read -p "$prompt (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

command_exists() {
    command -v "$1" &> /dev/null
}

# -----------------------------------------------------------------------------
# Setup Steps
# -----------------------------------------------------------------------------

print_header() {
    echo ""
    echo "=========================================="
    if [ "$CHECK_MODE" = true ]; then
        echo -e "  MITRE SAF Site ${BLUE}[CHECK MODE]${NC}"
    elif [ "$DRY_RUN" = true ]; then
        echo -e "  MITRE SAF Site ${BLUE}[DRY RUN]${NC}"
    elif [ "$FORCE" = true ]; then
        echo -e "  MITRE SAF Site ${YELLOW}[FORCE MODE]${NC}"
    else
        echo "  MITRE SAF Site - Setup"
    fi
    echo "=========================================="
    echo ""
}

check_prerequisites() {
    echo -e "${BOLD}Prerequisites${NC}"
    echo ""

    local missing=0

    # Node.js
    if command_exists node; then
        local node_version
        node_version=$(node --version)
        ok "Node.js $node_version"
    else
        error "Node.js not found"
        echo "    Install: https://nodejs.org/ or use nvm"
        missing=1
    fi

    # pnpm
    if command_exists pnpm; then
        local pnpm_version
        pnpm_version=$(pnpm --version)
        ok "pnpm $pnpm_version"
    else
        error "pnpm not found"
        echo "    Install: npm install -g pnpm"
        missing=1
    fi

    # tsx (REQUIRED for database restore script)
    if command_exists tsx; then
        ok "tsx (for db-diffable.ts)"
    else
        # tsx is installed via pnpm, check if node_modules exists
        if [ -f "$PROJECT_ROOT/node_modules/.bin/tsx" ]; then
            ok "tsx (via node_modules)"
        else
            warn "tsx not found - will be available after pnpm install"
        fi
    fi

    echo ""

    if [ $missing -eq 1 ]; then
        error "Missing required dependencies"
        exit 1
    fi
}

setup_dependencies() {
    echo -e "${BOLD}Node Dependencies${NC}"
    echo ""

    cd "$PROJECT_ROOT"

    if [ "$CHECK_MODE" = true ]; then
        if [ -d "node_modules" ]; then
            local pkg_count
            pkg_count=$(find node_modules -maxdepth 1 -type d | wc -l | tr -d ' ')
            check_only "node_modules exists ($pkg_count packages)"
        else
            error "node_modules missing - run setup without --check"
        fi
    elif [ "$DRY_RUN" = true ]; then
        dry "Would run: pnpm install"
    else
        info "Running pnpm install..."
        pnpm install --reporter=silent
        ok "Dependencies installed"
    fi

    echo ""
}

setup_database() {
    echo -e "${BOLD}Database${NC}"
    echo ""

    # Check diffable directory
    if [ ! -d "$DIFFABLE_DIR" ]; then
        error "diffable/ directory not found at $DIFFABLE_DIR"
        echo "    Database export is missing. Contact maintainers."
        exit 1
    fi

    local table_count
    table_count=$(find "$DIFFABLE_DIR" -name "*.ndjson" | wc -l | tr -d ' ')
    ok "Found $table_count tables in diffable/"

    # Check current database state
    if [ -f "$DB_PATH" ]; then
        local db_size
        db_size=$(ls -lh "$DB_PATH" | awk '{print $5}')
        local db_modified
        db_modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$DB_PATH" 2>/dev/null || stat -c "%y" "$DB_PATH" 2>/dev/null | cut -d. -f1)

        if [ "$FORCE" = true ]; then
            warn "Existing drizzle.db ($db_size, modified $db_modified)"

            if [ "$CHECK_MODE" = true ]; then
                check_only "Would restore database (--force specified)"
            elif [ "$DRY_RUN" = true ]; then
                dry "Would delete drizzle.db and restore from diffable/"
            else
                if confirm "    Overwrite with fresh restore?"; then
                    restore_database
                else
                    skip "Keeping existing database"
                fi
            fi
        else
            ok "Database exists: drizzle.db ($db_size)"
            skip "Use --force to restore from diffable/"
        fi
    else
        warn "No drizzle.db found - needs restore"

        if [ "$CHECK_MODE" = true ]; then
            error "Database missing - run setup without --check"
        elif [ "$DRY_RUN" = true ]; then
            dry "Would run: db-diffable.ts load drizzle.db diffable/"
        else
            restore_database
        fi
    fi

    echo ""
}

restore_database() {
    info "Restoring database from diffable/..."

    cd "$PROJECT_ROOT"

    # Use TypeScript db-diffable script (requires node_modules)
    if [ ! -f "node_modules/.bin/tsx" ]; then
        error "tsx not found - run pnpm install first"
        exit 1
    fi

    # Restore with error checking
    if ! npx tsx scripts/db-diffable.ts load "$DB_PATH" "$DIFFABLE_DIR"; then
        error "Database restore FAILED"
        echo "    Check that diffable/ directory contains valid exports"
        echo "    Try: pnpm db:load"
        exit 1
    fi

    # Verify database was created
    if [ ! -f "$DB_PATH" ]; then
        error "Database file was not created"
        exit 1
    fi

    local db_size
    db_size=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH" 2>/dev/null || echo "unknown")
    ok "Database restored ($db_size bytes)"
}

cleanup_legacy_pocketbase() {
    echo -e "${BOLD}Legacy Cleanup${NC}"
    echo ""

    if [ ! -d "$LEGACY_POCKETBASE_DIR" ]; then
        ok "No legacy .pocketbase/ directory"
        echo ""
        return
    fi

    # Calculate size of legacy directory
    local legacy_size
    legacy_size=$(du -sh "$LEGACY_POCKETBASE_DIR" 2>/dev/null | cut -f1 || echo "unknown")

    warn "Legacy .pocketbase/ directory found ($legacy_size)"
    info "This project now uses docs/.vitepress/database/"
    info "The .pocketbase/ directory is no longer needed"

    if [ "$CHECK_MODE" = true ]; then
        check_only "Would remove .pocketbase/ directory"
        echo ""
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        dry "Would remove .pocketbase/ directory ($legacy_size)"
        echo ""
        return
    fi

    # In --force or --yes mode, clean up automatically
    if [ "$FORCE" = true ] || [ "$YES" = true ]; then
        info "Removing .pocketbase/ (--force or --yes specified)..."
        rm -rf "$LEGACY_POCKETBASE_DIR"
        ok "Removed legacy .pocketbase/ directory"
        echo ""
        return
    fi

    # Interactive mode - ask user
    if confirm "    Remove .pocketbase/ directory?"; then
        rm -rf "$LEGACY_POCKETBASE_DIR"
        ok "Removed legacy .pocketbase/ directory"
    else
        skip "Keeping .pocketbase/ (you can delete it manually later)"
    fi

    echo ""
}

print_summary() {
    if [ "$CHECK_MODE" = true ]; then
        echo "=========================================="
        echo -e "${BLUE}  Check complete${NC}"
        echo "=========================================="
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        echo "=========================================="
        echo -e "${BLUE}  Dry run complete - no changes made${NC}"
        echo "=========================================="
        echo ""
        echo "Run without --dry-run to apply changes"
        return
    fi

    echo "=========================================="
    echo -e "${GREEN}  Setup complete!${NC}"
    echo "=========================================="
    echo ""
    echo "To start development:"
    echo ""
    echo "  pnpm dev"
    echo ""
    echo "  Site: http://localhost:5173"
    echo ""
    echo "Database management:"
    echo ""
    echo "  pnpm cli db status    # Check database status"
    echo "  pnpm cli content list # List content records"
    echo "  pnpm db:export        # Export to diffable/"
    echo ""
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    parse_args "$@"

    cd "$PROJECT_ROOT"

    print_header
    check_prerequisites
    setup_dependencies
    setup_database
    cleanup_legacy_pocketbase
    print_summary
}

main "$@"

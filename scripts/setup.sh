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
readonly POCKETBASE_DIR="$PROJECT_ROOT/.pocketbase"
readonly DB_PATH="$POCKETBASE_DIR/pb_data/data.db"
readonly DIFFABLE_DIR="$POCKETBASE_DIR/pb_data/diffable"
readonly MIGRATIONS_DIR="$POCKETBASE_DIR/pb_migrations"

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
    1. Checks prerequisites (Node.js, pnpm, sqlite-diffable)
    2. Installs/updates Node dependencies
    3. Restores database from diffable (only if missing, unless --force)
    4. Clears Pocketbase migrations (prevents startup errors)
    5. Validates Pocketbase binary

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

    # sqlite-diffable
    if command_exists sqlite-diffable; then
        ok "sqlite-diffable"
    else
        warn "sqlite-diffable not found"
        echo "    Install: pip install sqlite-diffable"
        echo "    Required for database restore/export"
        # Not fatal - might have existing data.db
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
            warn "Existing data.db ($db_size, modified $db_modified)"

            if [ "$CHECK_MODE" = true ]; then
                check_only "Would restore database (--force specified)"
            elif [ "$DRY_RUN" = true ]; then
                dry "Would delete data.db and restore from diffable/"
            else
                if confirm "    Overwrite with fresh restore?"; then
                    restore_database
                else
                    skip "Keeping existing database"
                fi
            fi
        else
            ok "Database exists: data.db ($db_size)"
            skip "Use --force to restore from diffable/"
        fi
    else
        warn "No data.db found - needs restore"

        if [ "$CHECK_MODE" = true ]; then
            error "Database missing - run setup without --check"
        elif [ "$DRY_RUN" = true ]; then
            dry "Would run: sqlite-diffable load data.db diffable/"
        else
            restore_database
        fi
    fi

    echo ""
}

restore_database() {
    if ! command_exists sqlite-diffable; then
        error "Cannot restore: sqlite-diffable not installed"
        echo "    Install: pip install sqlite-diffable"
        exit 1
    fi

    info "Restoring database from diffable/..."

    cd "$POCKETBASE_DIR/pb_data"

    # Remove existing database files
    rm -f data.db data.db-shm data.db-wal

    # Restore
    sqlite-diffable load data.db diffable/

    cd "$PROJECT_ROOT"

    ok "Database restored"
}

setup_migrations() {
    echo -e "${BOLD}Migrations${NC}"
    echo ""

    if [ ! -d "$MIGRATIONS_DIR" ]; then
        ok "No migrations directory (OK)"
        echo ""
        return
    fi

    local migration_count
    migration_count=$(find "$MIGRATIONS_DIR" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$migration_count" -eq 0 ]; then
        ok "Migrations directory clean"
    else
        warn "Found $migration_count migration files"
        echo "    These can cause startup errors with a restored database"

        if [ "$CHECK_MODE" = true ]; then
            check_only "Would clear migrations"
        elif [ "$DRY_RUN" = true ]; then
            dry "Would remove $MIGRATIONS_DIR/*.js"
        else
            rm -f "$MIGRATIONS_DIR"/*.js
            ok "Migrations cleared"
        fi
    fi

    echo ""
}

check_pocketbase() {
    echo -e "${BOLD}Pocketbase${NC}"
    echo ""

    local pb_binary="$POCKETBASE_DIR/pocketbase"
    local pb_version="0.23.4"

    # Detect platform
    local os arch pb_os pb_arch
    os="$(uname -s)"
    arch="$(uname -m)"

    case "$os" in
        Darwin) pb_os="darwin" ;;
        Linux)  pb_os="linux" ;;
        MINGW*|MSYS*|CYGWIN*) pb_os="windows" ;;
        *)
            error "Unsupported OS: $os"
            exit 1
            ;;
    esac

    case "$arch" in
        x86_64|amd64) pb_arch="amd64" ;;
        arm64|aarch64) pb_arch="arm64" ;;
        *)
            error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac

    local platform="${pb_os}_${pb_arch}"
    info "Platform: $platform"

    # Check if binary exists and works
    local need_download=false
    if [ ! -f "$pb_binary" ]; then
        warn "Pocketbase binary not found"
        need_download=true
    elif [ ! -x "$pb_binary" ]; then
        chmod +x "$pb_binary" 2>/dev/null || true
    fi

    # Try to run it to verify it's the right platform
    if [ "$need_download" = false ] && [ -f "$pb_binary" ]; then
        if ! "$pb_binary" --version &>/dev/null; then
            warn "Pocketbase binary exists but won't run (wrong platform?)"
            need_download=true
        fi
    fi

    # Download if needed
    if [ "$need_download" = true ]; then
        if [ "$CHECK_MODE" = true ]; then
            check_only "Would download Pocketbase $pb_version for $platform"
        elif [ "$DRY_RUN" = true ]; then
            dry "Would download Pocketbase $pb_version for $platform"
        else
            download_pocketbase "$pb_version" "$platform"
        fi
    else
        local current_version
        current_version=$("$pb_binary" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        ok "Pocketbase $current_version ready"
    fi

    echo ""
}

download_pocketbase() {
    local version="$1"
    local platform="$2"
    local ext="zip"
    local download_url="https://github.com/pocketbase/pocketbase/releases/download/v${version}/pocketbase_${version}_${platform}.${ext}"

    info "Downloading Pocketbase $version for $platform..."

    # Create directory if needed
    mkdir -p "$POCKETBASE_DIR"

    # Download
    local tmp_file="/tmp/pocketbase_${version}_${platform}.${ext}"
    if command -v curl &>/dev/null; then
        curl -fsSL "$download_url" -o "$tmp_file" || {
            error "Failed to download Pocketbase"
            echo "    URL: $download_url"
            exit 1
        }
    elif command -v wget &>/dev/null; then
        wget -q "$download_url" -O "$tmp_file" || {
            error "Failed to download Pocketbase"
            echo "    URL: $download_url"
            exit 1
        }
    else
        error "Neither curl nor wget found"
        exit 1
    fi

    # Extract
    info "Extracting..."
    if command -v unzip &>/dev/null; then
        unzip -o -q "$tmp_file" -d "$POCKETBASE_DIR" pocketbase || {
            error "Failed to extract Pocketbase"
            exit 1
        }
    else
        error "unzip not found - please install it"
        exit 1
    fi

    # Cleanup
    rm -f "$tmp_file"

    # Make executable
    chmod +x "$POCKETBASE_DIR/pocketbase"

    ok "Pocketbase $version installed"
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
    echo -e "  ${BOLD}1.${NC} Start Pocketbase (terminal 1):"
    echo "     cd .pocketbase && ./pocketbase serve"
    echo ""
    echo -e "  ${BOLD}2.${NC} Start dev server (terminal 2):"
    echo "     pnpm dev"
    echo ""
    echo "  Site:            http://localhost:5173"
    echo "  Pocketbase UI:   http://localhost:8090/_/"
    echo "  Login:           admin@localhost.com / testpassword123"
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
    setup_migrations
    check_pocketbase
    print_summary
}

main "$@"

#!/bin/bash
# Setup pb CLI context for this project
#
# This script:
# 1. Creates/updates the 'saf-site' pb context
# 2. Configures all collections from the diffable export
# 3. Authenticates with Pocketbase
#
# Usage: ./scripts/setup-pb-cli.sh

set -e

POCKETBASE_URL="${POCKETBASE_URL:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${POCKETBASE_ADMIN_EMAIL:-admin@localhost.com}"
ADMIN_PASSWORD="${POCKETBASE_ADMIN_PASSWORD:-testpassword123}"
CONTEXT_NAME="saf-site"

echo "🔧 Setting up pb CLI for SAF Site"
echo "   URL: $POCKETBASE_URL"
echo ""

# Check if pb is installed
if ! command -v pb &> /dev/null; then
    echo "❌ pb CLI not installed. Install with: go install github.com/pocketbase/pb-cli@latest"
    exit 1
fi

# Check if Pocketbase is running
if ! curl -s "$POCKETBASE_URL/api/health" > /dev/null 2>&1; then
    echo "❌ Pocketbase not running at $POCKETBASE_URL"
    echo "   Start it with: cd .pocketbase && ./pocketbase serve"
    exit 1
fi

echo "✅ Pocketbase is running"

# Create or switch to context
echo ""
echo "📁 Setting up context '$CONTEXT_NAME'..."
if pb context list 2>&1 | grep -q "$CONTEXT_NAME"; then
    pb context use "$CONTEXT_NAME" 2>/dev/null || true
else
    pb context create "$CONTEXT_NAME" --url "$POCKETBASE_URL" 2>/dev/null || true
    pb context use "$CONTEXT_NAME" 2>/dev/null || true
fi

# Authenticate
echo ""
echo "🔐 Authenticating..."
pb auth -c _superusers -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>/dev/null || {
    echo "❌ Authentication failed. Check credentials."
    exit 1
}
echo "✅ Authenticated"

# Get all collections from diffable export (excluding system tables)
echo ""
echo "📋 Configuring collections..."

COLLECTIONS=$(ls .pocketbase/pb_data/diffable/*.ndjson 2>/dev/null | \
    xargs -I {} basename {} .ndjson | \
    grep -v "^_" | \
    sort | \
    tr '\n' ' ')

if [ -z "$COLLECTIONS" ]; then
    echo "❌ No collections found. Run 'pnpm db:export' first."
    exit 1
fi

# Clear and add collections
pb context collections clear 2>/dev/null || true
pb context collections add $COLLECTIONS 2>/dev/null || true

# Show result
echo ""
echo "✅ pb CLI configured!"
echo ""
pb context show 2>&1 | head -20

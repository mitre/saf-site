#!/usr/bin/env bash
# CLI wrapper script for saf-site CLI
# Usage: ./scripts/cli.sh <command> [args...]

cd "$(dirname "$0")/../cli" && pnpm dev "$@"

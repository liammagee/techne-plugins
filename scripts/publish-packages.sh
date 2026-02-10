#!/bin/bash
set -e

# Publish @machinespirits packages to npm.
# Run from any directory after making changes to tutor-core or eval.
#
# Usage:
#   ./scripts/publish-packages.sh           # publish all
#   ./scripts/publish-packages.sh eval      # publish eval only
#   ./scripts/publish-packages.sh tutor     # publish tutor-core only
#   ./scripts/publish-packages.sh --dry-run # dry run all

DEV_DIR="$HOME/Dev"
DRY_RUN=""
TARGET="${1:-all}"

if [ "$1" = "--dry-run" ] || [ "$2" = "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo "=== DRY RUN ==="
fi

publish_pkg() {
    local dir="$1"
    local name="$2"
    if [ ! -d "$dir" ]; then
        echo "SKIP $name — directory not found: $dir"
        return
    fi
    local version
    version=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$dir/package.json','utf8')).version)")
    echo ""
    echo "--- $name@$version ---"
    cd "$dir" && npm publish --access public $DRY_RUN
}

if [ "$TARGET" = "all" ] || [ "$TARGET" = "tutor" ] || [ "$TARGET" = "tutor-core" ]; then
    publish_pkg "$DEV_DIR/machinespirits-tutor-core" "@machinespirits/tutor-core"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "eval" ]; then
    publish_pkg "$DEV_DIR/machinespirits-eval" "@machinespirits/eval"
fi

echo ""
echo "Done. Remember to update version ranges in consumers if you bumped a major version."

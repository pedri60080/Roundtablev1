#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# shellcheck source=/dev/null
source "$REPO_ROOT/../prototypes-portal/deploy/lib/docker-plugin-common.sh"
current_hash="$(compute_hash_from_sources "$REPO_ROOT/Docker/hash-sources.txt" "$REPO_ROOT")"
needs_build_from_hash "$current_hash"

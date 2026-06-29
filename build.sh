#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$REPO_ROOT/../build-pipeline/scripts/build-app.sh" roundtable-v1 "$REPO_ROOT" roundtable-v1

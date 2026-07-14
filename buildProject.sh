#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE="$(cd "$REPO_ROOT/../../infra/DockerInfra/concepts/build-pipeline" && pwd)"
exec "$PIPELINE/scripts/build-project.sh"

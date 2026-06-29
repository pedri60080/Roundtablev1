#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# shellcheck source=metadata.sh
source /dev/stdin <<< "$(tr -d '\r' < "$REPO_ROOT/Docker/metadata.sh")"
# shellcheck source=/dev/null
source "$REPO_ROOT/../concepts/deploy/lib/docker-plugin-common.sh"
build_image_standard "$IMAGE_NAME" "Docker/Dockerfile" "$BUILD_TAG"

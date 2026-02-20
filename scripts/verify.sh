#!/usr/bin/env bash
# /scripts/verify.sh
set -euo pipefail

# Local/CI common quality gate for this repo.
# Keep this script stable: Makefile and CI should call this.

npm run -s verify

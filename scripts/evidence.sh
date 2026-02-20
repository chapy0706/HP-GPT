#!/usr/bin/env bash
# /scripts/evidence.sh
set -euo pipefail

mkdir -p out/evidence

ts_utc=$(date -u +%Y%m%dT%H%M%SZ)
{
  echo "ts_utc=${ts_utc}"
  echo "pwd=$(pwd)"
  echo "node=$(node -v 2>/dev/null || true)"
  echo "os=$(uname -a)"
  echo "sha=$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"
  echo "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'no-git')"
  echo "dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  echo ""
  echo "== make verify =="
  make verify
} | tee "out/evidence/verify_${ts_utc}.log"

#!/usr/bin/env bash
# /scripts/evidence.sh
set -euo pipefail

mkdir -p out/evidence

ts() {
  # ISO-ish timestamp, UTC
  date -u "+%Y%m%dT%H%M%SZ" 2>/dev/null || date "+%Y%m%dT%H%M%SZ"
}

sha() {
  git rev-parse --short HEAD 2>/dev/null || echo "no-git"
}

LOG="out/evidence/$(ts)-$(sha).log"

{
  echo "# evidence"
  echo "timestamp_utc: $(ts)"
  echo "git_sha: $(sha)"
  echo "node: $(node -v 2>/dev/null || echo unknown)"
  echo "npm: $(npm -v 2>/dev/null || echo unknown)"
  echo
  echo "## git status (porcelain)"
  git status --porcelain=v1 2>/dev/null || true
  echo
  echo "## verify"
  echo "+ make verify"
} | tee "$LOG" >/dev/null

# Run verify and append logs (keep ordering stable)
(
  set -o pipefail
  make verify 2>&1 | tee -a "$LOG"
)

echo "Saved evidence: $LOG"

# /Makefile

SHELL := /usr/bin/env bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

help:
	@printf "%s\n" \
		"make serve        # serve static files (node only)" \
		"make verify       # offline quality gate (no deps)" \
		"make evidence     # verify + write out/evidence/*.log" \
		"make verify-e2e   # optional: run Playwright if already installed"

serve:
	@node scripts/static-server.mjs --port 4173

verify:
	@node scripts/offline-verify.mjs
	@node --test tests/offline-contract.test.mjs

# Optional. This target intentionally does NOT install anything.
verify-e2e:
	@if [ ! -d node_modules ]; then \
		echo "node_modules がありません。オフライン環境では make verify を使ってください。"; \
		exit 2; \
	fi
	@if [ ! -f node_modules/.bin/playwright ]; then \
		echo "Playwright が見つかりません。既に導入済みの環境でのみ verify-e2e を使ってください。"; \
		exit 2; \
	fi
	@node scripts/static-server.mjs --port 4173 --background
	@node_modules/.bin/playwright test

# Evidence: keep it simple and dependency-free.
evidence:
	@bash scripts/evidence.sh

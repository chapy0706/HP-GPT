# /Makefile

SHELL := /usr/bin/env bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

help:
	@printf "%s\n" \
		"make install    # install deps (CI-safe)" \
		"make browsers   # install Playwright browsers" \
		"make verify     # run quality gate locally" \
		"make ci         # CI entry (non-interactive)" \
		"make evidence   # run verify + write out/evidence/*.log"

install:
	@if [ -f package-lock.json ]; then \
		npm ci --no-audit --no-fund; \
	else \
		npm install --no-audit --no-fund; \
	fi

browsers: install
	@npx playwright install

verify: install
	@npm run -s verify

ci: install
	@npm run -s verify

evidence: install
	@bash scripts/evidence.sh

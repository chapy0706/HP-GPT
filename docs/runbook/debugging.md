<!-- /docs/runbook/debugging.md -->

# デバッグの型（証拠 → 仮説 → 実験 → 決定）

## 1) 証拠を取る

- ローカルで再現: `make verify`
- 再現が不安定な場合は `make evidence` でログを残す

## 2) どこが壊れたかを狭める

- E2Eが落ちたテスト名を見て、関連DOM（id/class）とイベント（click, load, fetch）を特定
- 影響範囲を最小にして修正（“ついで作業”禁止）

## 3) よくある原因

- `id` や `data-section` の変更でイベントが拾えなくなる
- JSONファイルの配置変更で fetch に失敗する（`modal-steps.json`, `logos.json`）
- CSSのdisplay/position変更でクリックできなくなる

<!-- /docs/specs/active/site-behavior.md -->

# Site behavior contracts (offline-first)

このドキュメントは「現行挙動を壊さない」ための最小ルール（契約）だよ。

## 目的

- AI（Claude Code / Codex）が、良かれと思って DOM 構造や ID を変えて挙動を壊す事故を減らす
- ネットワーク無しでも `make verify` が回る状態を維持する

## 変えてはいけない UI API（DOM の契約）

次の ID / class は API として扱い、名前変更や削除をしない。

- イントロ
  - `#intro-overlay`
  - `#skip-button`
- TOP
  - `#start-journey-button`
  - `#main-content`
- チャットモーダル
  - `#journey-modal`
  - `#modal-text`
  - `#modal-actions`
  - `#journey-close-button`
- Feel
  - `#logo-u-grid`

## データファイル契約

以下のどちらかに配置されていること。

- `modal-steps.json` または `data/modal-steps.json`
- `logos.json` または `data/logos.json`

## 検証方法

- オフライン検証（依存なし）
  - `make verify`

- 証跡ログ
  - `make evidence`（`out/evidence/*.log` を生成）

## AI 実装ルール（最小）

- ついでのリファクタ禁止
- DOM 契約を壊す変更は禁止
- 変更後は必ず `make verify` を通す

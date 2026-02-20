<!-- /docs/specs/active/site-behavior.md -->

# Spec: 現行挙動の基準（壊してはいけないもの）

このspecは「見た目」ではなく「挙動」を守るための最低限の約束。

## 1) イントロ → スキップ → TOP表示

- ページロード直後に `#intro-overlay` が表示される
- `#skip-button` を押すと、イントロが閉じてTOPが表示される
- `#main-content` は hidden でなくなる

## 2) はじまりボタン → チャットモーダル

- `#start-journey-button` を押すと `#journey-modal` が開く
- モーダルは `aria-hidden="false"` になる
- 最初のステップとして、`modal-steps.json` の step[0] が描画される

## 3) Feel（ロゴ）ページのグリッド

- Feelセクションで `#logo-u-grid` が 100 マス（`.logo-cell`）生成される
- ロゴ（画像）をクリックすると、右の詳細が更新される
  - `#detail-author` が空でなくなる
  - `#detail-thumbnail` の `src` が設定される

## 参照

- E2E テスト: `tests/smoke.spec.mjs`

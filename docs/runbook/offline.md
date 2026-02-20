<!-- /docs/runbook/offline.md -->

# オフライン環境での進め方

## 結論

- ネットワーク無し + pnpm 未導入でも `make verify` が動く構成にしてある
- E2E（Playwright）は「使える環境でだけ」別ターゲットで回す

## よくある詰まりポイント

### node_modules/.pnpm が残って Playwright が壊れる

過去に pnpm で中途半端にインストールすると、`node_modules/.pnpm` が残り続けて
Node の解決が壊れることがある。

- 対処: `rm -rf node_modules` してから `make verify`（この repo の verify は依存しない）

### ネットワーク無しで Playwright を入れたい

この repo はオフライン優先。
E2E が必要になったら、ネットワークがある環境で以下を用意してから持ち込む。

- `node_modules`（またはパッケージキャッシュ）
- Playwright の browser バイナリ（`ms-playwright` キャッシュ）

その後に `make verify-e2e` を使う。

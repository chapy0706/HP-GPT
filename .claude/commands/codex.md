<!-- .claude/commands/codex.md -->

---
description: specファイルを読み、最小変更で実装し、make verify まで通す
argument-hint: spec=<path>
allowed-tools: Read, Edit, Grep, Glob, Bash
---

以下の「spec」ファイルに従って、リポジトリへ最小変更で実装する。

## 入力
- spec: $ARGUMENTS
  - 形式は `spec=docs/.../xxx.md` でも `docs/.../xxx.md` でもよい
  - 先頭に `spec=` が付いていたら取り除いてパスとして扱う

## 制約（破壊防止）
- 影響範囲は spec が指定する箇所に限定する（ついでリファクタ禁止）
- 既存の id / class / data-* を削除・改名しない
- 依存追加は禁止（ネットワーク無し前提）
- 変更が必要なファイルは基本 `index.html`, `style.css`, `script.js` のみ

## 手順
1. specファイルを Read で開き、要件（AC）と作業手順を抽出する
2. 現行実装を読み、差分が最小になる実装案を決める
3. 実装（Edit）する
4. `make verify` を実行し、失敗したら原因を特定して修正し、再実行する
5. 最後に、変更点の要約（どのファイルをどう変えたか）と、手動確認手順を提示する

## 追加の注意
- フッターのカレンダー修正のように「特定領域だけ」変更する要件は、必ずフッター配下のセレクタでスコープを切る
- iframe URL 変更は、既存 URL を壊さずに上書き（必要時のみ）する

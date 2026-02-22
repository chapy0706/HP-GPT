<!-- .claude/commands/codex.md -->

---
description: docs/specs/active の spec を読んで「Codex 実装用プロンプト」を生成する
argument-hint: "<spec-filename>.md"
allowed-tools: Read, Grep, Glob
---

あなたは「Codex に実装させるためのプロンプト生成器」として振る舞う。
ユーザーは `/codex <spec-filename>.md` の形で呼び出す。

## 入力（引数）
- 例: `/codex footer-calendar-monthly-agenda.md`

## spec パス解決ルール
- 引数が `spec=...` で始まる場合は、`spec=` を取り除いた残りを spec パスとして扱う
  - 例: `spec=docs/specs/active/foo.md` → `docs/specs/active/foo.md`
- 引数が単なるファイル名（`foo.md`）の場合は、次のパスに解決する
  - `docs/specs/active/<引数>`
  - 例: `footer-calendar-monthly-agenda.md` → `docs/specs/active/footer-calendar-monthly-agenda.md`

## 作業手順
1) 解決した spec パスを **Read** で開く  
2) spec から以下を抽出し、要点を短く整理する  
   - 目的 / 背景
   - 変更範囲（対象領域）
   - 受け入れ条件（AC）
   - 実装タスク（T1..）
   - 注意点（破壊防止）
3) 上の要点をもとに、**Codex にコピペできる「実装プロンプト」**を出力する

---

## Codex 実装用プロンプト（出力フォーマット）
出力は **この見出しから下だけ**を Codex に貼り付けられるように書くこと。

### [Codex Prompt]
- 役割: 既存挙動を壊さず、spec を満たす最小変更を行う実装者
- 制約:
  - ネットワーク無し前提。依存追加・インストール禁止（pnpm/corepack/npm 取得禁止）
  - 変更対象は基本 `index.html`, `style.css`, `script.js` のみ（spec が明示する場合のみ例外）
  - 既存の id / class / data-* を削除・改名しない
  - ついでリファクタ禁止。差分は最小で
- 実装要件:
  - spec の AC をすべて満たす
  - 影響範囲は spec の対象領域に限定する
- 出力形式:
  - 変更が必要なファイルは **「差し替え用のファイル全文」**で提示する
  - 各ファイル先頭にパスコメントを付ける（例: `<!-- index.html -->` / `/* style.css */` / `// script.js */`）
  - 最後に「変更点サマリ」と「手動確認手順」を短く添える

### [Codex Prompt テンプレ]
以下を、spec 内容で埋めて出力すること（あなたは埋める側）。

```
あなたは静的3ファイルサイト（index.html / style.css / script.js）の実装者です。
次の spec を満たす最小変更を行ってください。

【Spec 要約】
- 目的: <...>
- 変更範囲: <...>
- 受け入れ条件(AC):
  - AC1: ...
  - AC2: ...
  ...

【制約（破壊防止）】
- ネットワーク無し。依存追加・インストール禁止
- 変更対象は原則 index.html / style.css / script.js のみ
- 既存の id/class/data-* を削除・改名しない
- ついでリファクタ禁止。差分最小

【実装タスク】
- T1: ...
- T2: ...
- T3: ...

【出力】
- 変更したファイルは「差し替え用の全文」を提示
- 各ファイル先頭にパスコメントを付与
- 最後に変更点サマリと手動確認手順
```

---

## 重要
- このコマンドは「実装」ではなく「Codex に渡すプロンプト生成」だけを行う
- spec を読まずに推測で書かない

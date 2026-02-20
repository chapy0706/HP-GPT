<!-- docs/specs/active/footer-calendar-monthly-agenda.md -->

# Footer（PCホバー展開）: カレンダー崩れ修正 + 月次予定リスト化

## 背景
PC版でイントロ完了後、TOP画面下部のフッター（`.footer-info-row`）にマウスを近づけると展開されるエリア（`.footer-info-expand`）のうち、カレンダー表示（Google Calendar 埋め込み）が **サイズ不整合で崩れている**。

現状は `mode=MONTH` の月表示を `320x180` に押し込んでおり、月グリッドが成立せず視認性が悪い。

## ゴール
- PC版（`min-width: 769px`）のフッター展開エリア内にある「カレンダー（小）」を **月単位の予定リスト表示**へ変更する
- 予定が多い月でも **フッターの特定領域を超えず**、中で **スクロール可能**な状態にする
- 既存のイントロ演出 / ページ遷移 / 他セクション（Contact の大きいカレンダー等）に影響を出さない
- 依存追加なし（ネットワーク無し環境でも `make verify` が通ること）

## 非ゴール
- フッター全体のデザイン刷新
- GoogleカレンダーのデータをAPIで取得して独自レンダリング（今回は iframe のまま）
- モバイルフッター（現状 `.footer-info-row` はモバイル非表示）の仕様変更

---

## 現状（確認用）
- 対象HTML: `/index.html`
  - `.footer-info-calendar .calendar-embed iframe` が `mode=MONTH` / `width=320` / `height=180` / `scrolling="no"`
- 対象CSS: `/style.css`
  - `.footer-info-calendar .calendar-embed iframe { width: 320px; height: 180px; }`
- 対象JS: `/script.js`
  - フッター自体の表示制御あり（`const siteFooter = document.querySelector(".site-footer");`）

---

## 仕様（ふるまい）
### S1: 表示内容（PCのみ）
- フッター展開時に表示される「カレンダー（小）」は **今月（当月）に該当する予定だけ**を表示する
- 表示形式は **予定リスト（Agenda / Schedule 相当）**とする（= 月グリッドは使わない）

### S2: レイアウト制約
- カレンダー表示領域は **フッター展開エリアの所定領域からはみ出さない**
- 予定が多い場合でも **崩れず**、領域内で **縦スクロール可能**であること
- 予定のタイトルが長い場合でも、行が暴れて高さが膨らまないように「折返し抑制 / 省略」を優先する（可能なら）

### S3: 変更範囲（最小）
- 変更対象は **フッター内の「カレンダー（小）」**に限定する
- Contact セクション等の `.calendar-embed`（大）には影響させない（必要ならフッター専用セレクタで調整）

---

## 実装方針（推奨）
### A案（推奨）: Google Calendar 埋め込みを “当月Agenda” に動的変換
- iframe は維持しつつ、PC展開時に `src` を **Agenda表示 + 当月の dates 範囲**へ更新する
- 例（概念）:
  - `mode=AGENDA`
  - `dates=YYYYMM01/YYYYMMDD`（月末日まで）
  - `showTitle=0&showNav=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0`
  - `ctz=Asia/Tokyo`
- スクロールを有効にするため、iframe の `scrolling` は `auto/yes` にする（`no` はやめる）

#### dates の決め方
- JSで `new Date()` を基準に当月の開始日と終了日を算出
- `YYYYMMDD` 形式に整形して `dates=start/end` を組み立てる

#### 更新タイミング（崩さないために）
- `.footer-info-row` の `mouseenter` / `focusin` で **必要なときだけ更新**
  - 「月が変わった」か「初回」だけ更新する（毎回書き換えると無駄にチラつく可能性あり）

### B案（フォールバック）: MONTHのまま高さを適正化（最後の手段）
- `mode=MONTH` を維持し、iframe 高さを 180 → 260〜320 へ
- ただしフッターの展開領域も増えるため、見た目とUXに影響が出やすい

---

## 具体タスク
### T1: index.html（フッターのカレンダーiframeを識別できるようにする）
- フッターの「カレンダー（小）」iframe に `id` を付与する
  - 例: `id="footer-calendar-iframe"`
- 既存 `src` は “ベースURL” として残して良いが、JSで上書きする前提でOK
- `scrolling="no"` はやめる（`scrolling="yes"` もしくは属性削除）

### T2: script.js（当月AgendaのURLを組み立てて、展開時にセット）
- 以下のような小さな関数で責務分離（変更容易性のため）
  - `formatYyyymmdd(date)`
  - `getMonthDateRange(date) => { start: "YYYYMMDD", end: "YYYYMMDD" }`
  - `buildGoogleCalendarEmbedUrl({ calendarSrc, ctz, mode, datesRange, uiFlags })`
  - `updateFooterCalendarIFrameIfNeeded()`
- `mouseenter` / `focusin` で呼び出す（PCのみ）
  - `matchMedia("(min-width: 769px)")` と `matchMedia("(hover: hover)")` を併用して誤作動を抑える
- `calendarSrc`（src=〜の ID 部分）は HTML 側の既存 `iframe.src` から抽出してもよいし、data属性で保持してもよい

### T3: style.css（フッター内カレンダー領域を “固定サイズ + 内部スクロール” に）
- フッターのカレンダー領域だけ、以下を満たすよう調整（影響範囲をフッターに限定）
  - `.footer-info-calendar .calendar-embed { width: 320px; height: 180px; }`（現状維持でOK）
  - `.footer-info-calendar .calendar-embed iframe { width: 100%; height: 100%; }`
- iframe内スクロールを想定するため、`overflow` は wrapper ではなく iframe側を優先（`scrolling` とサイズで制御）
- もし “はみ出し” が出る場合は `.footer-info-calendar` を `align-items: start;` に固定してズレを抑える

---

## 受け入れ条件（AC）
- AC1: PC（幅 769px 以上）でフッターにホバーすると展開され、カレンダー枠内に **当月の予定リスト**が表示される
- AC2: 予定が多い月でも、カレンダー表示は **枠外にはみ出さず**、枠内で **スクロールできる**
- AC3: Contact セクションなど、他のカレンダー表示の見た目が変わらない
- AC4: イントロ〜TOP表示〜モーダル動作など既存挙動を壊さない
- AC5: 依存追加なしで `make verify` が通る

---

## 手動確認手順
1. `index.html` をブラウザで開く
2. イントロ完了後、TOPまでスクロールしフッター表示
3. フッター下段（住所・TELが見える行）へマウスを近づける
4. 展開エリアの「カレンダー（小）」が “月次予定リスト” になっていることを確認
5. 予定が多い場合、枠内でスクロールできることを確認

---

## Claude Code 用プロンプト（コピペ用）
目的: PCフッターのホバー展開エリア内の「カレンダー（小）」が `mode=MONTH` を 320x180 に押し込んで崩れている。これを “当月の予定リスト（Agenda）表示” に変え、枠内スクロールで崩れないようにしてほしい。依存追加は禁止（ネットワーク無しで `make verify` を通す運用）。変更範囲はフッターのカレンダー（小）だけ。Contactの大きいカレンダーなど他の `.calendar-embed` には影響させない。

作業:
1) `/index.html` のフッターカレンダーiframeに `id="footer-calendar-iframe"` を付与し、`scrolling="no"` をやめる
2) `/script.js` に当月の日付範囲 `YYYYMMDD/YYYYMMDD` を生成し、フッター展開（mouseenter/focusin, PCのみ）で iframe.src を `mode=AGENDA&dates=...` へ更新する処理を追加（毎回でなく月単位で更新）
3) `/style.css` でフッターカレンダーiframeが `width/height` にフィットし、枠外にはみ出さず、内部でスクロールできるように調整（影響範囲は `.footer-info-calendar` 配下のみに限定）
4) `make verify` が通ること

注意:
- 既存のIDやクラス名を消さない（ガードレールで検知される）
- イントロ・モーダル・遷移を壊さない
- なるべく差分を小さく、読みやすい関数分割で

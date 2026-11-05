# HANDOFF：給下一個接手的 Agent

> 最後更新：2026-11-04（台北時間）。用繁體中文（台灣）跟使用者溝通。

## 0. 使用者是誰、要什麼

- 準備**台大資工所**考試（考科：資結＋演算法、計組＋OS、線代＋離散），考試日預設 2027-02-06。
- 使用者自稱：**知識底子幾乎沒有、超懶的小學生**。所有內容與介面都照這個設計：
  - 先講結論、句子短、每個新名詞用白話解釋、一定給很小的數字例子。
  - **阻力降到最低**：打開就按「開始」，一次只給一件事。
  - **版面要整潔、要好看、要有大量圖示**。
  - 不要把教學以外的雜訊放在畫面上。
- 使用者下過「持續優化」的目標：做完一輪就自己找下一個改進點繼續做，不用每次問。
- **不要擅自改排程任務**：使用者擋下過一次 `update_trigger`（要讓早上排程讀線上版進度那次）。要改排程先問。

## 1. 專案在哪

| 地方 | 路徑 | 說明 |
|---|---|---|
| 雲端工作副本（主要開發） | `/home/claude/cs-grad` | 在這裡改、`python3 build.py`、跑測試 |
| 使用者電腦（主要） | `C:\Users\20050\OneDrive\桌面\資工所衝刺` | **start.bat 在這裡跑**；`bridge\` 有真實進度 |
| 使用者電腦（備份） | `C:\Users\20050\Desktop\資工所衝刺` | 每次也同步一份；它的 bridge 沒在用 |
| 線上版（claude.ai artifact） | **新 slug `c4ede9c4-c96f-416b-b718-8b9d4087d803`**（2026-11-04 重新發布，舊 slug `f3d95ad1…` 在這個帳號已找不到），網址 https://claude.ai/artifact/RKRfJJRkWhxxm2caerjdii | 發布 `dist/single.html` 成 `index.html`；已宣告 capabilities `{db:{}, user:{}, sample:{}}`；目前版本見 `get_artifact`（2026-11-05 為 `1793810848-caf3`）。舊線上版的雲端進度不會自動搬過來 |
| 測試腳本 | 專案內 `tests/*.js`（舊的 `/home/claude/tools` 已消失） | Playwright（`require('playwright')` 直接可用）；雲端副本每個 session 會消失，要從使用者電腦 stage 回來 |

使用者電腦的 device_bash 不能用（Windows 沒開虛擬化）；只能用 `device_stage_files` / `device_commit_files`。
`device_commit_files` 的 stagedPath 必須在 `/mnt/user-data/outputs/` 底下，一次最多 50 個檔，用 `force: true`。

## 2. 架構（靜態 SPA，沒有框架）

- `build.py`：把 `content/` 編譯成 `web/js/data.js`，再產生：
  - `web/selftest.html`：自我檢查頁
  - `dist/single.html`：單檔版，所有 JS／CSS 內嵌，給線上版用
  - `web/manifest.webmanifest`、`web/sw.js`：PWA，版本號是檔案內容的 hash
- `content/` 的內容來源：
  - `lessons/*.md`：教材本文，用「=== 章節id」分章、「## 」分段
  - `intuition/*.md`：直覺版，小學生程度
  - `examples/*.md`：每章「跟著做一題」，`【題目】【步驟】【答案】【常錯】`
  - `figs/*.md`：**每段配圖**，`=== 章節id 段號` 加上 ```fig 區塊；插在第 N 個「## 」標題下
  - `qfigs/*.md`：**題目解析配圖**，`=== 題號`（如 `ds-n17`）加上 ```fig 區塊；接在該題解析最前面
  - `quiz/*.txt`：565 題（含 `warmup.txt` 的 84 題 ★ 熱身題，每章 2 題，id `<科>-wNN`）
  - `card_reasons.md`、`answers/*.md`：必背卡背面
- 前端 `web/js/`：
  - `core.js`：S 狀態存 localStorage、`md()`（Markdown＋KaTeX＋```fig）、QBANK、FSRS 等
  - `fig.js`：SVG 圖解引擎。11 種：tree、array、graph、bits、lanes、timeline、bars、venn、plane、matrix、flow；`---` 並排；`cap:` 圖說
  - `views.js`：各頁面
    - 教材頁：`chunkLesson` 分段、`kidButtons`（🧒 白話）、`workedHtml`（跟著做）、費曼
  - `autopilot.js`：「帶我讀」每日步驟；`Auto.preview(date)` 預排明天
  - `bridge.js`：四種模式
    - http：`server.py`
    - fs：Chrome 直接授權資料夾
    - offline
    - **cloud**：claude.ai 線上版
  - `sync.js`：多裝置合併
    - `Sync.merge` 冪等
    - `pullForeign` 發現別台裝置的新版就合併
    - `fp()` 指紋避免兩台互相覆寫
  - `cloud.js`：線上版專用
    - `Cloud`：db 分塊存進度到 `data/users/<uid>/`
      - `meta`：版本、裝置、各欄位 hash
      - `k_<欄位>_<i>`：每塊 ≤ 6 萬字元
      - `progress`：給 Claude 讀的進度摘要
    - `CloudAgent`：用 `sample` 在網頁裡直接批改費曼、回答、出題、督導、💬 聊天過關、💬 聊天回想、🧒 白話講這段
  - `app.js`、`qr.js`：PWA 安裝、手機區網連線（QR code 是自己寫的編碼器，已用 OpenCV 驗證能解碼）
  - `personal.js`：FSRS 個人化（≥300 筆後擬合）、考前 14 天衝刺、錯因補救
  - 其他：`learn.js`、`practice.js`、`rewards.js`、`rescue.js`、`clips.js`、`labs*.js`、`gen.js`、`nudge.js`、`views-learn.js`
- `server.py`（只用標準函式庫）：
  - 提供 `web/`
  - `/api/inbox`、`/api/outbox`、`/api/progress`、`/api/state`、`/api/statemeta`
  - `/api/lan`：手機連線；區網要 X-Key 金鑰，金鑰存在 `bridge/lan.json`
  - 每日備份到 `bridge/backups/`
- `agent.py`：給 Agent 讀寫 bridge 的指令（watch／pending／lesson／reply／grade／supervise／plan／quiz／bonus／report）。
  - `supervise`、`plan`、`quiz` 都支援 `--reply-to`
- `AGENTS.md`：Agent 的工作規則。第 7 節是雲端排程的流程。

## 3. 改完之後的固定流程

1. `cd /home/claude/cs-grad && python3 build.py`：要看到「段落配圖：197 張」「題目配圖：50 張」「跟著做：42/42 章」。
2. 回歸測試：**新版測試在專案的 `tests/`（見 `tests/README.md`，會跟著同步到使用者電腦，不會隨 session 消失）**，包含 LaTeX 錯誤、沒套 LaTeX 的數學、手機 390px 超出畫面、過關小測分配、關卡／星等／推薦／自動下一關／每日寶箱。下面是舊的（`/home/claude/tools` 已不存在，僅供參考）：
   ```bash
   for t in t_self t_flow t_nb t_learn t_keys t_clean t_rw t_lazy t_personal t_sync t_wk t_wk2 t_cloud t_chunk t_qfigs; do timeout 200 node $t.js | tail -2; done
   ```
   - `t_self` 跑自我檢查頁，要 `BAD 0`。
   - `t_cloud` 用假的 `window.claude` 模擬線上版：兩台裝置共用資料庫，加上 Claude 批改與聊天。
   - `t_wk` 的兩個 ERR_FAILED 是擋外部字型，正常。
   - `t_sync_http.js` 需要先在 `/tmp/srv` 用 port 8799 啟動 `server.py`；`t_app.js` 會自己開 8797。
   - 看圖：`node t_figsheet.js <科目>` 再 `python3 /tmp/sheet.py <科目>`（`sheet.py` 會被清掉，要重寫：把 `/tmp/figs/<科目>-*.png` 兩欄拼起來）。題目配圖：`node t_qfigs.js` 會把每題題幹＋解析截到 `/tmp/figs/q-*.png`。
3. **同步到使用者電腦兩個資料夾**：把改過的檔案複製到 `/mnt/user-data/outputs/syncN/` 再 `device_commit_files`。
4. **發布線上版**：`publish_files`，slug 如上，`base_version` 用上次結果的 `version`，`files=[{as:"index.html", path:"/home/claude/cs-grad/dist/single.html"}]`。
5. 用一兩句中文告訴使用者做了什麼。

## 4. 目前狀態

- 線上版最新：`1793770889-a302`（2026-11-04 13:41）。這次加了 50 張題目解析配圖（各科簡單題，`content/qfigs/all.md`）。再之前加了：科目總覽每章五個進度小圖示（🎬💡✏️📖🧠，做完才亮）、作答回饋改版（✅／❌、正解與你選的分開、📝 為什麼）、左側選單圖示、帶我讀的「接下來」小圖示列、必背卡正面加卡種圖示並置中、對錯卡回饋改成「答對了：這句是『對』的」。更早的版本包含：
  - 教材分段、197 張段落配圖、重點框圖示
  - 教材頁改版：本章路線（短片→直覺→跟著做→分段讀→費曼，做完打勾、現在該做的亮藍）、標題圖示、直覺版小標獨立成行、短片移到最上面
  - 設計筆記在 `content/DESIGN.md`
- **還沒同步到使用者電腦**（使用者電腦目前斷線）：要同步的檔已經放在 `/mnt/user-data/outputs/sync11/`（照專案的相對路徑），連回來後直接對兩個資料夾各 `device_commit_files` 一次（共 40 個）。最後同步前記得再複製一次最新的 `HANDOFF.md`、`dist/single.html`。清單：
  - `web/js/views.js`、`web/js/core.js`、`web/js/selftest.js`、`web/js/data.js`
  - `web/style.css`、`web/selftest.html`、`web/sw.js`、`content/DESIGN.md`
  - `web/js/practice.js`、`web/js/autopilot.js`、`web/js/views-learn.js`、`build.py`、`content/figs/*.md`（6 個新檔）、`content/qfigs/all.md`（新檔）、`dist/single.html`、`HANDOFF.md`
- 八個優化方向：
  1. 題庫擴充：完成（565 題；2026-11-04 加了每章 2 題 ★ 熱身題，讓「小怪關」每章至少 5 題）。
  2. 對齊台大考古題：**等使用者**。
     - exam.lib.ntu.edu.tw 的 robots 不允許抓取，不要繞過。
     - 使用者要自己把 PDF 放進 `資工所衝刺\考古題\`。
     - 放好後：stage PDF → 每題標年份、題號、章節、配分（**只存 metadata，不抄題目**）→ 算章節頻率 → 調整帶我讀的順序與模考格式。
     - **流程已經做好（2026-11-04）**：
       1. stage PDF 到容器，`python3 exam_tag.py <pdf...> --out /tmp/draft.md`：自動抓年份、科目（dsal／coos／math）、依題號切題（題號要連續遞增，小題 (1)(2) 不會被當大題）、抓配分、用章名＋小節標題＋先記住的關鍵字建議章節（只在同一科的兩門裡找）。終端機只顯示每題前 24 字給人核對，**檔案裡只有 metadata**。
       2. 人工核對草稿（信心分數低的要特別看；跨兩章用逗號），貼進 `content/exams/meta.md`（格式：`年份 科目 題號 章節id[,章節id] 配分`）。
       3. `python3 build.py` 會印「考古題：N 題，Y 年，涵蓋 K 章」，並產生 `DATA.exams`、`DATA.examFreq`（各章配分占比，越近的年份權重越大：每早一年 ×0.85）。
       4. 網站自動用上：推薦（同星等時考頻高的先）、模考（依考頻加權抽題）、教材頁工具列與科目頁顯示「🏛️ 考頻 X%」。
       - 已用自製的假 PDF（不是真題）測過整條：6 題全標對；測完 meta.md 已還原成空的。
       - 還沒做：依真實題數／配分改模考格式（要先看真題長什麼樣）；「帶我讀」的每日計畫依考頻重排。
  3. 備份與多裝置合併：完成。
  4. PWA＋手機區網＋每日推播：完成。
  5. 學習引擎個人化：完成。
  6. 每章跟著做＋離線 KaTeX：完成。
  7. 雲端 Agent 督導（排程）：完成，見第 5 節。
  8. test.bat：完成。
- 之後追加：雲端存進度＋網頁內 Claude、🧒 白話講這段、💬 聊天過關／回想、教材分段、每段配圖、重點框圖示、讀前回想可收合。
- 線上版的雲端資料庫：最後一次檢查是空的（`db_usage` documents 0），代表使用者還沒用新版打開過。
  - 使用者的 db id：`u_Au9gW0ZgfPDGetUo1Szk4Q`。
  - 進度摘要在 `data/users/u_Au9gW0ZgfPDGetUo1Szk4Q/progress` 的 `json` 欄位；可以用 `db_get` 讀來做督導。

## 5. 排程任務（不要擅自修改）

| id | 名稱 | 時間（台北） | 說明 |
|---|---|---|---|
| `trig_012pne88bAKgFRSZ7wq6GveC` | 早上批改＋督導＋推播今天第一步 | 每天 07:37 | 綁使用者電腦、push 通知、自動核准 |
| `trig_016Wtzp1g6AD6bx4b2H1HUHB` | 晚上批改＋沒做完就提醒 | 每天 21:17 | 同上 |
| `trig_0127Nc6vvG1DTEy5ThxLFnt9` | 資工所每日督導（早上）**舊的** | 07:41 | 讀錯資料夾（Desktop），沒綁電腦；我關它被系統擋下，已請使用者自己關 |

兩個新排程只處理電腦版的 bridge。線上版的訊息是網頁裡的 Claude 自己即時處理，不需要排程。

## 6. 已知限制與注意事項

- 手機用區網連線：要同一個 Wi-Fi、電腦開著；用 http，不是安全來源，所以手機上不能離線也不能真正安裝。
  - 出門建議用線上版（登入同一個 Claude 帳號就同步）。
- 線上版的 `sample`：每次呼叫都用使用者的 Claude 額度；第一次會跳出允許視窗。
  - 自動呼叫只有每天第一次打開時的督導（`CloudAgent.daily`），而且要使用者允許過才會做。
- 線上版跟電腦版的進度**不會自動互通**：使用者要用「設定 → 下載備份檔／合併另一台的進度檔」手動合併。
- `fig` 語法地雷：
  - bars、graph、plane、array、tree 第一行要寫種類名稱；flow、matrix、bits、timeline、venn 可以直接用 `kind:` 開頭。
  - 標記 `*`（藍）、`!`（紅）、`+`（綠）只能放在**字尾**。timeline 的標記要放在名稱上，不能放在數字上（否則 NaN）。
  - tree 的節點名稱不能只有 `+` 或 `*`：運算子要寫成 `[＋]`、`[×]`。
  - 同兩點的雙向邊會疊在一起。
- 安全檢查會擋含 heredoc 的某些 bash 指令：改用 Write 寫一個 .py 再執行。

## 6.5 學習效率方向（使用者 2026-11-04 14:15 提出）

- 使用者說：**電腦打字與填空很難觸發大腦神經迴路；考試是手寫；總之要讓學習效率最高。**
- 已做：`practice.js` 的 ✍️ **紙筆模式**（預設開，`localStorage.paperMode`）。題目只給題幹，頁面內有手寫板（pointer events、筆／橡皮擦／全清），按「寫好了，對答案」才翻標準答案與解法，再三選一誠實自評（全對／過程有洞／錯），餵進 `S.answer`。卡片右上可切回「⌨️ 改回點選」。
- 也已做：
  - **整頁默寫**（練習頁「✍️ 整頁默寫」）：給章名＋`recall` 回想題，手寫板寫完後對照 `rubric` 逐條打勾，並可展開該章必背卡；結果存 `localStorage.dictate`（章→{date,hit,total,miss}）。
  - **語音費曼**：費曼關卡的 🎤（Web Speech `zh-TW`，Chrome 才有）。
  - **跟著做**改成「先在紙上做這一步，寫好再翻」。
- 默寫有漏的章（hit<total 且不是今天）會在練習頁最上面出現「🔁 今天重默」。`gen` 隨機計算題走同一個 renderCard，所以也是紙筆模式；模考仍是點選／打字。
- 待做：手動跑演算法的專用互動；默寫結果進儀表板。
- 使用者說**題庫（台大考古題 PDF）做完這輪再給**；來了就做第 4 節方向二。
- 雲端工作副本 `/home/claude/cs-grad` 每個 session 會消失；這次是從使用者電腦資料夾重新 stage 回來的（build 需要 web/icons）。

## 6.6 2026-11-04 晚：排版與 LaTeX（使用者嫌「排版超醜」「至少套 LaTeX」）

- **數學式改用 KaTeX 自己的 HTML＋字型**（`core.js` 的 `output: 'htmlAndMathml'`；`web/vendor/katex.min.css`＋`web/vendor/fonts/*.woff2`，只留 woff2）。以前是 MathML，字型看使用者電腦而定，不像 LaTeX。單檔版 `dist/single.html` 把字型轉 base64 內嵌（約 2 MB）；`sw.js` 的快取清單也加了 css 與字型。
- **詳解排版**：`core.js` 的 `fmtExpl()`：長段落拆成一行一個重點；`B：`、`F 反例：` 這種選項標號加粗獨立成行；`$…$` 不會被切開。`practice.js` 所有 `q.expl` 都包了 `fmtExpl`。
- **自評按鈕**：三顆整齊的大按鈕（綠／黃／紅框）。
- **練習頁**：章節改成「科目分頁＋一章一列（做題｜✍️ 默寫）」，不再是兩份 42 章長清單。
- 新樣式一律用 `--surface-2`、`--line` 等變數，不寫死顏色（深色模式要看得到）。

## 6.7 2026-11-04 傍晚：使用者的新要求

- **「介面不要出現使用者早就知道的說明字」**（截圖：連線卡同一件事講三遍；「很多地方也是」）。已砍：Agent 頁雲端說明、設定頁雲端手機說明、練習頁「做題 或 ✍️ 整頁默寫」、紙筆模式提示與紅筆對照三行、「讀前先想想（5 題，想不出來沒關係）」、🎤 與「跟著做」的提示句。**之後新增任何 UI 都不要加解釋性文字；按鈕與標題自己說得清楚就好。** 還沒砍乾淨的地方（動畫實驗室每張卡的長描述、學習法頁）之後繼續。
- **「教材看不下去、眼睛酸」**：教材頁工具列加了「👀 只看重點／📖 看完整」（預設只看重點：每段留第一段、粗體句、框框、圖、表，收起其餘推導）和 A−／A+ 字級；存 `localStorage.lessonSkim`、`lessonFs`。
- **「要有逐漸打怪的感覺，不能上來直接開大」**：練習改**關卡制**。`practice.js` 的 `start()` 預設把題目依難度排序（★小怪 🐣 → ★★菁英 ⚔️ → ★★★魔王 👹），每關前有關卡畫面（`renderStage`），眉標顯示目前關卡；複習／前測／模考／範例題不套用。自適應練習 `Learn.pick` 開頭 4 題壓向 ★、8 題內不出 ★★★。每章都有至少 3／3／2 題（★／★★／★★★）。
- 待做：教材每段開頭加「一句話先記住」（要逐段從教材原文寫，不可憑空編）；教材字句再白話化；關卡過關要有進度與獎勵（通關動畫、XP）。

## 6.8 2026-11-04 傍晚（二）：遊戲化＋推薦（使用者：「make it gamify」「我不想自己挑關卡，要推薦上來」「能多懶就多懶」「不要問，自己 autopilot」）

- **每段「先記住」**：`content/leads/*.md`（`=== 章節id 段號` ＋ 一兩句白話），`build.py` 在段落配圖之後插到第 N 個 `## ` 正下方，變成 `> [!先記住]` 框（`core.js` 的 callout 新種類 `gist`，👉）。**197/197 段都有**，每句都對照過原文（la-systems 4 曾寫錯「四個子空間兩兩垂直」，已改成兩對）。之後改教材本文時要同步檢查這句。
- **關卡血條＋連擊＋星等**（`practice.js`）：`headHtml()` 在關卡模式顯示怪物血條（該關答對幾題扣幾格）、🔥連擊；`hit()` 每次作答後更新；連擊 ≥3 跳 `Rewards.float`。**星等**存 `localStorage.chStars`（章→0..3），某關答對 ≥60% 拿那顆星（🐣=1、⚔️=2、👹=3）；顯示在練習頁章節列、科目頁、推薦卡、結算頁。**注意：星等目前只存在這台瀏覽器，沒進 S.st，不會跨裝置同步**。
- **🎯 推薦 feed**：練習頁最上面只有一張推薦卡＋「▶ 開打」＋「換一個」，其餘選項收進「自己挑」。`Practice.recs()` 順序：到期複習 ≥3 題 → 默寫有漏 → 已讀／已排進計畫的章裡星最少的下一關（只出那一關的題）→ 下一個沒讀的章 → 必背卡。結算頁的主按鈕是「▶ 下一關」（`goNext()`）。
- 星等與整頁默寫紀錄已搬進 `S.st.stars`、`S.st.dict`（會進雲端、會被 `Sync.merge` 合併：星取大、默寫取日期新的）；舊的 `localStorage.chStars`／`dictate` 第一次讀取時自動搬過去（`Practice.store()`）。
- 從推薦卡進來的關卡（`opts.direct`）不再顯示第一張關卡卡，直接出題；結算頁「▶ 下一關」倒數 5 秒自動開下一個推薦，碰畫面就取消。
- 「帶我讀」的練習步驟（`autopilot.js` 的 `quiz:`）改成從該章還沒拿到的那顆星開始打，帶 `ch` 才會記星；「今天完成」畫面多一顆「▶ 再打一關」（`Practice.goNext()`）。
- 必背卡頁也改成「一張大卡＋▶ 開始」，其他收進「自己挑」；卡片作答有 🔥 連擊（`views-learn.js` 的 `cardRate`）。選單的「練習」改名「⚔️ 闖關」。
- **教材每段結尾的「⚔️ 過關小測」**（`views.js` 的 `secQuizPlan`／`secQuiz`，由 `chunkLesson` 插在「下一段」上方）：優先考這段自己的對錯卡（用卡片正面前 14 字比對段落原文）→ 這段的回想卡（字詞重疊 ≥0.5 且贏第二名 0.1 才分配）→ 這段的 ★ 單選題（題幹＋選項同樣用字詞重疊分配）→ 前面讀過段落的題（隔段回想）→ 最後一段才用分配不到段落的題。**不考還沒讀到的段落**（`secQuizPlan` 的 at > i 必須為 0）。目前 141/197 段有小測（對錯 41、回想 81、單選 19）。對錯卡與回想卡作答會寫進 `Learn.review`（複習排程），單選寫進 `S.answer`。
- **每日 3 星寶箱**：新拿到的星會記在 `S.day().stars`（`Sync.merge` 取大）；當天第 3 顆（`Practice.DAILY_STARS`）自動開金寶箱（`Rewards.dropOpen('gold')`）。推薦卡上方顯示「今天 ⭐ n/3 → 🎁」。
- **2026-11-05 凌晨（使用者開始實際使用線上版後的回饋）**：
  - 使用者用的是**線上版**（在他自己的 Chrome，已登入 Claude；Claude 桌面 app 內建瀏覽器沒登入 claude.ai，打不開）。首次設定用預設值（每天 6 小時、09:00、11-04 起算）。
  - 浮動「下一步」（`#goPill`）：捲動時 `.dim` 變淡、停 0.7 秒恢復；有它時 `main` 底部留 96px；教材頁捲過短片區塊（IntersectionObserver，`watchClipPast`）就自動把 `clip:` 步驟算過、按鈕換下一步。
  - 矮視窗（高 ≤ 720px、寬 > 820px）：教材頁標題縮成一行、工具列變小（使用者視窗約 1164×544）。
  - 模考頂端加 👹 大魔王血條（已作答題數）；手機上模考固定列 `top: 53px`，不再被選單列蓋住。
  - 結算畫面：一排紅綠圓點＋「看每一題」收合。科目頁：科目介紹收進「關於這科」。
  - 右上角「成品預設為私人…」是 claude.ai 的提示框，不是網站的，改不到。
  - **使用者在讀的時候不要頻繁發布線上版**：每次發布，開著的頁面會在閒置時換版。
- **星等成就**（`rewards.js` 的 `ACH`）：第一顆星、十顆星、星海（30）、打倒魔王（一章 3 星）、一科稱王（一整科每章 3 星）；`checkAch` 用 `S.st.stars` 算。
- **答錯 → 回教材那一段**：`views.js` 的 `lessonSpot(q)` 用字詞重疊（寬鬆門檻 0.3／差距 0.03）把題目對到章內第幾段；錯因區塊上方出現「📖 回教材：第 N 段「…」」，點了 `goSpot()` 設 `window.__openSec`，`chunkLesson` 只展開那一段並閃一下。目前 310/481 題對得到段落，其餘給「回這一章」。過關小測用同一套函式（`secGrams`／`secIndex`／`secPlace`），但用嚴格門檻。
- **兩種結算**：從「帶我讀」啟動的練習（`nextStep()` 設 `window.__fromAuto`，`Practice.start` 3 秒內收到就標 `opts.auto`），結算主按鈕是 `NextAuto`「下一步：…」（4 秒自動接計畫），旁邊附「▶ 下一關」；從闖關頁進來的是「▶ 下一關」5 秒倒數。
- **鍵盤懶人操作**（`practice.js` 最下面的 keydown）：闖關頁 Enter＝▶ 開打／▶ 下一關；關卡卡 Enter＝開打；紙筆模式 Enter＝寫好了、1／2／3＝全對／有洞／錯、Enter＝下一題。只按 Enter 和 1 就能連打。
- 練習頁的 `.ch-row` 樣式限定在 `#chList` 底下（科目頁也用 `.ch-row`，曾被弄壞過）。
- 測試腳本已存進專案 `tests/`。

## 6.9 2026-11-05 凌晨：影片＋互動為主、嚴謹排版（雲端工作階段，GitHub 分支 `claude/video-remake-buildheap`）

- **兩條影片線同時在做，不要互相覆蓋**：
  - **動畫講解**（另一個工作階段，在使用者電腦資料夾做的）：`web/js/explain.js`、`explain-ds.js`，Manim 影片＋旁白放 `web/videos/<id>.mp4/.jpg`，清單在 `DATA.videos`（現在從 `content/videos.json` 讀）。教材頁的「影片講解」區塊、選單的「🎞 影片」頁。
  - **新版短影音**（這個工作階段，`影片/工程/`，3D＋記憶宮殿）：成片在 `影片/新版短影音/`，`影片/工程/_lib/webenc.sh` 壓成 540p 放 `web/media/<clip id>.mp4/.jpg`，build.py 產生 `DATA.shorts`；`Clips.player` 有 mp4 就播 mp4，沒有才用即時畫面。
- 2026-11-05 00:40 線上版（`1793814387-de69`）比 GitHub 新；合併後發布為 version 31（`1793839459-a365`）（多了動畫講解）。已把線上版拆回原始檔、跟這邊三方合併（base = 初始匯入 `8ad64ce`），合併後的單檔版包含兩邊全部功能再發布。**之後不論哪邊要發布，先讀線上版、跟 GitHub 分支比對，不要直接蓋掉。**
- 線上版的影片都是「已發布的檔案」：`videos/*`（動畫講解）、`media/*`（短影音），發布時用 `files` 一起帶；沒帶的檔案會保留。
- 教材頁順序：影片講解 → 短片 → 互動實驗（該章的實驗室直接放在影片下，捲到才載入、自動播放，輸入表單收進「換數字」）→ 核心概念 → 例題 → 教材 → 費曼。路線是 1–5 編號，不用 emoji。
- 使用者說「『一句話』這東西太傻」「排版要嚴謹」：直覺卡改名「核心概念」，標籤改「要點／類比／估算／注意」兩欄；區塊標題拿掉 emoji（影片講解、短片、互動實驗、例題演練、費曼檢核、提問）；提示框只留文字標籤，「先記住」改「要點」；「🧒 白話講這段」改「換個說法」。**之後新增介面沿用這個風格：正式名稱、少 emoji、少說明字。**
- 新測試：`tests/lesson_video_play.js`。

## 6.10 2026-11-05 凌晨（二）：設計規範、金幣、提示、狀態、宮殿

- **全站設計規範在 `content/DESIGN.md`**（使用者要求：每個顏色與圖示都要有道理、考慮工作記憶與視覺檢索）。重點：選單 5 區（今天／課程／練習／宮殿／紀錄＋設定）、介面不用 emoji（`Noto Emoji` 單色字型兜底）、藍＝主要動作、綠＝完成、紅＝錯、琥珀 `--star`＝星與金幣、科目色只標科目；線條圖示 `ICON()`、金幣 `COIN`（core.js）。
- **金幣（使用者：要像拉霸一樣爽、要保底、要有論文依據）**：1 XP = 1 金幣（舊資料 `coinV2` 一次 ×10）。每次賺到從點擊處噴金幣進計數器、數字滾輪、一枚一聲；隨機倍率 ×2／×5／×10，越久沒中機率越高、剛中過變低，第 30 次保底 ×5，接近保底時金幣微亮。依據寫在 `rewards.js` 註解（Schultz 1997、Fiorillo 2003、Kivetz 2006、Deci 1999、Clark 2009）。不做假的「差一點」。
- **提示階梯**（使用者：要能 lock in 思考、沒底子也能逐步揭開、熟的人不被擋）：每題下方「提示 0/3」→ 觀念（該段要點）→ 30 秒短片 → 解法第一步；H 鍵；卡住 25 秒提示鈕輕亮。`practice.js` 的 `hints()`。
- **狀態**（`web/js/state.js`、`#state`）：每小時活躍分鐘 `S.st.act`、今天頁一題一題問睡眠／飲食／身體／心情 `S.st.daily`；規則找晝夜顛倒、開始變晚、亂吃、生病、心情低（連續很低時提醒安心專線 1925）、最專注時段；線上版「請 Claude 看看」。
- **宮殿**（`web/js/palace3d.js`、`#palace`，three.js r128 在 `web/vendor/`）：六館地塊＋廣場；用金幣蓋 7 種方塊（新手送 40 塊），拆退一半；讀完一章／拿到星得到該章紀念碑，逛模式點紀念碑回到那章。`S.st.palace` 合併取較新。
- **畫餅**：帶我讀主按鈕下一行「照這速度 MM/DD 讀完 42 章，比考試早 N 天」（`goPie()`）。
- **影片工程可本機渲染**：`影片/工程/README.md`；工具包在 `影片/工程/_toolkit/`（字型 `fonts.py --fetch`）；`_lib/*.sh` 用相對路徑，`AUTO_GIT=1` 才自動 commit + push。雲端這邊重啟背景迴圈：`cd 影片/工程 && AUTO_GIT=1 nohup bash _lib/runall.sh > _lib/runall.log 2>&1 &`、`AUTO_GIT=1 nohup bash _lib/spliceall.sh >> _lib/spliceall.log 2>&1 &`。
- **發布線上版前**：先 `Artifact list scope=files` 看線上版號與檔案；`DATA.shorts` 有幾支，`media/` 就要帶齊幾支（漏帶會變成壞掉的播放器）。目前 version 35（`1793865093-42b2`），31 支短影音（01–31）、42 章都有互動實驗。31–43 渲染完、01–20 重渲完後要再發布一次（重渲的 media 會變）。

## 6.11 2026-11-05 早上：43 支影片全部設計完成
- 28–43 已寫完（B 樹、死結、Union-Find、BFS/DFS、分頁、Karatsuba、暫存器換名、DP、平面圖、Huffman、SVD、RAID 5、最大流、MESI、歸約、雇用問題），全部 3D、接記憶宮殿房號，排在 `_lib/queue.txt`。
- 章節標（`cs.js` 的 CHAP）從 y 300 移到 y 150，原本會壓到上方計數；01–20 已交付的版本由 `_lib/redo.sh` 在佇列空檔重渲（做完留 `out/.redo_tag150`）。
- `_toolkit/.../_pw.mjs` 頁面就緒等待 30 → 120 秒（同時預覽時常逾時）。
- **工作階段重啟後三個迴圈都會停**，要重開：
  `cd 影片/工程 && AUTO_GIT=1 nohup bash _lib/runall.sh >> _lib/runall.log 2>&1 &`
  `AUTO_GIT=1 nohup bash _lib/spliceall.sh >> _lib/spliceall.log 2>&1 &`
  `AUTO_GIT=1 REDO_TAG=tag150 nohup bash _lib/redo.sh 01 02 … 20 >> _lib/redo.log 2>&1 &`
- **互動實驗補齊**：`web/js/labs-more.js` 新增 20 個實驗（B 樹、攤銷、Huffman、Karatsuba、遞迴樹、雇用、頂點覆蓋、Amdahl、IEEE 754、單/多週期、換名、MESI、fork、競爭條件、分頁、線性遞迴、Havel–Hakimi、基底座標、Gram–Schmidt、對稱矩陣），42 章每章至少一個；樣式在 style.css 的 `lm-*`。
- **文字密度稽核**（2026-11-05 早上，42 章預設畫面）：可見文字中位數 609 字、最多 805 字；每章都有影片和互動實驗；最大區塊是費曼檢核（題目已只顯示第一句）。
- 渲染中斷的片子會留下改過的 `film/fonts/*`（finish.sh 重新子集化），直接讓 runall 重跑即可。

## 6.12 交接（2026-11-05 17:00 台灣，雲端工作階段 token 將盡）

**現況**
- 影片：43 支全部設計完成（`影片/工程/NN-名稱/`，3D＋記憶宮殿房號）。已交付 01–38（`影片/新版短影音/`），39 渲染中，40–43 在 `_lib/queue.txt` 排隊。交付後 spliceall 會自動剪進宮殿片頭片尾、壓 `web/media/` 網頁版並 commit + push。
- 01–20 等佇列空了由 `_lib/redo.sh` 重渲（章節標 y 300→150 的修正）；做完的留 `out/.redo_tag150`。
- 線上版：version 35（`1793865093-42b2`），31 支短影音、42 章互動實驗。**還沒上線的**：32–43 短影音、今日頁箭頭、實驗播放鍵圖示、費曼題縮短、第一人稱宮殿。
- GitHub：分支 `claude/video-remake-buildheap` 全部已推，沒有 PR。

**下一個工作階段先做**
1. `pgrep -fa "runall|spliceall|redo.sh"`；沒在跑就照 6.11 重開三個迴圈（工作階段重啟一定會停）。
2. 40–43 交付後：`python3 build.py` → `Artifact list scope=files` 看線上版號（有別人改過先合併）→ 發布 `dist/single.html`，`files` 帶上線上還沒有的 `media/*.mp4/.jpg`（比對 list 結果；`DATA.shorts` 有幾支就要帶齊）。
3. 我排了一個 send_later（trig_01QxhGzasjDtspjVxM1pdtBC，10:28 UTC）會叫醒這個工作階段做第 1–2 步。

**評分表（7.9/10）指出的待辦，依優先序**
1. **影片偏暗**：QA 亮度指紋近黑幀 60–83%（目標 17–39%）、均值 13–16（目標 17–20）。試過整支 `eq=gamma=1.15` → 均值 23、近黑 0%（過頭）；建議試 gamma 1.06–1.08，或在 `cs.js`／各片調 `vignette`、`amb haze`。可併入 01–20 重渲；要改 21–43 得全部重渲（約 7 小時）。
2. 剩約 40 個彩色 emoji：`core.js`（CALLOUT_ICON，可能已不用）、`views-learn.js` 8、`practice.js` 5、`cloud.js` 4、`app.js` 2；`explain*.js` 是另一個工作階段的，別亂動。圖示用 `ICON()`／`icHtml()`（core.js，24 格線條）。
3. 互動實驗多數是「換數字＋逐步播」，挑幾個做成可直接拖拉（B 樹插入、分頁位址）。
4. 片中房號（X館第 N 間）還沒跟網站宮殿位置一一對應。

**這次新增的東西**
- `web/js/labs-more.js`：20 個實驗（每章都有），樣式 `lm-*`；測試腳本在 scratchpad（`labtest.cjs` 跑每個實驗＋範例）。
- `web/js/palace3d.js`：預設第一人稱（pointer lock、WASD、空白跳、左放右拆、撞牆、手機搖桿）；「俯瞰」切回 OrbitControls；`Palace3D._st()` 是除錯用。注意：鎖定瞬間的大幅 movement 要忽略（已處理 >150px）。
- 費曼題 `feynPrompt()`：第一句 > 60 字切在 ：／；／，（不切公式）；今日任務標題只留短名、「前往」改箭頭。
- 單檔版只在 `file://` 開啟時清空 `DATA.shorts`（線上版有 media）。
- `.gitignore`：`_lib/*.log`、`*/work/cues.json`、`_palace/work/*_intro|outro.json` 都是每次自動產生的。渲染中的片子會改 `film/fonts/*`（子集化），runall 交付時會一起 commit。
- 測試要先開 `cd web && python3 -m http.server 8801 &`，再在 `tests/` 裡跑。

## 7. 接下來可以做的（使用者最新要求：排版要好看、整潔、大量圖示）

1. **整體視覺整理**（教材頁已做完；接下來是首頁「帶我讀」、練習頁、必背卡、儀表板）：
   - 教材頁的卡片層次、字級、行距。
   - 表格樣式。
   - 標題加圖示。
   - 手機寬度（390px）檢查。
   - 深色模式檢查。
2. 題目詳解、必背卡背面也加圖。
3. ~~首頁「帶我讀」的視覺更像 App（大按鈕、進度圈）~~：已做，進度條換成圍著今天圖示的進度圈（`.go-ring`）。選單頂端也多了總星數「⭐ n/126」。
4. 考古題到了就做方向二。

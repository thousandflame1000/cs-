# 回歸測試（Playwright）

先在 `web/` 開伺服器，再跑測試：

```bash
cd web && python3 -m http.server 8801 &
cd ../tests && for t in selftest katex_errors raw_math mobile_overflow secquiz_plan stage_order stage_stars feed_3rounds autonext daily_chest stars_merge skim_ratio single_file keyboard_only autopilot_flow wrong_to_lesson mock_boss lesson_video_play; do echo "== $t"; timeout 300 node $t.js | tail -3; done
```

| 檔案 | 檢查什麼 | 正常結果 |
|---|---|---|
| selftest.js | 自我檢查頁 | `自我檢查 ✓ 全部通過` |
| katex_errors.js | 所有教材／題目／詳解／卡片的 LaTeX 語法 | `0` |
| raw_math.js | 沒套 `$…$` 的數學原始碼 | 只剩 `co-datapath/rubric0`（`$t0` 是暫存器名稱） |
| mobile_overflow.js | 82 頁在 390px 寬有沒有超出畫面 | `no overflow` |
| secquiz_plan.js | 每段過關小測的分配 | `future: 0`（不考還沒讀的段落） |
| stage_order.js | 關卡由易到難、自適應第一題是 ★ | ★…→ 菁英 → 魔王；自適應全是 ★ |
| stage_stars.js | 血條、連擊、星等、結算 | `SUM:⭐⭐⭐` |
| feed_3rounds.js | 推薦三回合 | 星數逐回合增加 |
| autonext.js | 結算停留，手動返回練習 | `summary stays until explicitly dismissed` |
| daily_chest.js | 每日 3 星開金寶箱 | `gold drops seen: 1` |
| skim_ratio.js | 「只看重點」每段保留多少（< 25% 算藏太多） | `too-little 0` |
| single_file.js | 線上版用的 `dist/single.html`（不用伺服器） | `katex font faces 20`、`math font: KaTeX_Math`、`errs []` |
| keyboard_only.js | 只按 Enter 和 1 連打好幾關 | `summaries seen` ≥ 2、星數增加 |
| autopilot_flow.js | 從「帶我讀」進練習 → 結算接回今天計畫的下一步；從闖關頁進來仍是下一關 | `下一步：…`、`step now feyn:…`、`nextGo? 0` |
| wide_video.js | 橫式（16:9）影片的播放器：先把任一支橫式 mp4 複製成 `web/media/_wide_test.mp4`（測完刪掉） | 桌機與 390px 都是 `"wide":true`、ratio 1.78；直式那支 `otherWide:false` |
| wrong_to_lesson.js | 答錯 →「📖 回教材：第 N 段」→ 跳到該章並只展開那一段 | 按鈕寫第 N 段，`open sections` 就是 `[ N ]` |
| mock_boss.js | 模考的大魔王血條隨作答減少 | `start 20/20`、`after 3 17/20` |
| warmup_answers.py | 用程式獨立重算 `warmup.txt` 40 題填空的答案（`python3 tests/warmup_answers.py`，不用伺服器） | `不一致 []`、`沒驗到的填空題 []` |
| lesson_video_play.js | 教材頁以影片＋互動為主：有新版影片就播 mp4、影片下面是自動播放的「動手玩」、正文不重複實驗室入口；沒有新影片的章仍用即時畫面 | `video:true`、`route` 為 看影片 → 動手玩 → …、`dupEmbeds:0`、`lab mounted: true form folded: true` |
| ui_shell.js | 介面規格 U1–U7、U9（課程規格.md）：4 個主入口、兩下到每一頁、搜尋、目前頁標示、上課頁只展開目前這一步、考試筆記抽屜、「下一步」不蓋內容。**要用 `python3 server.py --port 8765 --no-browser` 跑（要有學生進度）**，`PORT=8765` | `合計違規 0` |
| stars_merge.js | 星等／默寫搬家與多裝置合併 | `[2, true, 1, '{"ds-sort":3,"al-dp":1}', 5]` |

`PORT` 環境變數可以改伺服器埠號。

**2026-11-14 作答卡重寫後**：練習題不再走「紙筆 → 對答案 → 三選一自評」，測試改用 `tests/_answer.js`：`H.answer(pg)` 照正解作答並按「送出答案」、`H.wrong(pg)` 故意答錯、`H.seed(pg, n|'first')` 先把知識點標成學會（練習只出學會的知識點的題）、`H.next(pg)` 結算後開下一回。`autopilot_flow`、`stage_stars`、`stage_order` 的假設已過期（見 HANDOFF 最上面），其餘照表。

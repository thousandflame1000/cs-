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
| autonext.js | 結算 5 秒自動下一關、碰畫面取消 | `after cancel still summary: 1` |
| daily_chest.js | 每日 3 星開金寶箱 | `gold drops seen: 1` |
| skim_ratio.js | 「只看重點」每段保留多少（< 25% 算藏太多） | `too-little 0` |
| single_file.js | 線上版用的 `dist/single.html`（不用伺服器） | `katex font faces 20`、`math font: KaTeX_Math`、`errs []` |
| keyboard_only.js | 只按 Enter 和 1 連打好幾關 | `summaries seen` ≥ 2、星數增加 |
| autopilot_flow.js | 從「帶我讀」進練習 → 結算接回今天計畫的下一步；從闖關頁進來仍是下一關 | `下一步：…`、`step now feyn:…`、`nextGo? 0` |
| wrong_to_lesson.js | 答錯 →「📖 回教材：第 N 段」→ 跳到該章並只展開那一段 | 按鈕寫第 N 段，`open sections` 就是 `[ N ]` |
| mock_boss.js | 模考的大魔王血條隨作答減少 | `start 20/20`、`after 3 17/20` |
| warmup_answers.py | 用程式獨立重算 `warmup.txt` 40 題填空的答案（`python3 tests/warmup_answers.py`，不用伺服器） | `不一致 []`、`沒驗到的填空題 []` |
| lesson_video_play.js | 教材頁以影片＋互動為主：有新版影片就播 mp4、影片下面是自動播放的「動手玩」、正文不重複實驗室入口；沒有新影片的章仍用即時畫面 | `video:true`、`route` 為 看影片 → 動手玩 → …、`dupEmbeds:0`、`lab mounted: true form folded: true` |
| stars_merge.js | 星等／默寫搬家與多裝置合併 | `[2, true, 1, '{"ds-sort":3,"al-dp":1}', 5]` |

`PORT` 環境變數可以改伺服器埠號。

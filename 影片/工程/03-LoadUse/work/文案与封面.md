# 《Load-Use 危障：資料不能送回過去》· 發布文案與封面

## 1. 標題備選

| 平台 | 標題 | 鉤子類型 |
|---|---|---|
| YouTube Shorts | 1. 有了 forwarding 還是要等？因為資料不能送回過去 | 反常識 |
| | 2. lw 後面為什麼一定要 stall 一拍 | 提問 |
| | 3. 一張時空格看懂 Load-Use 危障 | 收藏價值 |
| TikTok / IG Reels | 1. 你以為 forwarding 就不用 stall？ | 第二人稱 |
| | 2. 計組必考：lw 接 add 要等 1 拍 | 考點 |
| Threads / 限動 | 1. 管線危障，箭頭往下才來得及 | 收藏價值 |

**首選推薦**：YouTube Shorts 第 1 條。理由：開頭金句原句，「往上的箭頭＝回到過去」在片中直接演出。

## 2. 發布文案

### YouTube Shorts
**說明**
把 5 級管線畫成「時間往下流」的格子：add 的結果在 EX 結束就算好，下一條在下一拍 EX 開頭才要，箭頭往下，forwarding 來得及；換成 lw，資料要到 MEM 結束才拿到，add 卻在同一拍 EX 開頭就要，箭頭得往上指——回到過去，硬體做不到，只好插一個泡泡。最後看硬體怎麼偵測（ID/EX.MemRead 且 Rt 相同），以及怎麼靠換順序做到 0 stall。

**標籤**：#計算機組織 #管線 #pipeline #forwarding #資料危障 #資工所 #研究所考試 #COD

**置頂留言建議**：偵測：ID/EX.MemRead 且 ID/EX.Rt = IF/ID.Rs 或 IF/ID.Rt → 控制訊號清 0、PC 與 IF/ID 不更新。出處：Patterson & Hennessy COD 第 4 章。

### TikTok / IG Reels
**文案**：forwarding 只能把資料往未來送。lw 接 add 時箭頭得往上指，所以一定要等一拍。存起來考前看。
**話題**：#資工所 #計算機組織 #研究所 #讀書

### 來源與聲明
- 出處：Patterson & Hennessy, Computer Organization and Design 第 4 章（data hazards、load-use 偵測）；本站教材 co-pipeline
- 示意：時空格的排法是示意；暫存器編號為示範例
- 音樂與素材：無音樂；音效為程序化合成

## 3. 封面
- 鉤子句「有了 forwarding，還是要等」· 主標題「資料不能 / 送回過去」· 片名「Load-Use 危障 · lw 後面為什麼要等一拍」
- 主體：lw 與 add 的管線格，往上的珊瑚箭頭斷掉

## 4. 事實核對
- [x] add 結果在 EX 結束產生，下一條在下一拍 EX 開頭需要，可由 EX/MEM 轉送 → 0 stall
- [x] lw 資料在 MEM 結束才產生，緊接的指令在同一拍 EX 開頭需要 → 1 stall，之後由 MEM/WB 轉送
- [x] 偵測在 ID：ID/EX.MemRead 且 ID/EX.Rt ∈ {IF/ID.Rs, IF/ID.Rt}；處理：控制訊號清 0、PC 與 IF/ID 不更新
- [x] 隔一條（距離 2）時 0 stall

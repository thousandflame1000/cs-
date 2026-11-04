# 《Cache 位址切割：tag · index · offset》· 發布文案與封面

## 1. 標題備選

| 平台 | 標題 | 鉤子類型 |
|---|---|---|
| YouTube Shorts | 1. 標著 16 KB 的 cache，其實要做 147 Kbits | 反常識 + 數字 |
| | 2. 一個位址切三段：tag、index、offset 怎麼算 | 方法 |
| | 3. 1024 層的快取塔：直接映射一次看懂 | 收藏價值 |
| TikTok / IG Reels | 1. 你會算 cache 的 tag 有幾位元嗎？ | 第二人稱 |
| | 2. 計組必考：offset = lg B，index = lg(C/(B·k)) | 考點 |
| Threads / 限動 | 1. Cache 位址切割，考前看這支 | 收藏價值 |

**首選推薦**：YouTube Shorts 第 1 條。理由：開頭金句原句，147 Kbits 在片尾算出來。

## 2. 發布文案

### YouTube Shorts
**說明**
記憶宮殿 · 計組館第 2 間：一座 1024 層的快取塔。32 位元位址切三段：offset 4 位元（區塊 16 bytes 裡第幾格），index 10 位元（16 KB ÷ 16 B = 1024 層，搭電梯到第幾層），剩下 18 位元是 tag（很多位址搶同一層，用來確認是不是我）。tag 相同而且 valid 就命中。每層存 128 位元資料 + 18 位元 tag + 1 位元 valid = 147 位元，共 1024 層 → 150528 位元 ≈ 147 Kbits，是資料量的 1.15 倍。

**標籤**：#計算機組織 #Cache #快取 #直接映射 #tag #index #offset #資工所 #研究所考試 #COD #記憶宮殿

**置頂留言建議**：k-way 時 index = lg(C/(B·k))；write-back 每塊再加 1 個 dirty 位元。例題出自 COD 第 5 章。

### TikTok / IG Reels
**文案**：16 KB 的 cache 不是 128 Kbits，要加上 tag 和 valid，共 147 Kbits。存起來考前看。
**話題**：#資工所 #計算機組織 #研究所 #讀書

### 來源與聲明
- 出處：Patterson & Hennessy《Computer Organization and Design》第 5 章例題；本站教材 co-cache
- 示意：位址 0x00012345 為示範（tag 4、index 564、offset 5）
- 音樂與素材：無音樂；音效為程序化合成

## 3. 封面
- 鉤子句「標著 16 KB 的 cache」· 主標題「其實要做 / 147 Kbits」· 片名「Cache 位址切割 · tag · index · offset」
- 主體：1024 層的快取塔，第 564 層亮青

## 4. 事實核對
- [x] 區塊 16 B → offset 4；1024 個區塊（16 KB ÷ 16 B）→ index 10；tag 32 − 10 − 4 = 18
- [x] 每塊 128 + 18 + 1 = 147 位元；147 × 1024 = 150528 位元 = 147 Kbits；128 Kbits 資料的 1.15 倍
- [x] 0x00012345：offset 5、index 564、tag 4；0x00052345 同 index、tag 20

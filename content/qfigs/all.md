# 題目詳解配圖：「=== 題號」後面接 fig 區塊，會放在詳解文字前面（先看圖再看字）

=== ds-n01
```fig
array
row push 後: 1 2 3*
row pop 兩次: 1* _ _
cap: 堆疊像疊盤子：最後放的 3 最先拿走，再拿 2，剩下 1 在最上面
```

=== ds-n03
```fig
array
row 讀到 3、4: 3 4
row 讀到 +: 7*
row 讀到 2: 7 2
row 讀到 ×: 14+
cap: 後序式：數字就推進堆疊；遇到運算子，拿最上面兩個算完再放回去
```

=== ds-n09
```fig
array
row 原本: 5 2 4 1
row 插入 2: 2 5 4 1
row 插入 4: 2 4 5 1
row 插入 1: 1* 2 4 5
cap: 2 往左換 1 次、4 換 1 次、1 換 3 次：1 + 1 + 3 = 5 次
```

=== ds-n17
```fig
tree
90(50(20*,40),70(10,60))
---
array
row 陣列: 90 50* 70 20* 40 10 60
idx: 1 2 3 4 5 6 7
cap: 位置 2 是 50，它的左小孩在 2 × 2 = 4，就是 20
```

=== ds-n19
```fig
tree
1(3(7,4),2)
cap: 每個爸爸都比自己的小孩小：1 < 3、2；3 < 7、4 → 是 min-heap
```

=== ds-n25
```fig
tree
5(3(1,4*),8)
cap: 依序插入 5、3、8、1、4。中序（左 → 自己 → 右）走出來是 1、3、4、5、8，第 3 個是 4
```

=== ds-n33
```fig
array
row 雜湊表: _ _ _ _ _ _ 50* _ _ _ _
idx: 0 1 2 3 4 5 6 7 8 9 10
cap: 50 ÷ 11 = 4 餘 6 → 放進 6 號格
```

=== ds-n49
```fig
tree
1(2,3(4))
---
tree
5
cap: union(1,2)、union(3,4)、union(2,4) 之後：{1, 2, 3, 4} 一組、{5} 自己一組，共 2 組
```

=== ds-n57
```fig
graph
nodes: A(3)@0,0 B(3)@1,0 C(2)@2,0.5 D(4)@1,1 E(2)@0,1
edges: A(3)-B(3) B(3)-C(2) C(2)-D(4) D(4)-E(2) E(2)-A(3) A(3)-D(4) B(3)-D(4)
cap: 括號是度數：3 + 3 + 2 + 4 + 2 = 14 = 2 × 7 條邊（每條邊被兩端各算一次）
```

=== ds-n59
```fig
graph
nodes: s*@0,1 a@1,0 b@1,2 t+@2,1
edges: s-a* s-b a-t* b-t
cap: BFS 一圈一圈往外：第 1 圈 a、b，第 2 圈碰到 t → s → a → t 只要 2 條邊
```

=== al-n01
```fig
bars
bar 第 0 層（1 份）: 8 n
bar 第 1 層（2 份）: 8 n
bar 第 2 層（4 份）: 8 n
bar 第 3 層（8 份）: 8 n
cap: 每層加起來都是 n，總共 lg n 層 → n lg n
```

=== al-n02
```fig
array
row 剩下: 16 8 4 2 1*
cap: 每次砍一半、做一件小事：16 → 8 → 4 → 2 → 1，只要 lg 16 = 4 步
```

=== al-n17
```fig
array
row 第幾階: 1 2 3 4 5
row 走法: 1 2 3 5 8*
cap: 走到第 n 階 = 從 n−1 跨 1 步 + 從 n−2 跨 2 步：3 + 5 = 8
```

=== al-n19
```fig
array
row 拿: 10 10 5 1 1
cap: 每次先拿最大、不超過的：10、10、5、1、1 → 5 枚
```

=== al-n25
```fig
timeline 選中: [1,3)* 2 | · 1 | [4,7)* 3 | · 1 | [8,10)* 2
cap: 一直挑「最早結束」而且不重疊的：[1,3) → [4,7) → [8,10)，共 3 個
```

=== al-n27
```fig
bars
bar 物品 1（每公斤 6）: 60 全拿：60
bar 物品 2（每公斤 5）: 100 全拿：100
bar 物品 3（每公斤 4）: 80 拿 20/30：80
cap: 先拿最值錢的（每公斤價值高的），最後一個切一部分：60 + 100 + 80 = 240
```

=== al-n41
```fig
tree
1(2(4,5),3(6,7(8,9,10)))
cap: 10 個點的樹：除了根，每個點都有一條往上的邊 → 10 − 1 = 9 條
```

=== al-n51
```fig
graph
nodes: A+@0,0 B*@1,0 C+@2,0 D*@0,1 E+@1,1 F*@2,1
edges: A-B B-C A-D B-E C-F D-E E-F
cap: 綠色 3 個互不相連（獨立集），藍色 3 個碰到每一條邊（點覆蓋）：兩組加起來剛好是全部的點
```

=== al-n58
```fig
bars
bar 第 1 人: 1 1/10
bar 第 2 人: 1 1/10
bar 第 3 人: 1 1/10
bar …: 1 …
bar 第 10 人: 1 1/10
bar 加起來: 10 1 個人 *
cap: 每個人拿對的機率都是 1/10，期望值可以直接相加：10 × 1/10 = 1
```

=== co-n01
```fig
flow: 10⁹ 道指令 -> × 1.5 個週期 -> = 1.5 × 10⁹ 個週期 -> ÷ 每秒 3 × 10⁹ 個 -> = 0.5 秒*
cap: CPU 時間 = 指令數 × CPI ÷ 時脈
```

=== co-n03
```fig
bars
bar 原本: 100 20% + 80%
bar 無限多核: 20 只剩 20%（快 5 倍）*
cap: 能平行的 80% 縮到 0，不能平行的 20% 還在 → 最多快 1 ÷ 0.2 = 5 倍
```

=== co-n09
```fig
array
row 位元: 1* 0 0 0 0 0 0 0
row 權重: −128 64 32 16 8 4 2 1
cap: 二補數最高位的權重是負的：10000000 = −128，是最小值
```

=== co-n11
```fig
array
row 位元: 1* 0 1* 1*
row 權重: 8 4 2 1
cap: 是 1 的位置加起來：8 + 2 + 1 = 11
```

=== co-n18
```fig
bits: op 6 | rs 5 | rt 5 | rd 5 | shamt 5 | funct 6*
cap: R 型指令的六個欄位，加起來 32 位元
```

=== co-n25
```fig
lanes
第1道: 0 IF ID EX MEM WB
第2道: 1 IF ID EX MEM WB
第3道: 2 IF ID EX MEM WB
cap: 第 1 道要 5 個週期做完，之後每個週期多完成 1 道：5 + 99 = 104
```

=== co-n27
```fig
lanes
lw: 0 IF ID EX MEM* WB
add: 1 IF ID * EX* MEM WB
cap: lw 的資料在 MEM 結束才有，add 的 EX 只好晚一拍（泡泡）
```

=== co-n41
```fig
bits: tag 22 | index 5 | offset 5*
cap: 區塊 32 bytes = 2⁵，要 5 個位元指出是區塊裡的第幾個 byte
```

=== co-n42
```fig
bars
bar 命中時間: 1 1
bar miss 率 × 懲罰: 5 0.1 × 50 = 5
bar AMAT: 6 6 個週期 *
cap: 平均存取時間 = 命中時間 + miss 率 × miss 懲罰
```

=== os-n02
```fig
tree
P*(C1(C3),C2)
cap: 第一次 fork：P 生出 C1；第二次 fork：P 和 C1 各再生一個 → 共 4 個
```

=== os-n09
```fig
timeline FCFS: P1 5 | P2 3
cap: P1 從 0 開始（等 0），P2 要等到 5 才開始（等 5）：平均 (0 + 5) ÷ 2 = 2.5
```

=== os-n18
```fig
array
row 號誌值: 3 2 1 0 −1! −2!
row 誰呼叫 wait: 開始 P1 P2 P3 P4 P5
cap: 前 3 個拿到；第 4、5 個讓值變負，只好睡著等（−2 代表兩個在排隊）
```

=== os-n26
```fig
array
row P1: 🔒 ❓
row P2: 🔒 ❓
row P3: 🔒 ❓
row 第 4 個: 🔒+
cap: 最壞的情況：3 個人各拿 1 個、都還差 1 個。只要再多 1 個，就有人能做完並放出資源
```

=== os-n33
```fig
bits: 頁號 20 | 頁內位置 12*
cap: 4 KB = 4096 = 2¹² 個位置，要 12 個位元才數得完
```

=== os-n49
```fig
flow: 15000 轉／分 -> 一圈 60 ÷ 15000 秒 = 4 ms -> 平均要等半圈 -> 2 ms*
cap: 要的資料可能剛好在磁頭下，也可能要等一整圈，平均是半圈
```

=== os-n50
```fig
array
row 鏡像 1: 碟A 碟A′
row 鏡像 2: 碟B 碟B′
cap: RAID 1 每份資料存兩份（′ 是副本）：4 顆 1 TB 只能用 2 TB
```

=== dm-n01
```fig
array
row p: T T F F
row q: T F* T F
row p → q: T F! T T
cap: 只有「p 真、q 假」這一行是假的
```

=== dm-n03
```fig
array
row 日子: 1 2 3 … 365 366
row 人數: 1 1 1 … 1 2*
cap: 366 天每天先放 1 個人，第 367 個人一定要擠進某一天
```

=== dm-n10
```fig
array
row A 和: AB AC AD AE AF
row B 和: BC BD BE BF
row C 和: CD CE CF
row D 和: DE DF
row E 和: EF
cap: 6 個人兩兩配對：5 + 4 + 3 + 2 + 1 = 15 種
```

=== dm-n11
```fig
array
row 一樣口味: AA BB CC
row 不同口味: AB AC BC
cap: 3 種口味買 2 球（可重複、不計順序）：全部列出來剛好 6 種
```

=== dm-n19
```fig
bars
bar 1 個: 1 1 步
bar 2 個: 3 3 步
bar 3 個: 7 7 步
bar 4 個: 15 15 步
bar 5 個: 31 31 步
bar 6 個: 63 63 步 *
cap: 每多一個盤子，步數變兩倍再加 1：2⁶ − 1 = 63
```

=== dm-n27
```fig
matrix: 1 1 0 0 0 0 ; 1 1 0 0 0 0 ; 0 0 1 1 1 0 ; 0 0 1 1 1 0 ; 0 0 1 1 1 0 ; 0 0 0 0 0 1
name: R
cap: 每一類自己形成一個全是 1 的方塊：2×2 + 3×3 + 1×1 = 14 個 1
```

=== dm-n33
```fig
graph
nodes: A@1,0 B@2,0.8 C@1.6,2 D@0.4,2 E@0,0.8
edges: A-B A-C A-D A-E B-C B-D B-E C-D C-E D-E
cap: K₅：每個點連到另外 4 個，5 × 4 ÷ 2 = 10 條邊（每條被兩端各算一次）
```

=== dm-n41
```fig
flow: (48, 18) -> (18, 12) -> (12, 6) -> (6, 0) -> gcd = 6*
cap: 一直用「大的除以小的，換成餘數」，餘數變 0 時，前一個就是答案
```

=== la-n02
```fig
plane
range: -1 4 -1 5
line 5 -2
line -1 1
pt (2,1) hl "(2, 1)"
cap: 兩條直線的交點就是解：x = 2、y = 1
```

=== la-n10
```fig
plane
range: -2 2 -2 3
line 0 2 good
line 1 2 bad
pt (0,0) good "原點"
cap: y = 2x 過原點（綠，是子空間）；y = 2x + 1 沒過原點（紅，不是）
```

=== la-n17
```fig
matrix: 3 1 ; 2 4
pivot: 1,1 2,2
name: A
cap: 2×2 行列式 = 左上 × 右下 − 右上 × 左下 = 3 × 4 − 1 × 2 = 10
```

=== la-n25
```fig
plane
range: -1 3 -1 6
vec (1,0) "x"
vec (2,0) "Ax = 2x"
vec (0,1) "y"
vec (0,5) hl "Ay = 5y"
cap: diag(2, 5)：x 方向拉長 2 倍、y 方向拉長 5 倍 → 特徵值就是對角線的 2 和 5，比較大的是 5
```

=== la-n33
```fig
flow: (1, 2, 2) -> 平方相加 1 + 4 + 4 = 9 -> 開根號 √9 -> 長度 3*
cap: 向量長度 = 各分量平方相加再開根號（畢氏定理）
```

=== la-n34
```fig
plane
range: -1 4 -2 3
vec (1,2) "(1, 2)"
vec (3,-1) hl "(3, −1)"
cap: 內積 = 1 × 3 + 2 × (−1) = 1。內積是正的：兩個向量的夾角小於 90°
```

=== la-n43
```fig
array
row 特徵值: 3+ −1!
cap: 只要有一個特徵值不是正的，就不是正定
```

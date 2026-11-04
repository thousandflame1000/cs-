=== al-recurrence 1
```fig
bars
bar lg n: 4 4
bar n: 16 16
bar n lg n: 64 64
bar n²: 256 256 *
cap: n = 16 時各函數有多大（2ⁿ 已經是 65,536，畫不下）：lg n < n < n lg n < n² < 2ⁿ
```

=== al-recurrence 2
```fig
flow: 比 f(n) 和 n^(log_b a) -> f 小了多項式倍 | 差不多大 | f 大了多項式倍 -> 葉子贏：Θ(n^(log_b a)) | 每層一樣：多乘一個 lg n* | 根贏：Θ(f(n))
cap: Master 定理就是在比「最上面那層的工作」和「最底下所有葉子的工作」誰大
```

=== al-recurrence 3
```fig
tree
[n]([n/3]([n/9],[2n/9]),[2n/3]([2n/9],[4n/9]))
cap: T(n)=T(n/3)+T(2n/3)+n：每一層加起來都是 n，最深的一條約 1.71·lg n 層 → Θ(n lg n)
```

=== al-recurrence 4
```fig
flow: T(n)=2T(√n)+lg n -> 令 m = lg n -> S(m)=2S(m/2)+m -> S(m)=Θ(m lg m) -> T(n)=Θ(lg n · lg lg n)*
cap: 變數變換：開根號在「位數」上就是除以 2，換成 m = lg n 就變回熟悉的樣子
```

=== al-dc 1
```fig
tree
[8 3 5 1]([8 3]([8],[3]),[5 1]([5],[1]))
cap: 合併排序：一直切到只剩一個（divide），再兩兩合併（combine）：[3 8] 和 [1 5] 合成 [1 3 5 8]
```

=== al-dc 2
```fig
bars
bar 一個一個找: 1024 1,024 次
bar 二分搜尋: 10 10 次 +
cap: 在 1,024 個排好的數裡找一個：二分搜尋每次丟掉一半，T(n)=T(n/2)+1 → lg n
```

=== al-dc 3
```fig
plane
range: 0 8 0 6
seg (4,0) (4,6)
seg (2.66,0) (2.66,6) dash
seg (5.34,0) (5.34,6) dash
pt (1,1) (2,4) (3,2) (3.6,3.2) (4.6,3.8) (5,1) (6.5,5) (7,2)
pt (3.6,3.2) (4.6,3.8) hl
seg (3.6,3.2) (4.6,3.8) hl
cap: 中線兩邊各自最近的距離 δ≈1.34；只要檢查中線左右寬 δ 的帶子（虛線之間），就找到跨過中線、更近的一對（≈1.17）
```

=== al-dc 4
```fig
array
row 左半: 3 5 8
row 右半: 1* 4 9
cap: 合併時右半的 1 先出去：它比左半剩下的 3、5、8 都小，一次數到 3 個逆序對；接著 4 出去時左半剩 5、8，再 2 個，共 5 個
```

=== al-dc 5
```fig
flow: 係數 -> FFT 求值（n lg n） -> 逐點相乘（n） -> 反 FFT 內插（n lg n） -> 係數*
cap: 直接乘兩個多項式要 n²；換成在單位根上的「點值」來乘，只要 n lg n
```

=== al-dp 1
```fig
tree
F5(F4(F3*(F2,F1),F2),F3*(F2,F1))
cap: 費氏數列的遞迴樹：同一個子問題 F3 被算了兩次（重疊子問題）→ 用表格存起來，每個只算一次
```

=== al-dp 2
```fig
array
idx: B D C B
row A: 0 0 0 0
row B: 1* 1 1 1
row C: 1 1 2* 2
row B: 1 1 2 3*
cap: LCS("ABCB", "BDCB") 的表：字一樣就「左上 +1」，不一樣就取「上、左」較大的。右下角 3 就是答案（BCB）
```

=== al-dp 3
```fig
array
row 上一列: 1 1 2 2
row 這一列: 1 1 2 3*
cap: 只要 LCS 的長度時，每一格只看上一列和這一列 → 只留兩列，空間 O(min(m, n))
```

=== al-dp 4
```fig
bars
bar W = 1,000 的位數: 10 10 位
bar W = 1,000,000 的位數: 20 20 位
cap: W 的位數只多一倍，O(nW) 的表格卻大了 1,000 倍 → 對「輸入長度」是指數時間，叫偽多項式
```

=== al-dp 5
```fig
array
row 數列: 3 1 4 1 5 9 2 6
row 最後的 tail: 1 2 5 6
cap: tail[k] = 長度 k+1 的遞增子序列中最小的結尾。長度 4 就是答案（1 4 5 6 是一組），但 tail 本身 1 2 5 6 不一定是合法的子序列
```

=== al-greedy 1
```fig
flow: 任一個最佳解 OPT -> 把 OPT 的第一個選擇換成 greedy 的 -> 沒有變差 -> 所以有最佳解從 greedy 的選擇開始*
cap: 交換論證的骨架：證明「先做 greedy 那一步」不會吃虧
```

=== al-greedy 2
```fig
timeline A: · 1 | A 4 | · 5
timeline B（最短）: · 4 | B! 3 | · 3
timeline C: · 6 | C 4
cap: 挑最短的 B 會擋住 A 和 C，只排得進 1 場；挑最早結束的 A，再接 C，排得進 2 場
```

=== al-greedy 3
```fig
array
row 字元: a b c d e f
row 頻率: 45 13 12 16 9 5
row 編碼: 0* 101 100 111 1101 1100
cap: Huffman 碼：越常出現越短；任何一個碼都不是另一個碼的開頭（前綴碼），所以不用分隔符號
```

=== al-greedy 4
```fig
bars
bar 0/1 照比例貪婪: 160 160!
bar 0/1 最佳: 220 220+
bar 分數背包（可以切）: 240 240
cap: 容量 50，物品（重, 值）＝(10, 60)、(20, 100)、(30, 120)。能切的話照比例拿最好；不能切，貪婪就會輸
```

=== al-greedy 5
```fig
graph
nodes: A@0,0 B@1,0 C@0.5,1 D@1.5,1
edges: A-B:5* B-C:4* A-C:3! C-D:2*
cap: 圖擬陣：「不成環的邊」是獨立集。權重由大到小、能加就加（A–C 會成環，跳過）→ 最大權重的生成森林
```

=== al-greedy 6
```fig
array
row 貪婪: 4! 1! 1!
row 最佳: 3+ 3+
cap: 幣值 {1, 3, 4} 湊 6 元：先拿最大的 4 要 3 枚；3 + 3 只要 2 枚
```

=== al-sp 1
```fig
flow: u.d = 5 -> 邊 u→v，權重 2 -> v.d 原本 9 > 5 + 2 -> 改成 v.d = 7*
cap: 鬆弛（RELAX）：經過 u 走到 v 比較近，就更新 v 的距離
```

=== al-sp 2
```fig
flow: 你的圖 -> 沒有權重 | 權重都 ≥ 0 | 有負邊、但沒有環 | 有負邊、可能有環 -> BFS：V+E | Dijkstra：(V+E) lg V | 拓撲序鬆弛：V+E | Bellman-Ford：VE
cap: 單一起點最短路徑：先看圖長什麼樣，再挑演算法
```

=== al-sp 3
```fig
array
idx: s a b c
row 開始: 0 ∞ ∞ ∞
row 第 1 輪: 0 4 1 ∞
row 第 2 輪: 0 3 1 5
row 第 3 輪: 0 3* 1 4*
cap: 邊 s→a 4、s→b 1、b→a 2、a→c 1，依「a→c、b→a、s→a、s→b」的順序鬆弛：順序不好時一輪只推一步，|V|−1 輪一定夠
```

=== al-sp 4
```fig
flow: 加一個點 q 連到每個點（權重 0） -> Bellman-Ford 算 h(v) -> 新權重 w(u,v) + h(u) − h(v) ≥ 0 -> 每個點跑一次 Dijkstra*
cap: Johnson：先把負邊「墊高」成非負，同起點同終點的路徑都加同一個常數，最短路徑不變
```

=== al-sp 5
```fig
matrix: 0 3 5 ; ∞ 0 2 ; ∞ ∞ 0
pivot: 1,3
name: D⁽²⁾
cap: 邊 1→2 權 3、2→3 權 2、1→3 權 8。允許中途經過點 2 之後，1→3 從 8 變成 3 + 2 = 5
```

=== al-sp 6
```fig
graph
nodes: 開始@0,1 A@1,0 B@1,2 C@2,1 結束@3,1
edges: 開始>A:3天* 開始>B:2天 A>C:4天* B>C:1天 C>結束:2天*
cap: 關鍵路徑＝最長的那條（3 + 4 + 2 = 9 天）：這條上的任何一步延誤，整個專案就延誤
```

=== al-mst-flow 1
```fig
graph
nodes: A*@0,0 B*@0,1 C@1.5,0.5 D@2.5,0.5
edges: A-B:1 A-C:4 B-C:2* B-D:5 C-D:3
cap: 把點分成兩邊（藍色 = 一邊），跨過去的邊裡最輕的（B–C，權重 2）一定可以放進最小生成樹
```

=== al-mst-flow 2
```fig
graph
nodes: s*@0,1 a@1,0 b@1,2 t*@2,1
edges: s>a:3/3* s>b:2/2* a>t:2/2 a>b:1/1 b>t:3/3
cap: 標示「流量／容量」。從 s 出去的兩條都滿了（3 + 2 = 5），所以最大流 = 最小割 = 5
```

=== al-mst-flow 3
```fig
graph
nodes: L1@0,0 L2@0,1 L3@0,2 R1@1.5,0 R2@1.5,1 R3@1.5,2
edges: L1-R1* L1-R2 L2-R2* L3-R2 L3-R3*
cap: 二分圖的最大匹配是 3（粗線）。加一個源點連左邊、右邊連匯點、容量都是 1，就變成最大流
```

=== al-np 1
```fig
venn: NP | NP-hard
nums: P在這 NPC 停機問題
cap: （假設 P ≠ NP）NP-complete ＝ 在 NP 裡、又是 NP-hard。停機問題是 NP-hard，但不在 NP
```

=== al-np 2
```fig
flow: CIRCUIT-SAT -> SAT -> 3-SAT -> CLIQUE
flow: CLIQUE -> VERTEX-COVER -> HAM-CYCLE -> TSP
flow: 3-SAT -> SUBSET-SUM
cap: CLRS 的歸約鏈：箭頭 A → B 代表「A 可以轉成 B」，所以 B 至少跟 A 一樣難
```

=== al-np 3
```fig
array
row 在 P: 2-SAT+ 2-著色+ 歐拉迴路+ 最短路徑+ 最小割+
row NPC: 3-SAT! 3-著色! 漢米頓迴路! 最長路徑! 最大割!
cap: 一字之差，難度天差地遠：上排有多項式解法，下排是 NP-complete
```

=== al-np 4
```fig
bars
bar 點覆蓋: 2 2 倍
bar Metric TSP（MST 走一圈）: 2 2 倍
bar Christofides: 1.5 1.5 倍
bar 一般 TSP: 3 做不到常數倍!
cap: 近似演算法保證「最多是最佳解的幾倍」；一般 TSP 除非 P = NP，任何常數倍都做不到
```

=== al-prob 1
```fig
flow: X = X₁ + X₂ + … + Xₙ -> E[X] = E[X₁] + … + E[Xₙ] -> E[Xᵢ] = Pr[事件 i 發生] -> 不需要獨立*
cap: 指示隨機變數：把「數幾次」拆成很多個 0/1，期望值直接加起來
```

=== al-prob 2
```fig
array
row Las Vegas: 答案一定對+ 時間看運氣 例：隨機快排
row Monte Carlo: 時間有上限+ 答案可能錯! 例：Miller–Rabin
cap: 兩種隨機演算法：一個賭時間，一個賭答案
```

=== al-prob 3
```fig
array
idx: 1 2 3 4 5 6 7
row P: a b a b a c a
row π: 0 0 1 2 3* 0 1
cap: KMP 的 π[q]：P 的前 q 個字裡「既是開頭、也是結尾」的最長長度。比對失敗時直接跳到 π，不用從頭來
```

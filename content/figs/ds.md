# 每段配圖：「=== 章節id 段號」，段號 = 該章第幾個「## 」標題；內容是一或多個 fig 區塊

=== ds-amortized 1
```fig
array
row 環狀佇列: _ 30 40 50 _ _ _ _
idx: 0 1 2 3 4 5 6 7
cap: front＝0（第一個元素的前一格）、rear＝3。滿的條件是 (rear+1) % 8 == front，所以 8 格最多只放 7 個
```

=== ds-amortized 2
```fig
tree
[＋](a,[×](b,c))
cap: 運算式 a+b*c 的樹：中序 a+b*c、後序 a b c * +、前序 + a * b c
```

=== ds-amortized 3
```fig
array
row 做得到: 123 132 213 231 321
row 做不到: 312!
cap: 1、2、3 依序進堆疊，能吐出 5 種順序；只有 312 不行（要先吐 3 時，1 被壓在 2 底下）
```

=== ds-amortized 4
```fig
flow: 攤銷分析 -> 聚集：總成本 ÷ 次數 | 會計：多收的錢存起來 | 位能：存款 = 位能函數
cap: 三種方法算的是同一件事：一串操作「平均」每次多少錢，而且最倒楣的情況也成立
```

=== ds-amortized 5
```fig
bars
bar 第 1 次: 1
bar 第 2 次: 2 *
bar 第 3 次: 3 *
bar 第 4 次: 1
bar 第 5 次: 5 *
bar 第 6 次: 1
bar 第 7 次: 1
bar 第 8 次: 1
bar 第 9 次: 9 *
cap: 每次插入的實際成本：遇到「表滿了要搬家」那次才貴，平均下來每次不到 3
```

=== ds-sort 1
```fig
array
row 穩定: 插入 泡沫 合併 計數 基數
row 不穩定: 選擇! 快速! 堆積! Shell!
cap: 穩定 = 一樣大的東西排完後前後順序不變；基數排序每一輪用的子排序必須穩定
```

=== ds-sort 2
```fig
bars
bar 4 個數的排列: 24 24 種
bar 比 4 次最多分: 16 16 種（不夠）!
bar 比 5 次最多分: 32 32 種（夠）+
cap: 比 h 次最多分出 2^h 種結果；要分辨 n! 種排列，至少比 ⌈lg n!⌉ 次
```

=== ds-sort 3
```fig
tree
[8]([4]([2],[2]),[4]([2],[2]))
---
tree
[8]([0],[7]([0],[6]([0],[5])))
cap: 左：每次切一半，只有 lg n 層 → n lg n。右：每次切成 0 和 n−1（例如已排好的資料），n 層 → n²
```

=== ds-sort 4
```fig
array
row A: 2 5 3 0 2 3 0 3
row 計數 C: 2 0 2 3 0 1
idx: 0 1 2 3 4 5
row 前綴和: 2 2 4 7 7 8
row 結果 B: 0 0 2 2 3 3 3 5
cap: 計數排序：數每個值有幾個 → 前綴和告訴你「值 x 最後放在第幾格」→ 由後往前放（才穩定）
```

=== ds-sort 5
```fig
flow: n 個數 -> 每 5 個一組，各取中位數 -> 中位數的中位數 x* -> 至少 3n/10 個比 x 小、3n/10 個比 x 大 -> 遞迴只剩 ≤ 7n/10
cap: Median of medians 保證每次都丟掉三成，所以最壞也是 O(n)
```

=== ds-heap 1
```fig
tree
1*(3(7,9),2(4,8))
---
array
row 陣列: 1* 3 2 7 9 4 8
idx: 1 2 3 4 5 6 7
cap: min-heap：爸爸 ≤ 小孩。位置 i 的爸爸在 ⌊i/2⌋、小孩在 2i 和 2i+1
```

=== ds-heap 2
```fig
flow: 你最常做什麼？ -> 很多 decrease-key（Dijkstra、Prim 的密圖） | 常常要合併兩堆 | 一般用途 -> Fibonacci heap* | Binomial／Leftist heap | 二元堆積
cap: 挑優先佇列看「哪個操作最多」：Fibonacci heap 的 decrease-key 攤銷 O(1)
```

=== ds-heap 3
```fig
tree
[1 s=2]([4 s=2]([8 s=1],[9 s=1]),[3 s=1])
cap: s = 走到最近空位要幾步。左小孩的 s 一定 ≥ 右小孩，所以「一路往右」那條路最短，合併就沿著它走
```

=== ds-heap 4
```fig
tree
1*(2(4(8),6),3(7),5)
---
array
row 13 的二進位: 1 1 0 1
row 有哪些樹: B3 B2 _ B0
cap: 左：B3 有 8 個節點，深度 0、1、2、3 各有 1、3、3、1 個（就是 C(3,i)）。右：13 個元素 = 一棵 B3 + 一棵 B2 + 一棵 B0
```

=== ds-heap 5
```fig
flow: decrease-key 後 x 比爸爸小 -> 把 x 剪下，放到根串列 -> 爸爸之前被剪過小孩嗎？ -> 有：爸爸也剪下（連鎖剪）! | 沒有：替爸爸做記號
cap: Fibonacci heap 的 cascading cut：保證每棵子樹不會太瘦，最大度數才是 O(lg n)
```

=== ds-bst 1
```fig
tree
A(B(D+,E+),C(F+))
cap: 葉子（綠）有 3 個、兩個小孩的節點（A、B）有 2 個：葉子數 = 兩個小孩的節點數 + 1
```

=== ds-bst 2
```fig
tree
4(2(1,3),6(5,7))
---
tree
1(,2(,3(,4)))
cap: 同樣的鍵：左邊是平衡的 BST，高度 2；右邊照 1、2、3、4 的順序插入，退化成一條鏈，高度 n−1
```

=== ds-bst 3
```fig
tree
3!(2(1*,),)
---
tree
2(1*,3)
cap: LL 型失衡：1 插在 3 的左邊的左邊 → 對 3 右旋一次就平衡了
```

=== ds-bst 4
```fig
tree
7(3!(1,5),18!(10,22))
---
tree
[3 7 18]([1],[5],[10],[22])
cap: 左：紅黑樹（紅框是紅節點）。右：把黑節點和它的紅孩子併成一格，就是一棵 2-3-4 樹
```

=== ds-bst 5
```fig
tree
g(p(x*([A],[B]),[C]),[D])
---
tree
x*([A],p([B],g([C],[D])))
cap: Splay 的 zig-zig：x 在爸爸 p 的左邊、p 又在 g 的左邊 → 先轉 p、再轉 x，x 上升兩層
```

=== ds-hash 1
```fig
flow: 鍵 123 -> h(k) = k mod 11 -> 第 2 格*
cap: 除法雜湊：123 = 11×11 + 2。表大小 m 取一個不接近 2 的次方的質數
```

=== ds-hash 2
```fig
array
row 第 0 格: 15 -> 10
row 第 1 格: 31
row 第 2 格: 17 -> 22
row 第 3 格: 28
row 第 4 格: 4
cap: 鏈結法（m=5，h(k)=k mod 5）：撞在同一格就串起來，新的插在最前面；平均每串 α = n/m 個
```

=== ds-hash 3
```fig
bars
bar 裝 50%: 2 約 2 格
bar 裝 75%: 4 約 4 格
bar 裝 90%: 10 約 10 格!
cap: 開放定址、均勻雜湊下，找不到時平均要看 1/(1−α) 格：表越滿越慢
```

=== ds-hash 4
```fig
array
row 位元: 0 1* 0 1* 0 0 0 1* 0 0
idx: 0 1 2 3 4 5 6 7 8 9
cap: Bloom filter：加入 cat 時，3 個雜湊函數把第 1、3、7 位設成 1。查詢時三格都是 1 才說「可能在」，有一格是 0 就「一定不在」
```

=== ds-btree 1
```fig
tree
[10 20]([3 7],[13 17],[25 30 40])
cap: t=2 的 B 樹：每個節點 1～3 個鍵，所有葉子一樣深；比 10 小往左、10～20 走中間、比 20 大往右
```

=== ds-btree 2
```fig
flow: 要刪的鍵在哪？ -> 在葉子 | 在內部節點 | 不在這個節點 -> 直接刪 | 用前驅或後繼頂替；都太瘦就合併 | 往下走前先讓孩子至少 t 個鍵（借或合併）
cap: CLRS 的刪除只往下走一趟：每次走進一個孩子之前，先保證它「夠胖」
```

=== ds-btree 3
```fig
tree
[15 25]([5 10],[15 20],[25 30])
---
array
row 葉子串起來: 5 10 -> 15 20 -> 25 30
cap: B+ 樹：資料全部在葉子，上面只放「路標」的副本；葉子串成一條，範圍查詢從左走到右就好
```

=== ds-btree 4
```fig
tree
根(t(o+,e(a+,n+)),i(n+(n+)))
cap: 存了 to、tea、ten、in、inn 的 Trie（綠＝一個字的結尾）。找 ten 只走 3 步，跟總共存幾個字無關
```

=== ds-btree 5
```fig
array
row 第 2 層: 1* _ _ _ 9 _
row 第 1 層: 1* _ 4* _ 9 _
row 第 0 層: 1 3 4* 6* 9 12
cap: 跳躍串列找 6：上層先大步跳（9 太大就往下一層），最後在底層走一小步。期望 O(lg n)
```

=== ds-unionfind 1
```fig
tree up
a(b,c(d))
---
tree up
e(f)
cap: 每棵樹是一個集合，根（a、e）是代表。FIND(d)：d → c → a，所以 d 屬於 a 那一組
```

=== ds-unionfind 2
```fig
bars
bar rank 0: 1 至少 1 個
bar rank 1: 2 至少 2 個
bar rank 2: 4 至少 4 個
bar rank 3: 8 至少 8 個
cap: 按秩合併：rank 為 r 的根底下至少 2^r 個元素，所以 rank 不會超過 lg n
```

=== ds-unionfind 3
```fig
graph
nodes: A@0,0 B@1,0 C@0,1 D@1,1
edges: A-B:1* C-D:2* A-C:3* B-D:4!
cap: Kruskal 用 Union-Find：輪到邊 B–D 時，B 和 D 已經在同一組（FIND 一樣），加了會成環，跳過
```

=== ds-graph 1
```fig
graph
nodes: 1@0,0 2@1,0 3@0,1 4@1,1
edges: 1-2 1-3 2-3 3-4
---
matrix: 0 1 1 0 ; 1 0 1 0 ; 1 1 0 1 ; 0 0 1 0
name: A
cap: 同一張圖的鄰接矩陣：第 i 列第 j 欄是 1 代表 i、j 之間有邊；無向圖的矩陣左右對稱
```

=== ds-graph 2
```fig
graph
nodes: s*@0,1 a@1,0 b@1,2 c@2,0 d@2,2
edges: s-a* s-b* a-c* b-d* a-b
cap: BFS 一層一層往外：第 0 層 s；第 1 層 a、b；第 2 層 c、d。粗線就是最短路徑樹
```

=== ds-graph 3
```fig
timeline u: · 1 | u 7 | · 4
timeline v（u 的後代）: · 2 | v* 4 | · 6
timeline w（不相干）: · 9 | w+ 2 | · 1
cap: 括號定理：任兩個點的 [發現, 完成] 區間，不是一個包住另一個（祖孫），就是完全分開
```

=== ds-graph 4
```fig
graph
nodes: 起床@0,1 刷牙@1,0 早餐@2,0 穿衣@1,2 出門@3,1
edges: 起床>刷牙 刷牙>早餐 起床>穿衣 早餐>出門 穿衣>出門
---
array
row 一種順序: 起床 刷牙 早餐 穿衣 出門
cap: 拓撲排序：每條箭頭都從前面指向後面。這張圖的順序不唯一（穿衣可以排在刷牙前面）
```

=== ds-graph 5
```fig
graph
nodes: a*@0,0 b*@1,0 c*@0.5,1 d+@2,1 e+@3,1
edges: a>b b>c c>a c>d d>e e>d
cap: 兩個強連通元件：{a,b,c} 和 {d,e}。把每一組縮成一個點，剩下 {a,b,c} → {d,e}，一定沒有環（DAG）
```

=== ds-graph 6
```fig
graph
nodes: A@0,0 B@0,2 C!@1,1 D@2,0 E!@2,2 F@3,2
edges: A-B A-C B-C C-D C-E D-E E-F!
cap: 拿掉 C 或 E 圖就斷開，它們是關節點；E–F 拿掉也會斷，是橋
```

=== ds-graph 7
```fig
graph
nodes: E@0.5,0 A*@0,1 B*@1,1 C@0,2 D@1,2
edges: E-A E-B A-B A-C B-D C-D
cap: 「房子」圖：奇數度的點剛好兩個（A、B），所以可以一筆畫，但要從 A 開始、在 B 結束，回不到原點
```

=== dm-logic 1
```fig
array
row p: T T F F
row q: T F T F
row p → q: T F! T T
cap: 「如果 p 就 q」只有在 p 真、q 假的時候是假的；p 假的時候怎樣都算真
```

=== dm-logic 2
```fig
flow: ∃y ∀x P(x,y)（有一個 y 對所有 x 都行） -> ∀x ∃y P(x,y)（每個 x 各自找得到 y）
cap: 左邊推得出右邊，反過來不行：「每個整數都有比它大的數」是真的，「有一個數比所有整數都大」是假的
```

=== dm-logic 3
```fig
flow: 證 P(1) -> 假設 P(k) 成立 -> 推出 P(k+1) -> 所以每個 n 都成立*
cap: 數學歸納法像推骨牌：第一張會倒，而且「前一張倒就會推倒下一張」
```

=== dm-logic 4
```fig
array
row 月份: 1 2 3 4 5 6 7 8 9 10 11 12
row 人數: 1 1 1 1 1 1 1 1 1 1 1 2*
cap: 13 個人、12 個月：就算平均分，也一定有一個月至少 ⌈13/12⌉ = 2 個人
```

=== dm-logic 5
```fig
array
row f(1): 0. 1* 4 1 5
row f(2): 0. 9 2* 6 5
row f(3): 0. 3 5 8* 9
row 新的數: 0. 2+ 3+ 9+ …
cap: 對角線論證：新的數第 k 位故意跟 f(k) 的第 k 位不一樣 → 它不在表上 → (0, 1) 的實數數不完（不可數）
```

=== dm-counting 1
```fig
array
row 不重複、有順序: ab ba ac ca bc cb
row 不重複、無順序: ab ac bc
row 可重複、無順序: aa bb cc ab ac bc
cap: 從 {a, b, c} 選 2 個：排列 P(3,2) = 6、組合 C(3,2) = 3、可重複的組合 C(4,2) = 6
```

=== dm-counting 2
```fig
array
row n=0: 1
row n=1: 1 1
row n=2: 1 2 1
row n=3: 1 3* 3* 1
row n=4: 1 4 6+ 4 1
cap: Pascal 三角形：C(4,2) = C(3,1) + C(3,2) = 3 + 3 = 6；第 n 列加起來是 2ⁿ
```

=== dm-counting 3
```fig
array
row n: 1 2 3 4 5 6
row 錯排 Dₙ: 0 1 2 9 44 265*
row n!: 1 2 6 24 120 720
cap: 錯排：每個人都沒拿到自己的帽子。Dₙ 大約是 n!/e，也就是全部排列的 36.8%（265/720）
```

=== dm-counting 4
```fig
array
row 球與槓: ★ ★ | ★ | ★ ★
cap: 5 顆一樣的球放進 3 個箱子 = 排 5 顆星和 2 根槓（這個是 2、1、2）：C(7, 2) = 21 種
```

=== dm-counting 5
```fig
tree
●(●(●,),)
---
tree
●(●(,●),)
---
tree
●(●,●)
---
tree
●(,●(●,))
---
tree
●(,●(,●))
cap: 3 個節點的二元樹有 C₃ = 5 種形狀（Catalan 數：1, 1, 2, 5, 14, 42…）
```

=== dm-recur-gf 1
```fig
bars
bar 1 個盤子: 1 1 步
bar 2 個盤子: 3 3 步
bar 3 個盤子: 7 7 步
bar 4 個盤子: 15 15 步
bar 5 個盤子: 31 31 步 *
cap: 河內塔：先把上面 n−1 個搬走、搬最大的、再搬回來 → Hₙ = 2Hₙ₋₁ + 1 = 2ⁿ − 1
```

=== dm-recur-gf 2
```fig
flow: aₙ = 5aₙ₋₁ − 6aₙ₋₂ -> 特徵方程 r² − 5r + 6 = 0 -> r = 2、3 -> aₙ = α·2ⁿ + β·3ⁿ*
cap: 線性齊次遞迴：先解特徵方程，再用前兩項解出 α、β
```

=== dm-recur-gf 3
```fig
flow: aₙ = 2aₙ₋₁ + 1 -> 齊次解 α·2ⁿ -> 特解猜常數 p：p = 2p + 1 → p = −1 -> aₙ = α·2ⁿ − 1*
cap: 非齊次 = 齊次解 + 一個特解；a₀ = 0 時 α = 1，就是河內塔的 2ⁿ − 1
```

=== dm-recur-gf 4
```fig
flow: 比 a 和 b^d -> a < b^d | a = b^d | a > b^d -> O(n^d) | O(n^d · lg n)* | O(n^(log_b a))
cap: f(n) = a·f(n/b) + c·n^d：跟演算法的 Master 定理是同一件事
```

=== dm-recur-gf 5
```fig
flow: 1/(1−x) = 1 + x + x² + … -> 係數全是 1 -> 1/(1−x)² = 1 + 2x + 3x² + … -> 係數是 n + 1*
cap: 生成函數把整個數列裝進一個函數；相乘就是「分配到兩堆的方法數」
```

=== dm-recur-gf 6
```fig
flow: 每個字母出現次數的 EGF 相乘 -> 無限制：eˣ | 偶數次：(eˣ + e⁻ˣ)/2 | 奇數次：(eˣ − e⁻ˣ)/2 -> 取 xⁿ/n! 前面的係數*
cap: 指數生成函數用在「有順序」的排列（字串）
```

=== dm-relations 1
```fig
matrix: 1 1 0 ; 1 1 0 ; 0 0 1
pivot: 1,1 2,2 3,3
name: R
cap: {1,2,3} 上的關係：對角線全 1 → 自反；左右對稱 → 對稱；也遞移 → 等價關係，分成 {1,2}、{3} 兩類
```

=== dm-relations 2
```fig
graph
nodes: a@0,1 b@1,0 c@2,1
edges: a>b b>c a>c:補上+
cap: 遞移閉包：a 到得了 b、b 到得了 c，就要補上 a → c（綠）
```

=== dm-relations 3
```fig
array
row 模 3 的等價類: [0]={0,3,6,…} [1]={1,4,7,…} [2]={2,5,8,…}
cap: 同餘模 3 把整數切成 3 類，每個整數恰好在其中一類（等價類形成分割）
```

=== dm-relations 4
```fig
graph
nodes: {a,b}*@1,0 {a}@0,1 {b}@2,1 ∅@1,2
edges: ∅-{a} ∅-{b} {a}-{a,b} {b}-{a,b}
cap: {a,b} 的子集用「包含於」排序的 Hasse 圖：只畫緊鄰的關係，越上面越大；{a} 和 {b} 不能比較
```

=== dm-relations 5
```fig
bars
bar 所有函數: 8 2³ = 8
bar 一對一: 0 0（3 個要放進 2 格，一定撞）!
bar 映成: 6 2!·S(3,2) = 6 +
cap: |A| = 3、|B| = 2 的函數 f : A → B 有幾個
```

=== dm-graph 1
```fig
graph
nodes: A(3)*@0,0 B(2)@1,0 C(2)@1,1 D(1)*@0,1
edges: A(3)-B(2) A(3)-C(2) A(3)-D(1) B(2)-C(2)
cap: 括號是度數：3 + 2 + 2 + 1 = 8 = 2 × 4 條邊（握手定理）；奇數度的點（A、D）一定有偶數個
```

=== dm-graph 2
```fig
graph
nodes: A*@0,0 B@1,0 C*@1,1 D@0,1
edges: A-B* B-C* C-D* D-A* A-C
cap: 粗線是漢米頓迴路（每個點剛好走一次）。奇度點是 A、C，所以有從 A 到 C 的一筆畫（每條邊剛好走一次）
```

=== dm-graph 3
```fig
tree
1(2(4,5),3(6,7))
cap: 7 個點的樹剛好 6 條邊；任兩點之間只有一條路；拿掉任何一條邊就斷成兩塊
```

=== dm-graph 4
```fig
graph
nodes: A@1,0 B@0,2 C@2,2 D*@1,1.3
edges: A-B A-C B-C A-D B-D C-D
cap: K₄ 畫在平面上不交叉：v = 4、e = 6、f = 4（含外面那一面），4 − 6 + 4 = 2
```

=== dm-graph 5
```fig
graph
nodes: A*@1,0 B+@2,0.8 C*@1.6,2 D+@0.4,2 E!@0,0.8
edges: A-B B-C C-D D-E E-A
cap: 5 個點的環要 3 種顏色：兩色交替繞一圈會撞到自己（奇環不是二分圖）
```

=== dm-graph 6
```fig
graph
nodes: x1!@0,0 x2!@0,1 x3@0,2 y1!@1.5,0 y2@1.5,1 y3@1.5,2
edges: x1-y1! x2-y1! x3-y1 x3-y2 x3-y3
cap: Hall 條件失敗：{x1, x2} 兩個人只認識 y1 一個人（|N(S)| = 1 < 2），所以左邊不可能每個人都配到
```

=== dm-nt-algebra 1
```fig
flow: (252, 105) -> (105, 42) -> (42, 21) -> (21, 0) -> gcd = 21*
cap: 輾轉相除：252 = 2×105 + 42、105 = 2×42 + 21、42 = 2×21。餘數變 0 時，前一個就是 gcd
```

=== dm-nt-algebra 2
```fig
array
row x ≡ 2 (mod 3): 2 5 8* 11 14
row x ≡ 3 (mod 5): 3 8* 13
cap: 中國剩餘定理：3 和 5 互質，所以 0～14 裡剛好有一個數同時滿足：x = 8（模 15 唯一）
```

=== dm-nt-algebra 3
```fig
flow: 明文 m = 4 -> 加密 c = 4³ mod 33 = 31 -> 解密 31⁷ mod 33 = 4*
cap: 迷你 RSA：p = 3、q = 11、n = 33、φ(n) = 20、e = 3、d = 7（3 × 7 = 21 ≡ 1 mod 20）
```

=== dm-nt-algebra 4
```fig
matrix: 0 1 2 3 ; 1 2 3 0 ; 2 3 0 1 ; 3 0 1 2
name: + mod 4
cap: (ℤ₄, +) 的運算表：每一列、每一行 0～3 都剛好出現一次。子群 {0, 2} 的大小 2 整除 4（Lagrange）
```

=== dm-nt-algebra 5
```fig
bars
bar 不轉: 16 16
bar 轉 90°: 2 2
bar 轉 180°: 4 4
bar 轉 270°: 2 2
cap: 4 顆珠子、2 種顏色的項鍊（只能旋轉）：每種旋轉下「轉了還一樣」的塗法數取平均：(16 + 2 + 4 + 2) ÷ 4 = 6 種
```

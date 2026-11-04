=== la-systems 1
```fig
plane
range: -1 4 -1 4
line 1 1
line 3 -1
pt (1,2) hl "唯一解"
cap: 兩條線交於一點：唯一解
---
plane
range: -1 4 -1 4
line 1 1
line -1 1 bad
cap: 平行：無解
---
plane
range: -1 4 -1 4
line 1 1 hl
cap: 重疊：無限多解
```

=== la-systems 2
```fig
flow: A 可逆 -> det A ≠ 0 | rank A = n | N(A) = {0} | Ax = b 永遠恰一解 | 0 不是特徵值
cap: 可逆矩陣定理：這些說法全部等價，一個成立就全部成立
```

=== la-systems 3
```fig
matrix: 1 0 0 ; 2 1 0 ; −1 −1 1
name: L
---
matrix: 2 1 1 ; 0 −8 −2 ; 0 0 1
pivot: 1,1 2,2 3,3
name: U
cap: A = LU（A 的三列是 [2 1 1]、[4 −6 0]、[−2 7 2]）：L 記下消去時用的倍數，U 是消去完的上三角，圈起來的是主元
```

=== la-systems 4
```fig
flow: ℝⁿ：列空間（r 維）＋ 零空間（n − r 維） -> A 把 x 送過去 -> ℝᵐ：行空間（r 維）＋ 左零空間（m − r 維）*
cap: 四個基本子空間：列空間 ⊥ 零空間，行空間 ⊥ 左零空間；零空間的向量都被送到 0
```

=== la-systems 5
```fig
array
row rank A: 2
row rank B: 3
row rank(AB): ≤2*
cap: rank(AB) ≤ min(rank A, rank B)：乘起來只會「壓扁」，不會變出新的維度
```

=== la-vs 1
```fig
plane
range: -2 3 -1 3
line 0 0.5 good
line 1 0.5 bad
pt (0,0) good "0"
cap: 過原點的直線是子空間（綠）；沒過原點的不是（紅）：不含 0，兩個向量加起來也會跑出去
```

=== la-vs 2
```fig
plane
range: -1 3 -1 2
vec (1,0) "e₁"
vec (0,1) "e₂"
vec (2,1) hl "v = 2e₁ + e₂"
cap: 基底就像座標軸：ℝ² 的每個向量都能「唯一」寫成兩個基底向量的組合
```

=== la-vs 3
```fig
flow: V（3 維） -> 被壓成 0 的：核 ker T（1 維） | 打得到的地方：像 range T（2 維） -> 1 + 2 = 3 = dim V*
cap: rank–nullity：維度不會憑空消失，不是進了核，就是留在像裡
```

=== la-vs 4
```fig
flow: 新座標 [x]β′ -> 乘 P：換回舊座標 -> 乘 [T]β：做 T -> 乘 P⁻¹：換回新座標 -> [Tx]β′*
cap: 換基底：[T]β′ = P⁻¹ [T]β P，從右往左讀
```

=== la-det 1
```fig
array
row 交換兩列: ×(−1)!
row 某一列乘 c: ×c
row 某列加上另一列的倍數: 不變+
cap: 列運算對行列式的影響：只有「加倍數」不改變，所以消去法可以拿來算行列式
```

=== la-det 2
```fig
matrix: A B ; 0 D
pivot: 1,1 2,2
name: M
cap: 分塊上三角：左下那塊是 0 時，det M = det A · det D
```

=== la-det 3
```fig
matrix: a b ; c d
name: A
---
matrix: d −b ; −c a
pivot: 1,1 2,2
name: adj A
cap: 2×2 的伴隨矩陣：對角線互換、另外兩個變號；A⁻¹ = adj A ÷ det A
```

=== la-det 4
```fig
plane
range: -1 4 -1 3
poly (0,0) (2,0) (3,2) (1,2) hl "面積 4"
vec (2,0) "(2, 0)"
vec (1,2) "(1, 2)"
cap: 兩個行向量 (2, 0)、(1, 2) 圍成的平行四邊形：面積 = |det| = 2·2 − 1·0 = 4
```

=== la-eigen 1
```fig
plane
range: -1 3 -1 2
vec (2,0) hl "Ax = 2x"
vec (1,0) "x"
vec (2,1) bad "Ay"
vec (1,1) "y"
cap: A = diag(2, 1)：特徵向量 x 被作用後方向不變、只伸長 2 倍；一般向量 y 會被轉向
```

=== la-eigen 2
```fig
flow: A = P D P⁻¹ -> P：特徵向量排成行 | D：特徵值放在對角線 -> Aᵏ = P Dᵏ P⁻¹（Dᵏ 只要把對角線各自 k 次方）*
cap: 對角化的用處：算很高次方變得很簡單
```

=== la-eigen 3
```fig
bars
bar 第 0 步: 100 100%
bar 第 1 步: 90 90%
bar 第 2 步: 83 83%
bar 第 3 步: 78.1 78.1%
bar 很久以後: 66.7 66.7% *
cap: Markov 矩陣 [[0.9, 0.2], [0.1, 0.8]] 從 (1, 0) 出發：會收斂到特徵值 1 的特徵向量（2/3, 1/3）
```

=== la-eigen 4
```fig
flow: A = [1 2; 3 4] -> p(λ) = λ² − 5λ − 2 -> A² − 5A − 2I = 0 -> A⁻¹ = (A − 5I)/2*
cap: Cayley–Hamilton：矩陣代進自己的特徵多項式會等於 0，所以 A⁻¹ 可以用 A 和 I 表示
```

=== la-eigen 5
```fig
matrix: 2 1 0 ; 0 2 1 ; 0 0 2
pivot: 1,1 2,2 3,3
name: J
cap: 一個 3×3 Jordan 區塊：特徵值 2 重複 3 次，但只有 1 個獨立特徵向量 → 不能對角化
```

=== la-ortho 1
```fig
plane
range: -2 3 -1 3
vec (2,1) hl "u = (2, 1)"
vec (-1,2) "v = (−1, 2)"
cap: u · v = 2·(−1) + 1·2 = 0：內積是 0 就是垂直
```

=== la-ortho 2
```fig
plane
range: -1 3 -1 3
line 0 0.3333
vec (2,2) "b"
vec (2.4,0.8) hl "p"
seg (2,2) (2.4,0.8) dash "e"
cap: b = (2, 2) 投影到方向 a = (3, 1) 的直線：p = (a·b / a·a) a = 0.8 (3, 1)；誤差 e 和直線垂直
```

=== la-ortho 3
```fig
plane
range: -1 3 -2 7 stretch
pt (0,6) (1,0) (2,0)
line 5 -3 hl
seg (0,6) (0,5) dash
seg (1,0) (1,2) dash
seg (2,0) (2,-1) dash
cap: 擬合 (0, 6)、(1, 0)、(2, 0) 的最佳直線 5 − 3t：誤差 1、−2、1，平方和最小
```

=== la-ortho 4
```fig
plane
range: -1.5 1.5 -0.5 1.5
vec (1,0) "e₁"
vec (0,1) "e₂"
vec (0.707,0.707) hl "Qe₁"
vec (-0.707,0.707) hl "Qe₂"
cap: 旋轉 45° 的正交矩陣：長度和夾角都不變（QᵀQ = I），det Q = 1
```

=== la-ortho 5
```fig
plane
range: -1 3 -1 3
vec (2,0) "a₁ = v₁"
vec (1,2) "a₂"
vec (0,2) hl "v₂"
seg (1,2) (0,2) dash
cap: Gram–Schmidt：把 a₂ 在 v₁ 方向的分量（虛線）扣掉，剩下的 v₂ 就和 v₁ 垂直
```

=== la-sym-svd 1
```fig
plane
range: -1 2 -1.5 1.5
vec (1,1) hl "λ = 3"
vec (1,-1) "λ = 1"
cap: 對稱矩陣 [[2, 1], [1, 2]] 的特徵向量互相垂直 → 可以用正交矩陣對角化：A = QΛQᵀ
```

=== la-sym-svd 2
```fig
flow: 判斷對稱矩陣正定 -> 特徵值都 > 0 | 左上角子行列式都 > 0 | 消去的主元都 > 0 | 任何非零 x 都有 xᵀAx > 0 -> 任何一個成立 → 正定*
cap: 四種判法等價，挑最好算的那個
```

=== la-sym-svd 3
```fig
array
row λ₁、λ₂ 同號: 橢圓+
row λ₁、λ₂ 異號: 雙曲線!
row 有一個是 0: 拋物線或平行線
cap: 二次型 xᵀAx = 1 的形狀，看 A 的兩個特徵值（主軸定理）
```

=== la-sym-svd 4
```fig
flow: x -> Vᵀ：轉一下 -> Σ：沿著座標軸伸縮 σᵢ 倍 -> U：再轉一下 -> Ax*
cap: SVD：任何矩陣 A = UΣVᵀ，都可以看成「旋轉 → 伸縮 → 旋轉」
```

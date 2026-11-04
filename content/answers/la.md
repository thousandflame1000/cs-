=== rc:la-systems:1
A 是 m×n，增廣矩陣 [A | b]：
- rank A < rank [A | b] → 無解。
- rank A = rank [A | b] = n → 唯一解。
- rank A = rank [A | b] < n → 無限多解（有 n − rank 個自由變數）。

=== rc:la-systems:2
A 是 n×n，以下全部等價：
1. A 可逆
2. det A ≠ 0
3. rank A = n
4. Ax = 0 只有零解（N(A) = {0}）
5. 每個 b，Ax = b 都恰好一解
6. 各行線性獨立
7. 各行張成 ℝⁿ
8. 各列線性獨立
9. 0 不是特徵值
10. Aᵀ 可逆
11. A 可以列化簡成 I
12. A 是基本矩陣的乘積
13. x ↦ Ax 是一對一（也是映成）

=== rc:la-systems:3
不換列就能消去（左上角的主子式都不是 0）時，A = LU。任何可逆矩陣都有排列矩陣 P 使 PA = LU。
分解一次約 $n^3/3$ 次運算；之後每個新的 b 只要前代 + 後代，$O(n^2)$。

=== rc:la-systems:4
A 是 m×n、rank r：
- 在 ℝⁿ：列空間 C(Aᵀ) 維度 r、零空間 N(A) 維度 n − r，兩者互為正交補。
- 在 ℝᵐ：行空間 C(A) 維度 r、左零空間 N(Aᵀ) 維度 m − r，兩者互為正交補。

=== rc:la-systems:5
- rank(AB) ≤ min(rank A, rank B)。
- rank(A + B) ≤ rank A + rank B。
- rank(AᵀA) = rank(AAᵀ) = rank A，因為 N(AᵀA) = N(A)。

=== rc:la-vs:1
1. 包含零向量。
2. 加法封閉：u、v 在裡面，u + v 也在。
3. 純量乘法封閉：v 在裡面，cv 也在。

=== rc:la-vs:2
- 線性獨立：$c_1v_1+\dots+c_kv_k=0$ 只有係數全部是 0 的解。
- 張成：所有線性組合構成的集合。
- 基底：獨立而且張成整個空間。
- 維度：基底有幾個向量。

在 n 維空間中拿 n 個向量：只要獨立，或只要張成，就一定是基底（兩件事等價）。

=== rc:la-vs:3
dim(U + W) = dim U + dim W − dim(U ∩ W)。（跟排容原理一樣：重疊的部分算了兩次要扣掉。）

=== rc:la-vs:4
T：V → W，dim V = dim(ker T) + dim(im T)（nullity + rank）。
- 一對一 ⇔ ker T = {0}。
- 映成 ⇔ rank = dim W。
- dim V = dim W 時，一對一 ⇔ 映成。

=== rc:la-vs:5
矩陣的第 j 行 = T(第 j 個基底向量)，用目標空間的基底寫出來的座標。
換基底：$[T]_{B'}=P^{-1}[T]_BP$，P 的各行是新基底在舊基底下的座標。換基底前後的矩陣互為相似矩陣。

=== rc:la-det:1
- 交換兩列 → 行列式變號。
- 某一列乘 k → 行列式乘 k。
- 把某列的倍數加到另一列 → 不變。

=== rc:la-det:2
det(AB) = det A · det B；det(Aᵀ) = det A；det(A⁻¹) = 1 / det A；det(cA) = cⁿ det A（n×n）。

=== rc:la-det:3
- $\det\begin{bmatrix}A&B\\0&D\end{bmatrix}=\det A\cdot\det D$（A、D 是方陣）。
- A 可逆時：$\det\begin{bmatrix}A&B\\C&D\end{bmatrix}=\det A\cdot\det(D-CA^{-1}B)$，$D-CA^{-1}B$ 叫 Schur 補數。

=== rc:la-det:4
$$\det\begin{bmatrix}1&x_1&\cdots&x_1^{n-1}\\\vdots&&&\vdots\\1&x_n&\cdots&x_n^{n-1}\end{bmatrix}=\prod_{i<j}(x_j-x_i)$$
所有 $x_i$ 都不同 ⇔ 不是 0，所以過 n 個不同點的多項式插值有唯一解。

=== rc:la-det:5
adj A = 餘因子矩陣的轉置。
- $A\cdot\operatorname{adj}A=\operatorname{adj}A\cdot A=\det(A)\,I$（所以可逆時 $A^{-1}=\operatorname{adj}A/\det A$）。
- $\det(\operatorname{adj}A)=(\det A)^{n-1}$。
- rank(adj A) = n（rank A = n）、1（rank A = n − 1）、0（rank A ≤ n − 2）。

=== rc:la-det:6
A 可逆時，Ax = b 的解是 $x_i=\frac{\det A_i}{\det A}$，$A_i$ 是把 A 的第 i 行換成 b。

=== rc:la-eigen:1
所有特徵值（含重數、含複數）加起來 = 跡（對角線和）；乘起來 = 行列式。

=== rc:la-eigen:2
- 代數重數：特徵多項式裡這個根出現幾次。
- 幾何重數：dim N(A − λI)，也就是這個特徵值有幾個獨立的特徵向量。永遠 1 ≤ 幾何 ≤ 代數。

可對角化 ⇔ 有 n 個獨立的特徵向量 ⇔ 每個特徵值的幾何重數 = 代數重數 ⇔ 最小多項式沒有重根。

=== rc:la-eigen:3
Cayley–Hamilton：p(λ) = det(λI − A)，則 p(A) = 0。
最小多項式 m(x)：讓 m(A) = 0 的最低次首一多項式。它整除特徵多項式，根剛好是所有的特徵值。可對角化 ⇔ m(x) 沒有重根。

=== rc:la-eigen:4
特徵向量都還是 v；特徵值變成：A² → λ²；A⁻¹ → 1/λ；A + cI → λ + c；p(A) → p(λ)。

=== rc:la-eigen:5
AB 和 BA 的非零特徵值完全一樣（含重數）。A 是 m×n、B 是 n×m 時，兩者的特徵多項式只差一個 $\lambda^{|m-n|}$；都是方陣時特徵多項式完全相同。

=== rc:la-eigen:6
對每個特徵值 λ：
- 區塊有幾個 = 幾何重數 dim N(A − λI)。
- 最大區塊多大 = 最小多項式裡 (x − λ) 的次數。
- 區塊大小加起來 = 代數重數。

=== rc:la-ortho:1
- 投影到 a 這個方向：$p=\frac{a^Tb}{a^Ta}a$，$P=\frac{aa^T}{a^Ta}$。
- 投影到 C(A)（A 的行獨立）：$P=A(A^TA)^{-1}A^T$。

性質：$P^2=P$（投影兩次跟一次一樣）、$P^T=P$。

=== rc:la-ortho:2
誤差 $e=b-A\hat x$ 要垂直 A 的每一行：$A^T(b-A\hat x)=0$ ⇒ $A^TA\hat x=A^Tb$。
（也可以把 $\|Ax-b\|^2$ 對 x 微分、令它等於 0。）

=== rc:la-ortho:3
$Q^TQ=I$；保長度（‖Qx‖ = ‖x‖）也保內積；det Q = ±1；特徵值的絕對值都是 1。

=== rc:la-ortho:4
- $q_1=a_1/\|a_1\|$。
- $v_k=a_k-\sum_{i<k}(q_i^Ta_k)\,q_i$（減掉在前面每個方向上的影子），$q_k=v_k/\|v_k\|$。

A = QR：Q 的行是 $q_i$，R 是上三角，$r_{ij}=q_i^Ta_j$。最小平方：解 $R\hat x=Q^Tb$（後代），比正規方程穩定。

=== rc:la-ortho:5
$|u^Tv|\le\|u\|\,\|v\|$，等號成立 ⇔ u、v 平行（線性相依）。

=== rc:la-sym-svd:1
實對稱矩陣 A = QΛQᵀ：特徵值都是實數；不同特徵值的特徵向量互相垂直；一定可以用正交矩陣對角化（就算有重根也可以）。

=== rc:la-sym-svd:2
實對稱 A 正定 ⇔
1. 所有特徵值 > 0
2. 所有左上角主子式 > 0
3. 消去時（不換列）所有樞紐 > 0
4. 所有 x ≠ 0 都有 xᵀAx > 0
5. A = RᵀR，R 的行獨立（例如 Cholesky）

半正定：特徵值 ≥ 0 ⇔ **所有**主子式（不只左上角）≥ 0。

=== rc:la-sym-svd:3
A 對稱，$R(x)=\frac{x^TAx}{x^Tx}$：最大值是 $\lambda_{max}$，最小值是 $\lambda_{min}$，取到的 x 就是對應的特徵向量。

=== rc:la-sym-svd:4
正規矩陣：$AA^*=A^*A$（實數時 $AA^T=A^TA$）。A 能么正對角化（$A=U\Lambda U^*$）⇔ A 是正規矩陣。對稱、反對稱、正交、么正矩陣都是正規的。

=== rc:la-sym-svd:5
A = UΣVᵀ：
- V 的行是 AᵀA 的特徵向量；U 的行是 AAᵀ 的特徵向量。
- $\sigma_i=\sqrt{\text{AᵀA 的特徵值}}$，由大到小排。

rank = 非零奇異值有幾個；$\|A\|_2=\sigma_1$；$\|A\|_F=\sqrt{\sigma_1^2+\dots+\sigma_r^2}$。

=== rc:la-sym-svd:6
Eckart–Young：只保留前 k 個奇異值，$A_k=\sum_{i\le k}\sigma_iu_iv_i^T$，就是 2-範數和 F-範數下最好的 rank-k 近似，誤差 $\|A-A_k\|_2=\sigma_{k+1}$。
偽逆 $A^+=V\Sigma^+U^T$（Σ⁺ 把非零的 σ 取倒數、再轉置）。$x=A^+b$ 是所有最小平方解裡長度最短的那個。

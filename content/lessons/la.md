線性代數以 Strang、Friedberg 與 Leon 為主。台大線代的證明題比例很高：常見「證明或舉反例」（例如兩個可對角化矩陣的和是否可對角化）、「給條件求所有可能的 rank／特徵值」、「判斷二次型正定」。證明時要分清楚「對所有向量成立」與「存在某個向量」；反例要選最小的（2×2）。

=== la-systems
title: 線性系統、消去法、LU 與四個基本子空間
est: 150
labs: gauss
recall:
- Ax = b 無解、唯一解、無限多解的條件，用 rank 寫出來。
- 可逆矩陣定理中至少 10 個等價敘述。
- LU 分解存在的條件；PA = LU；解一個新的 b 要多少運算？
- 四個基本子空間的維度與正交關係。
- rank(AB)、rank(A+B)、rank(AᵀA) 的性質。
feynman: 證明 rank(AᵀA) = rank(A)。推理鏈要先證明 N(AᵀA) = N(A)：一個方向很直接，另一個方向要從 AᵀAx = 0 兩邊乘上 xᵀ 得到 ‖Ax‖² = 0；再用 rank–nullity 定理（兩個矩陣的行數相同）推出 rank 相等。最後說明這個結果為什麼保證 A 的行獨立時 AᵀA 可逆，以及它在最小平方法中的用途。
rubric:
- $N(A)\subseteq N(A^TA)$：$Ax=0$ ⇒ $A^TAx=0$
- $N(A^TA)\subseteq N(A)$：$A^TAx=0$ ⇒ $x^TA^TAx=\|Ax\|^2=0$ ⇒ $Ax=0$（用到實數內積正定）
- 兩者都有 n 行：rank = n − nullity，零空間相同 ⇒ rank 相同
- A 的行獨立 ⇔ rank A = n ⇔ $A^TA$（n×n）滿秩 ⇔ 可逆
- 所以正規方程 $A^TA\hat x=A^Tb$ 有唯一解；複數矩陣要改用 $A^HA$
---
## 1. 解的結構

$A$ 是 $m\times n$，$r=\operatorname{rank}A$。

| 情況 | 條件 |
|---|---|
| 有解 | $\operatorname{rank}A=\operatorname{rank}[A\,|\,b]$（$b\in C(A)$） |
| 唯一解 | 有解且 $r=n$（沒有自由變數） |
| 無限多解 | 有解且 $r<n$ |
| 對所有 $b$ 都有解 | $r=m$（列滿秩） |

完整解 $x=x_p+x_n$，$x_n\in N(A)$。RREF **唯一**；REF 不唯一。

@lab gauss

## 2. 可逆矩陣定理（$n\times n$）

以下等價：$A$ 可逆；$\det A\ne0$；$\operatorname{rank}A=n$；$N(A)=\{0\}$；行向量線性獨立；行向量張成 $\mathbb R^n$；$Ax=b$ 對每個 $b$ 有唯一解；RREF 是 $I$；$A$ 是基本矩陣的乘積；0 不是特徵值；$A^T$ 可逆；線性變換 $x\mapsto Ax$ 是一對一（或映成）。

## 3. LU 分解

不需要列交換時 $A=LU$（$L$ 單位下三角、存消去的乘數；$U$ 上三角）；一般情況 $PA=LU$。對稱時 $A=LDL^T$。

> [!例題] Strang 的例子
> $A=\begin{bmatrix}2&1&1\\4&-6&0\\-2&7&2\end{bmatrix}$
+++ 看解答
$\ell_{21}=2,\ell_{31}=-1$，得第二步 $\begin{bmatrix}2&1&1\\0&-8&-2\\0&8&3\end{bmatrix}$，$\ell_{32}=-1$。
$L=\begin{bmatrix}1&0&0\\2&1&0\\-1&-1&1\end{bmatrix}$，$U=\begin{bmatrix}2&1&1\\0&-8&-2\\0&0&1\end{bmatrix}$，$\det A=2\cdot(-8)\cdot1=-16$。
+++

- 分解成本約 $n^3/3$ 次乘法；之後每個新的 $b$ 只要前代＋後代 $O(n^2)$。
- 主元為 0 就必須換列；所有領先主子式都不為 0 ⇔ 不需換列的 LU 存在（且唯一）。

## 4. 四個基本子空間

| 子空間 | 位於 | 維度 |
|---|---|---|
| 行空間 $C(A)$ | $\mathbb R^m$ | $r$ |
| 零空間 $N(A)$ | $\mathbb R^n$ | $n-r$ |
| 列空間 $C(A^T)$ | $\mathbb R^n$ | $r$ |
| 左零空間 $N(A^T)$ | $\mathbb R^m$ | $m-r$ |

$N(A)\perp C(A^T)$ 且互為正交補；$N(A^T)\perp C(A)$。列運算不改變列空間與零空間，但會改變行空間（pivot 位置不變，所以用原矩陣的 pivot 行當 $C(A)$ 的基底）。

## 5. 秩的性質

- $\operatorname{rank}A=\operatorname{rank}A^T$。
- $\operatorname{rank}(AB)\le\min(\operatorname{rank}A,\operatorname{rank}B)$；左右乘可逆矩陣不改變秩。
- **Sylvester**：$\operatorname{rank}A+\operatorname{rank}B-n\le\operatorname{rank}(AB)$（$A$ 為 $m\times n$、$B$ 為 $n\times p$）。所以 $AB=0$ ⇒ $\operatorname{rank}A+\operatorname{rank}B\le n$。
- $\operatorname{rank}(A+B)\le\operatorname{rank}A+\operatorname{rank}B$。
- $\operatorname{rank}(A^TA)=\operatorname{rank}(AA^T)=\operatorname{rank}A$。
- 秩為 1 ⇔ $A=uv^T$（$u,v\ne0$）。

> [!陷阱] 多選題常見敘述
> - 「$m<n$ 時 $Ax=0$ 一定有非零解」✓；「$m<n$ 時 $Ax=b$ 一定有無限多解」✗（可能無解）。
> - 「列運算不改變行空間」✗。
> - 「$AB$ 可逆則 $A$、$B$ 都可逆」只在方陣時 ✓；$A$ 為 $2\times3$、$B$ 為 $3\times2$ 時 $AB$ 可以可逆但兩者都不是方陣。
> - 「$\operatorname{rank}(A^2)=\operatorname{rank}(A)$」✗（例：$\begin{bmatrix}0&1\\0&0\end{bmatrix}$）。

=== la-vs
title: 向量空間、基底與線性變換
est: 150
recall:
- 子空間判定的三個條件。
- 線性獨立、張成、基底、維度的定義；在 n 維空間中 n 個向量何時就是基底？
- dim(U + W) 的公式。
- Rank–nullity 定理；一對一與映成的判斷。
- 線性變換的矩陣表示；換基底時矩陣怎麼變？
feynman: 證明 rank–nullity 定理：T: V → W 線性、V 有限維，則 dim ker T + dim range T = dim V。推理鏈要從 ker T 的一組基底出發，把它擴充成 V 的基底，然後證明「新增那些基底向量的像」恰好是 range T 的一組基底——要分別證明它們張成 range T、以及它們線性獨立（獨立性的論證要用到它們不在 ker T 的線性組合裡）。
rubric:
- 取 ker T 的基底 $\{u_1..u_k\}$，擴充為 V 的基底 $\{u_1..u_k,v_1..v_r\}$，$k+r=\dim V$
- 張成：任一 $T(x)$，把 x 寫成基底組合，$T(u_i)=0$，所以 $T(x)\in\operatorname{span}\{T(v_j)\}$
- 獨立：若 $\sum c_jT(v_j)=0$，則 $\sum c_jv_j\in\ker T$，可寫成 $\sum d_iu_i$
- 移項得整組基底的線性組合為 0，基底獨立 ⇒ 所有係數為 0，特別是 $c_j=0$
- 所以 $\dim\operatorname{range}T=r=\dim V-k$
---
## 1. 向量空間與子空間

子空間判定：含 0、對加法封閉、對純量乘法封閉（或：對線性組合封閉）。

| 是子空間 | 不是 |
|---|---|
| $Ax=0$ 的解集合 | $Ax=b$（$b\ne0$）的解集合 |
| 對稱矩陣、上三角矩陣、跡為 0 的矩陣 | 可逆矩陣、奇異矩陣 |
| 次數 $\le n$ 的多項式 $P_n$ | 次數恰為 $n$ 的多項式 |
| $\{f: f(0)=0\}$ | $\{f:f(0)=1\}$ |
| 兩子空間的交集、和 $U+W$ | 兩子空間的聯集（除非一個包含另一個） |

## 2. 基底與維度

- $\dim V=n$ 時：$n$ 個獨立向量就是基底；$n$ 個張成 $V$ 的向量就是基底；多於 $n$ 個一定相依；少於 $n$ 個一定不能張成。
- $\dim(U+W)=\dim U+\dim W-\dim(U\cap W)$。直和 $U\oplus W$ ⇔ $U\cap W=\{0\}$。
- 常見維度：$P_n$ 為 $n+1$；$n\times n$ 矩陣 $n^2$；對稱 $\frac{n(n+1)}2$；反對稱 $\frac{n(n-1)}2$；上三角 $\frac{n(n+1)}2$；跡為 0 的 $n^2-1$。

> [!例題] 函數的線性獨立
> $\{1,\cos2x,\cos^2x\}$ 線性獨立嗎？$\{e^x,e^{2x},e^{3x}\}$ 呢？
+++ 看解答
第一組相依：$\cos^2x=\frac12+\frac12\cos2x$。第二組獨立：Wronskian 在 $x=0$ 為 Vandermonde 行列式 $(2-1)(3-1)(3-2)=2\ne0$；或用「不同 $\lambda$ 的 $e^{\lambda x}$ 是微分算子的不同特徵向量」。
+++

## 3. 線性變換

$T(\alpha u+\beta v)=\alpha T(u)+\beta T(v)$，所以 $T(0)=0$。

- $\ker T$、$\operatorname{range}T$ 都是子空間；**rank–nullity**：$\dim\ker T+\dim\operatorname{range}T=\dim V$。
- $T$ 一對一 ⇔ $\ker T=\{0\}$。$\dim V=\dim W$（有限）時，一對一 ⇔ 映成 ⇔ 同構。
- 有限維空間同構 ⇔ 維度相同。$P_n\cong\mathbb R^{n+1}$。

## 4. 矩陣表示與換基底

$[T]_{\beta}^{\gamma}$ 的第 $j$ 行是 $T(\beta_j)$ 在 $\gamma$ 下的座標。合成對應乘積：$[ST]=[S][T]$。

- 換基底：$[T]_{\beta'}=P^{-1}[T]_\beta P$，$P$ 的各行是 $\beta'$ 在 $\beta$ 下的座標。同一個線性變換在不同基底下的矩陣**相似**。
- 相似矩陣有相同的 rank、det、trace、特徵多項式、特徵值、最小多項式（但特徵向量不同）。

> [!例題] 微分算子
> $D:P_3\to P_3$，$D(p)=p'$，基底 $\{1,x,x^2,x^3\}$。
+++ 看解答
$[D]=\begin{bmatrix}0&1&0&0\\0&0&2&0\\0&0&0&3\\0&0&0&0\end{bmatrix}$。$\ker D$ = 常數（維度 1），range = $P_2$（維度 3），$1+3=4$ ✓。$D^4=0$（冪零），唯一特徵值 0，幾何重數 1，**不可對角化**。
+++

> [!陷阱] 多選題常見敘述
> - 「$\mathbb R^2$ 是 $\mathbb R^3$ 的子空間」✗（不是子集合）；$\{(x,y,0)\}$ 才是。
> - 「若 $\{v_1,v_2,v_3\}$ 兩兩獨立，則三者獨立」✗。
> - 「$T:\mathbb R^3\to\mathbb R^2$ 可以是一對一」✗。
> - 「零向量可以出現在基底中」✗。

=== la-det
title: 行列式
est: 120
labs: lintrans
recall:
- 三種列運算對行列式的影響。
- det(AB)、det(Aᵀ)、det(A⁻¹)、det(cA) 的公式。
- 分塊矩陣的行列式（上三角分塊、Schur 補數）。
- Vandermonde 行列式。
- adj A 的定義與性質：A·adj A、det(adj A)、rank(adj A)。
- Cramer 法則。
feynman: 解釋為什麼 det(AB) = det(A)·det(B)，以及為什麼 A 可逆 ⇔ det A ≠ 0。推理鏈要從基本矩陣出發：每一種列運算對應左乘一個基本矩陣 E，且 det(EB) = det(E)det(B)；A 可逆時寫成基本矩陣的乘積；A 不可逆時說明 AB 也不可逆、兩邊都是 0。最後給出幾何解釋（體積縮放倍率的合成）。
rubric:
- 三種基本矩陣：交換（det = −1）、倍乘 c（det = c）、列取代（det = 1），且 $\det(EB)=\det E\det B$
- A 可逆 ⇔ RREF 為 I ⇔ A 是基本矩陣乘積；消去過程中每步 det 乘上非零數，所以 det A ≠ 0；反之 RREF 有零列則 det = 0
- A 可逆時 $A=E_1\cdots E_k$，反覆使用上式得 $\det(AB)=\det A\det B$
- A 不可逆時 rank(AB) ≤ rank A < n，AB 不可逆，兩邊都是 0
- 幾何：|det| 是體積縮放倍率，先做 B 再做 A 的倍率相乘
---
## 1. 性質

- 列交換：變號；某列乘 $c$：乘 $c$；某列加上另一列的倍數：不變。
- $\det(AB)=\det A\det B$；$\det A^T=\det A$；$\det A^{-1}=1/\det A$；$\det(cA)=c^n\det A$。
- 三角矩陣：對角線乘積。**$\det(A+B)\ne\det A+\det B$**。
- 正交矩陣 $\det=\pm1$；冪零矩陣 $\det=0$；$\det A=\prod\lambda_i$。
- 奇數階反對稱矩陣：$\det A=\det A^T=\det(-A)=(-1)^n\det A$ ⇒ $\det A=0$。

## 2. 計算技巧

- 分塊上三角：$\det\begin{bmatrix}A&B\\0&D\end{bmatrix}=\det A\det D$。
- Schur 補數（$A$ 可逆）：$\det\begin{bmatrix}A&B\\C&D\end{bmatrix}=\det A\cdot\det(D-CA^{-1}B)$。
- **Vandermonde**：$\det\begin{bmatrix}1&x_1&\cdots&x_1^{n-1}\\\vdots&&&\vdots\\1&x_n&\cdots&x_n^{n-1}\end{bmatrix}=\prod_{i<j}(x_j-x_i)$。
- 對角線 $a$、其餘 $b$ 的 $n\times n$ 矩陣：$(a-b)^{n-1}(a+(n-1)b)$。
- 三對角（對角 2、上下 −1）：$D_n=2D_{n-1}-D_{n-2}$，$D_n=n+1$。
- 偶數項的 Leibniz 公式有 $n!$ 項，實際計算用消去 $O(n^3)$。

> [!例題] 計算
> $\det\begin{bmatrix}1&1&1&1\\1&2&4&8\\1&3&9&27\\1&4&16&64\end{bmatrix}$
+++ 看解答
Vandermonde，$x=1,2,3,4$：$(2-1)(3-1)(4-1)(3-2)(4-2)(4-3)=1\cdot2\cdot3\cdot1\cdot2\cdot1=12$。
+++

## 3. 伴隨矩陣與 Cramer

$\operatorname{adj}A$ 的 $(i,j)$ 元是 $C_{ji}$（餘因子的**轉置**）。

- $A\cdot\operatorname{adj}A=\operatorname{adj}A\cdot A=(\det A)I$；可逆時 $A^{-1}=\frac{\operatorname{adj}A}{\det A}$。
- $\det(\operatorname{adj}A)=(\det A)^{n-1}$；$\operatorname{adj}(\operatorname{adj}A)=(\det A)^{n-2}A$（$n\ge2$）。
- $\operatorname{rank}(\operatorname{adj}A)=n$（若 $\operatorname{rank}A=n$）、$1$（若 $=n-1$）、$0$（若 $\le n-2$）。
- **Cramer**：$x_i=\frac{\det A_i}{\det A}$，$A_i$ 是把第 $i$ 行換成 $b$。理論工具，計算上很慢。

## 4. 幾何意義

$|\det A|$＝單位立方體經 $A$ 變換後的體積；正負號代表方向是否翻轉。平行四邊形（三角形）面積可以用 $2\times2$ 行列式（再除以 2）。

@lab lintrans

> [!陷阱] 多選題常見敘述
> - 「$\det(-A)=-\det A$」✗，是 $(-1)^n\det A$。
> - 「行列式為 1 的矩陣是正交矩陣」✗。
> - 「相似矩陣行列式相同」✓；「行列式相同的矩陣相似」✗。
> - 「$\det(A^TA)\ge0$」✓（$=(\det A)^2$）。

=== la-eigen
title: 特徵值、對角化、Cayley–Hamilton 與 Jordan 形式
est: 170
labs: lintrans
recall:
- 特徵值的和與積分別等於什麼？
- 代數重數與幾何重數；可對角化的充要條件（至少三種說法）。
- Cayley–Hamilton 定理；最小多項式與可對角化的關係。
- 若 Av = λv，A²、A⁻¹、A + cI、p(A) 的特徵值？
- AB 與 BA 的特徵值關係。
- Jordan 形式中區塊的個數與最大區塊大小由什麼決定？
feynman: 證明「屬於相異特徵值的特徵向量線性獨立」，並由此推出「n×n 矩陣有 n 個相異特徵值就可對角化」。推理鏈用最小反例（或歸納）：假設 v_1..v_k 相依且 k 是最小的，寫出線性組合，分別乘上 A 與乘上 λ_k 相減，得到更短的非平凡組合，矛盾。最後說明反過來不成立（舉 I 為例），以及重根時要檢查什麼。
rubric:
- 設 $v_1..v_k$ 對應相異特徵值，取最小的 k 使 $\sum c_iv_i=0$ 有非平凡解（所有 $c_i\ne0$）
- 兩邊乘 A：$\sum c_i\lambda_iv_i=0$；原式乘 $\lambda_k$：$\sum c_i\lambda_kv_i=0$
- 相減：$\sum_{i<k}c_i(\lambda_i-\lambda_k)v_i=0$，係數不全為 0（$\lambda_i\ne\lambda_k$），是更短的相依關係，矛盾
- n 個相異特徵值 ⇒ n 個獨立特徵向量 ⇒ 以它們為行的 P 可逆，$A=PDP^{-1}$
- 反之不成立：I 只有特徵值 1 卻可對角化；重根時要檢查幾何重數是否等於代數重數
---
## 1. 基本性質

- $\det(A-\lambda I)=0$；$\operatorname{tr}A=\sum\lambda_i$，$\det A=\prod\lambda_i$（含重數、含複數）。
- 三角矩陣的特徵值是對角線元素。$A$ 與 $A^T$ 特徵值相同（特徵向量不同）。
- $Av=\lambda v$ ⇒ $A^kv=\lambda^kv$、$A^{-1}v=\lambda^{-1}v$、$(A+cI)v=(\lambda+c)v$、$p(A)v=p(\lambda)v$。
- 列運算**會**改變特徵值。$A+B$ 的特徵值一般**不是**特徵值相加（除非可同時對角化）。
- $AB$ 與 $BA$ 有相同的非零特徵值（含重數）；$\operatorname{tr}(AB)=\operatorname{tr}(BA)$。
- 秩一矩陣 $uv^T$：特徵值 $v^Tu$ 與 $n-1$ 個 0。
- 實矩陣的複特徵值成共軛對。

## 2. 對角化

$A=PDP^{-1}$，$P$ 的行是特徵向量。以下等價：
1. $A$ 可對角化；
2. 有 $n$ 個獨立特徵向量；
3. 每個特徵值的幾何重數 $=\dim N(A-\lambda I)$ 等於代數重數；
4. 最小多項式沒有重根（分解成相異一次因式）。

充分條件：$n$ 個相異特徵值；實對稱矩陣。

> [!例題] 判斷可對角化
> $A=\begin{bmatrix}2&1&0\\0&2&0\\0&0&3\end{bmatrix}$、$B=\begin{bmatrix}2&0&0\\0&2&0\\0&0&3\end{bmatrix}$。
+++ 看解答
兩者特徵值都是 2, 2, 3。$A-2I$ 的 rank 是 2，幾何重數 $3-2=1<2$，不可對角化；$B$ 本身就是對角矩陣。特徵多項式相同但不相似（最小多項式 $(x-2)^2(x-3)$ vs $(x-2)(x-3)$）。
+++

## 3. 應用：冪次與遞迴

$A^k=PD^kP^{-1}$。Fibonacci：$\begin{bmatrix}F_{k+1}\\F_k\end{bmatrix}=\begin{bmatrix}1&1\\1&0\end{bmatrix}^k\begin{bmatrix}1\\0\end{bmatrix}$，特徵值 $\frac{1\pm\sqrt5}2$。

**Markov 矩陣**（每行和為 1、元素非負）：一定有特徵值 1，其餘 $|\lambda|\le1$；若元素都為正，穩態向量是 $\lambda=1$ 的特徵向量（正規化成和為 1）。

微分方程 $u'=Au$：$u(t)=e^{At}u(0)=Pe^{Dt}P^{-1}u(0)$；所有 $\operatorname{Re}\lambda<0$ 時穩定。

## 4. Cayley–Hamilton 與最小多項式

**Cayley–Hamilton**：$p_A(A)=0$。用途：把 $A^{-1}$、$A^k$ 寫成 $I,A,\dots,A^{n-1}$ 的組合。

> [!例題] $A=\begin{bmatrix}1&2\\3&4\end{bmatrix}$，用 C-H 求 $A^{-1}$
+++ 看解答
$p(\lambda)=\lambda^2-5\lambda-2$，所以 $A^2-5A-2I=0$ ⇒ $A(A-5I)=2I$ ⇒ $A^{-1}=\frac12(A-5I)=\begin{bmatrix}-2&1\\1.5&-0.5\end{bmatrix}$。
+++

最小多項式 $m_A$：使 $m(A)=0$ 的最低次首一多項式；整除特徵多項式，且與特徵多項式有相同的根。

## 5. Jordan 形式

每個方陣（在 $\mathbb C$ 上）相似於 Jordan 形式，對每個特徵值 $\lambda$：
- Jordan 區塊個數＝幾何重數；
- 區塊大小總和＝代數重數；
- 最大區塊大小＝$\lambda$ 在最小多項式中的次方。

> [!例題] Jordan 形式的可能性
> $4\times4$，特徵多項式 $(x-2)^4$，最小多項式 $(x-2)^2$。可能的 Jordan 形式？
+++ 看解答
最大區塊大小 2，總大小 4：$J_2\oplus J_2$ 或 $J_2\oplus J_1\oplus J_1$。若再給幾何重數 2，則只能是 $J_2\oplus J_2$；幾何重數 3 則是 $J_2\oplus J_1\oplus J_1$。
+++

> [!陷阱] 多選題常見敘述
> - 「可逆 ⇔ 可對角化」✗（兩者無關：$\begin{bmatrix}1&1\\0&1\end{bmatrix}$ 可逆不可對角化；$\begin{bmatrix}0&0\\0&1\end{bmatrix}$ 不可逆可對角化）。
> - 「兩個可對角化矩陣的和可對角化」✗；乘積也不一定。
> - 「$A^2=A$ 的矩陣可對角化」✓（最小多項式整除 $x(x-1)$，無重根）。
> - 「$A^2=0$ 且 $A\ne0$ 的矩陣不可對角化」✓。
> - 「相似矩陣有相同的特徵向量」✗。

=== la-ortho
title: 正交、投影、最小平方與 Gram–Schmidt
est: 140
recall:
- 投影到直線、投影到子空間的公式；投影矩陣的兩個性質。
- 正規方程怎麼推出來？
- 正交矩陣的性質（長度、行列式、特徵值）。
- Gram–Schmidt 的步驟；QR 分解；用 QR 解最小平方。
- Cauchy–Schwarz 不等式。
feynman: 從幾何推導最小平方的正規方程 AᵀA x̂ = Aᵀb：要說明為什麼最佳的 Ax̂ 是 b 在 C(A) 上的投影、為什麼誤差 e = b − Ax̂ 必須與 A 的每一行正交、如何把「與每一行正交」寫成 Aᵀe = 0，最後得到投影矩陣 P = A(AᵀA)⁻¹Aᵀ 並驗證 P² = P。
rubric:
- 要找 C(A) 中離 b 最近的點；最近點是正交投影（畢氏定理：其他點的距離平方多了一個非負項）
- 誤差 $e=b-A\hat x$ 必須垂直於 C(A)，即垂直於 A 的每一行
- 與每一行正交 ⇔ $A^Te=0$ ⇔ $A^TA\hat x=A^Tb$
- A 的行獨立時 $A^TA$ 可逆，$\hat x=(A^TA)^{-1}A^Tb$，$p=A\hat x=Pb$
- $P^2=A(A^TA)^{-1}A^TA(A^TA)^{-1}A^T=P$，且 $P^T=P$
---
## 1. 內積與正交

- Cauchy–Schwarz：$|u\cdot v|\le\|u\|\|v\|$；三角不等式。
- $S^\perp$ 是子空間；$(S^\perp)^\perp=\operatorname{span}S$（有限維）；$\dim S+\dim S^\perp=n$。
- 一般內積空間：$\langle f,g\rangle=\int_a^bf(x)g(x)\,dx$；正交多項式（Legendre）。

## 2. 投影

| 投影到 | 投影向量 | 投影矩陣 |
|---|---|---|
| 直線（方向 $a$） | $\frac{a^Tb}{a^Ta}a$ | $\frac{aa^T}{a^Ta}$（秩 1） |
| $C(A)$（$A$ 行獨立） | $A(A^TA)^{-1}A^Tb$ | $P=A(A^TA)^{-1}A^T$ |
| 正交單位基底 $Q$ | $QQ^Tb$ | $QQ^T$ |

投影矩陣：$P^2=P$、$P^T=P$；特徵值只有 0 與 1；$\operatorname{tr}P=\operatorname{rank}P$；$I-P$ 投影到正交補。

## 3. 最小平方

$A\hat x$ 是 $b$ 在 $C(A)$ 上的投影：$A^TA\hat x=A^Tb$。

> [!例題] 用直線 $C+Dt$ 擬合 $(0,6),(1,0),(2,0)$
+++ 看解答
$A=\begin{bmatrix}1&0\\1&1\\1&2\end{bmatrix}$，$A^TA=\begin{bmatrix}3&3\\3&5\end{bmatrix}$，$A^Tb=\begin{bmatrix}6\\0\end{bmatrix}$。解得 $C=5,D=-3$，直線 $5-3t$。誤差 $e=(1,-2,1)$，與 $A$ 的兩行都正交 ✓，$\|e\|^2=6$。
+++

## 4. 正交矩陣

$Q^TQ=I$（方陣時 $Q^{-1}=Q^T$）。保長度、保內積；$\det Q=\pm1$；特徵值 $|\lambda|=1$。旋轉（det 1）與反射（det −1）。

## 5. Gram–Schmidt 與 QR

$v_k=a_k-\sum_{j<k}\frac{v_j^Ta_k}{v_j^Tv_j}v_j$，再正規化。結果 $A=QR$，$R$ 上三角、對角線為正。

> [!例題] Strang 的例子
> $a=(1,-1,0)$、$b=(2,0,-2)$、$c=(3,-3,3)$
+++ 看解答
$A=a$；$B=b-\frac{2}{2}a=(1,1,-2)$；$C=c-\frac{6}{2}a-\frac{-6}{6}B=(3,-3,3)-(3,-3,0)+(1,1,-2)=(1,1,1)$。三者兩兩正交，再各自除以長度 $\sqrt2,\sqrt6,\sqrt3$。
+++

最小平方用 QR：$R\hat x=Q^Tb$（數值上比正規方程穩定，條件數不平方）。

> [!陷阱] 多選題常見敘述
> - 「投影矩陣一定可逆」✗（除非是 $I$）。
> - 「正交矩陣的行兩兩正交，所以 $QQ^T=I$ 對非方陣也成立」✗：$m\times n$（$m>n$）時只有 $Q^TQ=I$。
> - 「任意兩個子空間 $U\perp W$ 則 $W=U^\perp$」✗。
> - 「最小平方解一定唯一」✗：$A$ 的行相依時有無限多解（取最小範數解要用偽逆）。

=== la-sym-svd
title: 對稱矩陣、正定性、二次型與 SVD
est: 160
recall:
- 譜定理的內容；實對稱矩陣的特徵值與特徵向量有什麼保證？
- 正定的五種等價判別；半正定要檢查哪些子式？
- Rayleigh 商的最大、最小值。
- 正規矩陣的定義與可么正對角化。
- SVD 中 U、Σ、V 各從哪裡來？rank、2-範數、Frobenius 範數與奇異值的關係。
- Eckart–Young 定理；偽逆。
feynman: 證明實對稱矩陣 (1) 的特徵值都是實數，(2) 不同特徵值的特徵向量互相正交。推理鏈：(1) 從 Ax = λx（x 可能是複數）出發，左乘共軛轉置得到 x̄ᵀAx = λ‖x‖²，再取共軛轉置並用 A 實對稱推出 λ = λ̄；(2) 對 Ax = λx、Ay = μy，把 xᵀAy 用兩種方式計算，得到 (λ − μ)xᵀy = 0。最後說明重根時為什麼仍能找到正交的特徵向量（譜定理），不必證完。
rubric:
- (1) $Ax=\lambda x$ ⇒ $\bar x^TAx=\lambda\bar x^Tx=\lambda\|x\|^2$
- 取共軛轉置：$\overline{\bar x^TAx}^{\,T}=\bar x^T\bar A^Tx=\bar x^TAx$（A 實對稱），所以 $\bar x^TAx$ 是實數，$\lambda$ 是實數
- (2) $x^TAy=x^T(\mu y)=\mu x^Ty$；又 $x^TAy=(A^Tx)^Ty=(Ax)^Ty=\lambda x^Ty$
- 相減 $(\lambda-\mu)x^Ty=0$，$\lambda\ne\mu$ ⇒ $x^Ty=0$
- 重根時：譜定理保證（Schur 分解 $A=QTQ^T$，T 對稱且上三角 ⇒ 對角），每個特徵空間內可用 Gram–Schmidt 取正交基底
---
## 1. 譜定理

實對稱 $A=A^T$：特徵值皆為實數，可取正交單位特徵向量，$A=Q\Lambda Q^T=\sum\lambda_iq_iq_i^T$（譜分解）。

- 推廣：Hermitian（$A=A^H$）→ 實特徵值、么正對角化。
- **正規矩陣** $AA^H=A^HA$ ⇔ 可么正對角化（包含對稱、反對稱、正交、Hermitian、么正矩陣）。

## 2. 正定

對稱 $A$，下列等價（正定）：
1. 所有特徵值 $>0$；
2. 所有**領先主子式** $>0$（Sylvester）；
3. 消去的所有主元 $>0$；
4. $x^TAx>0$，$\forall x\ne0$；
5. $A=R^TR$，$R$ 的行獨立（Cholesky：$A=LL^T$）。

> [!陷阱] 半正定的判別
> 半正定**不能**只看領先主子式 $\ge0$，要看**所有**主子式。反例：$\begin{bmatrix}0&0\\0&-1\end{bmatrix}$ 的領先主子式是 0、0，但它不是半正定。

> [!例題] 何時正定
> $A=\begin{bmatrix}2&-1&b\\-1&2&-1\\b&-1&2\end{bmatrix}$，$b$ 的範圍？
+++ 看解答
領先主子式：$2>0$；$3>0$；$\det A=2(4-1)+1(-2+b)+b(1-2b)=-2b^2+2b+4=-2(b-2)(b+1)>0$ ⇔ $-1<b<2$。
+++

- 正定矩陣：對角元 $>0$、可逆、$A^{-1}$ 也正定、$A+B$ 正定（若 $B$ 正定或半正定）。
- $A^TA$ 永遠半正定；$A$ 的行獨立時正定。

## 3. 二次型

$q(x)=x^TAx$，用 $x=Qy$ 化成 $\sum\lambda_iy_i^2$（主軸定理）。二維：$\lambda_1,\lambda_2$ 同號 → 橢圓；異號 → 雙曲線；一個為 0 → 拋物線／平行直線。

**Rayleigh 商** $R(x)=\frac{x^TAx}{x^Tx}$：最大值 $\lambda_{\max}$、最小值 $\lambda_{\min}$，在對應特徵向量取得。

## 4. SVD

任何 $m\times n$ 矩陣 $A=U\Sigma V^T$：
- $V$ 的行是 $A^TA$ 的正交單位特徵向量；$\sigma_i=\sqrt{\lambda_i(A^TA)}$；$u_i=\frac{Av_i}{\sigma_i}$（$U$ 的行是 $AA^T$ 的特徵向量）。
- $\operatorname{rank}A$＝非零奇異值個數。$\|A\|_2=\sigma_1$；$\|A\|_F^2=\sum\sigma_i^2$；方陣 $|\det A|=\prod\sigma_i$。
- 前 $r$ 個 $v$ 是 $C(A^T)$ 的基底、其餘是 $N(A)$；前 $r$ 個 $u$ 是 $C(A)$ 的基底、其餘是 $N(A^T)$。
- **Eckart–Young**：$A_k=\sum_{i\le k}\sigma_iu_iv_i^T$ 是最佳秩 $k$ 近似，$\|A-A_k\|_2=\sigma_{k+1}$。
- **偽逆** $A^+=V\Sigma^+U^T$；$x^+=A^+b$ 是最小平方解中範數最小的。
- 條件數 $\kappa=\sigma_{\max}/\sigma_{\min}$。
- 對稱正定矩陣的 SVD 就是它的特徵分解；一般對稱矩陣 $\sigma_i=|\lambda_i|$。

> [!例題] $A=\begin{bmatrix}3&0\\4&5\end{bmatrix}$ 的奇異值
+++ 看解答
$A^TA=\begin{bmatrix}25&20\\20&25\end{bmatrix}$，特徵值 45、5，$\sigma_1=3\sqrt5,\sigma_2=\sqrt5$。驗算 $\sigma_1\sigma_2=15=|\det A|$。注意 $A$ 的特徵值是 3、5，和奇異值不同。
+++

> [!陷阱] 多選題常見敘述
> - 「奇異值就是特徵值的絕對值」✗（只對正規矩陣成立）。
> - 「正定矩陣的所有元素都是正的」✗。
> - 「實矩陣的特徵值都是實數」✗（旋轉矩陣）。
> - 「$A^TA$ 與 $AA^T$ 有相同的特徵值」：非零特徵值相同 ✓，0 的個數可能不同。

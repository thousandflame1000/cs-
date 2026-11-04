=== la-systems
【題目】
$A=\begin{bmatrix}1&2&1\\2&4&3\\3&6&4\end{bmatrix}$。求 rank、零空間的基底，以及四個基本子空間的維度。

【步驟】消去
第 2 列 − 2×第 1 列 → (0, 0, 1)；第 3 列 − 3×第 1 列 → (0, 0, 1)；第 3 列 − 第 2 列 → (0, 0, 0)。再用第 2 列把第 1 列的第 3 個數消掉。

```fig
matrix
matrix: 1 2 0 ; 0 0 1 ; 0 0 0
pivot: 1,1 2,3
free: 2
name: R
cap: 樞紐在第 1、3 欄；第 2 欄沒有樞紐，是自由變數
```

【步驟】rank
2 個樞紐 → rank = 2。

【步驟】零空間：自由變數設成 1
令 $x_2=t$。第 2 列：$x_3=0$；第 1 列：$x_1+2x_2=0$ → $x_1=-2t$。
基底：$(-2,1,0)$。驗算：$-2\cdot(1,2,3)+1\cdot(2,4,6)=0$ ✓（第 2 欄本來就是第 1 欄的 2 倍）。

【步驟】四個子空間（$m=n=3$，$r=2$）
- 行空間 $C(A)$：$r=2$（第 1、3 欄）
- 零空間 $N(A)$：$n-r=1$
- 列空間 $C(A^T)$：$r=2$
- 左零空間 $N(A^T)$：$m-r=1$，基底 $(-1,-1,1)$（第 3 列 = 第 1 列 + 第 2 列）

【答案】
rank 2；$N(A)$ 基底 $(-2,1,0)$；維度依序 2、1、2、1。

【常錯】
- 拿 R 的欄當行空間基底：要拿**原本 A** 中樞紐所在的欄。
- 零空間解出來沒驗算：直接乘回 A 看是不是 0。
- 維度關係：$\dim C(A)+\dim N(A)=n$（欄數），不是 $m$。

=== la-vs
【題目】
$T:P_2\to P_2$，$T(p)=p'$（微分）。用基底 $\{1,x,x^2\}$ 寫出 T 的矩陣，求 rank 和 nullity，並用矩陣算 $3+5x+4x^2$ 的微分。

【步驟】把每個基底丟進 T
$T(1)=0$、$T(x)=1$、$T(x^2)=2x$。

【步驟】寫成座標，當成矩陣的「欄」
$T(1)=(0,0,0)$、$T(x)=(1,0,0)$、$T(x^2)=(0,2,0)$。

```fig
matrix
matrix: 0 1 0 ; 0 0 2 ; 0 0 0
pivot: 1,2 2,3
name: [T]
cap: 第 j 欄 = 第 j 個基底的像的座標
```

【步驟】rank、nullity
2 個樞紐 → rank 2（像空間是 $\{a+bx\}$）。nullity $3-2=1$（核是常數多項式）。$2+1=3$ ✓。

【步驟】用矩陣算
$3+5x+4x^2$ 的座標 $(3,5,4)$，乘上矩陣得 $(5,8,0)$ → $5+8x$。直接微分也是 $5+8x$ ✓。

【答案】
$[T]=\begin{bmatrix}0&1&0\\0&0&2\\0&0&0\end{bmatrix}$，rank 2、nullity 1；結果 $5+8x$。

【常錯】
- 把像的座標寫成「列」：要寫成**欄**，不然乘出來是轉置。
- 換了基底順序（例如 $\{x^2,x,1\}$），矩陣也跟著變。
- $T^3=0$（微分三次一定是 0），所以唯一的特徵值是 0、不能對角化。

=== la-det
【題目】
$A$、$B$ 都是 $3\times3$，$\det A=3$、$\det B=-2$。求 $\det(2A^{-1}B^{T})$。

【步驟】拆成三塊
$\det(2A^{-1}B^T)=\det(2I)\cdot\det(A^{-1})\cdot\det(B^T)$，因為行列式可以「乘開」。

【步驟】一塊一塊算
- 整個矩陣乘 2：每一列都乘 2，3 列 → $2^3=8$。
- $\det(A^{-1})=1/\det A=1/3$。
- $\det(B^T)=\det B=-2$。

```fig
flow
flow: det(2M) -> 2 × 2 × 2 × det M* -> 3 列各乘一次 2
cap: 純量乘整個矩陣：要乘「列數」次方
```

【步驟】乘起來
$8\times\frac13\times(-2)=-\frac{16}3$。

【答案】
$-16/3$。

【常錯】
- $\det(2M)=2\det M$ ✗：是 $2^n\det M$。
- $\det(A+B)=\det A+\det B$ ✗：行列式只對乘法友善。
- 列運算：交換兩列變號、某列乘 $c$ 要乘 $c$、某列加另一列的倍數不變。

=== la-eigen
【題目】
$A=\begin{bmatrix}4&1\\2&3\end{bmatrix}$。對角化 $A$，並求 $A^n$ 的公式，用 $n=3$ 驗算。

【步驟】特徵值
$\det(A-\lambda I)=(4-\lambda)(3-\lambda)-2$
$\qquad=\lambda^2-7\lambda+10=(\lambda-5)(\lambda-2)$
驗算：$5+2=7=$ 對角線和，$5\times2=10=\det A$ ✓。

【步驟】特徵向量
- $\lambda=5$：$A-5I=\begin{bmatrix}-1&1\\2&-2\end{bmatrix}$ → $(1,1)$。
- $\lambda=2$：$A-2I=\begin{bmatrix}2&1\\2&1\end{bmatrix}$ → $(1,-2)$。

```fig
plane
range: -1 3 -3 3
vec (1,1) hl "λ=5"
vec (1,-2) "λ=2"
cap: 沿這兩個方向，A 只會把向量拉長 5 倍或 2 倍，不會轉向
```

【步驟】$A=PDP^{-1}$
$P=\begin{bmatrix}1&1\\1&-2\end{bmatrix}$，$D=\begin{bmatrix}5&0\\0&2\end{bmatrix}$，$P^{-1}=\frac13\begin{bmatrix}2&1\\1&-1\end{bmatrix}$。

【步驟】$A^n=PD^nP^{-1}$
$A^n=\frac13\begin{bmatrix}2\cdot5^n+2^n&5^n-2^n\\2\cdot5^n-2\cdot2^n&5^n+2\cdot2^n\end{bmatrix}$。
$n=3$：$\frac13\begin{bmatrix}258&117\\234&141\end{bmatrix}=\begin{bmatrix}86&39\\78&47\end{bmatrix}$，跟直接乘的結果一樣 ✓。

【答案】
特徵值 5、2；$A^n$ 如上，$A^3=\begin{bmatrix}86&39\\78&47\end{bmatrix}$。

【常錯】
- $P$ 的欄跟 $D$ 的順序沒對齊：第 1 欄的特徵向量要對應 $D$ 的第 1 個特徵值。
- 寫成 $P^{-1}DP$：$A=PDP^{-1}$，$P$ 的欄是特徵向量。
- 特徵值相異 ⇒ 一定可對角化；有重根時要看特徵向量夠不夠。

=== la-ortho
【題目】
用最小平方法，找最接近 (0, 1)、(1, 3)、(2, 4) 三點的直線 $y=c+dx$。

【步驟】寫成 $A\mathbf{x}=\mathbf{b}$（解不出來）
$\begin{bmatrix}1&0\\1&1\\1&2\end{bmatrix}\begin{bmatrix}c\\d\end{bmatrix}=\begin{bmatrix}1\\3\\4\end{bmatrix}$：3 個方程式、2 個未知數，沒有一條線剛好過三點。

【步驟】正規方程 $A^TA\hat{\mathbf x}=A^T\mathbf b$
$A^TA=\begin{bmatrix}3&3\\3&5\end{bmatrix}$，$A^T\mathbf b=\begin{bmatrix}8\\11\end{bmatrix}$。

【步驟】解
$3c+3d=8$、$3c+5d=11$ → 相減 $2d=3$，$d=1.5$；$c=7/6$。

```fig
plane
range: -1 3 -1 5
pt (0,1)
pt (1,3)
pt (2,4)
line 1.1667 1.5 hl
seg (0,1) (0,1.1667) dash
seg (1,3) (1,2.6667) dash
seg (2,4) (2,4.1667) dash
cap: 虛線是誤差；最小平方讓誤差的平方和最小
```

【步驟】驗算：誤差要跟 A 的每一欄垂直
誤差 $\mathbf e=(1-\tfrac76,\ 3-\tfrac83,\ 4-\tfrac{25}6)=(-\tfrac16,\tfrac13,-\tfrac16)$。
跟 $(1,1,1)$ 內積 0 ✓；跟 $(0,1,2)$ 內積 $\tfrac13-\tfrac13=0$ ✓。

【答案】
$y=\frac76+\frac32x$。

【常錯】
- 直接對 $A$ 求反矩陣：$A$ 不是方陣。
- 正規方程寫成 $AA^T$：是 $A^TA$（$2\times2$）。
- 誤差和為 0 只是巧合嗎？不是：只要模型有常數項 $c$，誤差和一定是 0。

=== la-sym-svd
【題目】
$K=\begin{bmatrix}2&-1&0\\-1&2&-1\\0&-1&2\end{bmatrix}$。判斷 $K$ 是否正定，用兩種方法。

【步驟】方法一：左上角的子行列式
$\det[2]=2$；$\det\begin{bmatrix}2&-1\\-1&2\end{bmatrix}=3$；$\det K=4$。三個都 $>0$ → 正定。

```fig
bars
bar 1×1: 2 2
bar 2×2: 3 3
bar 3×3: 4 4*
cap: 左上角 1×1、2×2、3×3 的行列式全部大於 0
```

【步驟】方法二：寫成平方和
$\mathbf x^TK\mathbf x=2x_1^2+2x_2^2+2x_3^2-2x_1x_2-2x_2x_3$
$=x_1^2+(x_1-x_2)^2+(x_2-x_3)^2+x_3^2$。
四個平方加起來 ≥ 0；要等於 0 必須 $x_1=0$、$x_1=x_2$、$x_2=x_3$、$x_3=0$，也就是 $\mathbf x=\mathbf 0$。所以正定。

【步驟】（附帶）特徵值
$2-\sqrt2\approx0.59$、$2$、$2+\sqrt2\approx3.41$，全部 $>0$，一致。

【答案】
正定。

【常錯】
- 只看對角線都正就說正定：$\begin{bmatrix}1&2\\2&1\end{bmatrix}$ 對角線正，但 $\det=-3$，不是正定。
- 用「任意」主子式：判斷**正定**看左上角的就好；判斷**半正定**要看全部主子式。
- 非對稱矩陣不談正定（先取 $(M+M^T)/2$）。

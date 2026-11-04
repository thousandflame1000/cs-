=== rc:dm-logic:1
$p\to q\equiv\neg p\lor q\equiv\neg q\to\neg p$。
- 逆（$q\to p$）：不等價。
- 否（$\neg p\to\neg q$）：不等價。
- 逆否（$\neg q\to\neg p$）：等價。

另外，逆和否彼此等價。

=== rc:dm-logic:2
$\exists y\forall x\,P\Rightarrow\forall x\exists y\,P$：有一個 y 對所有 x 都成立，那每個 x 當然都找得到 y。反過來不成立。例：「每個人都有媽媽」對，「有一個人是所有人的媽媽」錯。

=== rc:dm-logic:3
{¬, ∧}、{¬, ∨}、{¬, →}、{NAND}、{NOR} 都是功能完備的（只用它們就能寫出任何真值表）。{∧, ∨} 不是（寫不出 ¬）。

=== rc:dm-logic:4
強歸納法假設 P(1)～P(k) 全都成立來證 P(k+1)；一般歸納法只假設 P(k)。兩者證明力一樣。
「所有馬同色」：從 n 匹推到 n+1 匹時，用「前 n 匹同色」和「後 n 匹同色」，靠中間重疊的馬連起來。但 n = 1 → 2 時兩組沒有重疊，推論在這裡斷掉。

=== rc:dm-logic:5
- 廣義鴿籠：N 個東西放進 k 個盒子，至少有一盒有 $\lceil N/k\rceil$ 個。
- Erdős–Szekeres：任何 $n^2+1$ 個相異實數排成的序列，一定有長度 n+1 的遞增子序列，或長度 n+1 的遞減子序列。

=== rc:dm-logic:6
可數：能跟自然數一一對應（整數、有理數、所有有限長的字串都可數）。
對角線論證：假設 (0,1) 的實數能列成 $r_1,r_2,\dots$。造一個數，第 i 位故意跟 $r_i$ 的第 i 位不一樣 → 它跟清單上每個數都不同，不在清單上，矛盾。所以實數不可數。

=== rc:dm-counting:1
$\binom{n+r-1}{r}$。把 r 顆星星和 n−1 根槓排成一列，槓把星星分成 n 段，第 i 段有幾顆星星就是第 i 種選了幾個。等於從 n+r−1 個位置挑 r 個放星星。

=== rc:dm-counting:2
$D_n=n!\sum_{k=0}^{n}\frac{(-1)^k}{k!}\approx\frac{n!}{e}$；遞迴 $D_n=(n-1)(D_{n-1}+D_{n-2})$，$D_1=0$、$D_2=1$（所以 $D_3=2$、$D_4=9$）。

=== rc:dm-counting:3
m 個元素映成到 n 個元素：$\sum_{k=0}^{n}(-1)^k\binom nk(n-k)^m=n!\,S(m,n)$。
第二類 Stirling 數：$S(n,k)=S(n-1,k-1)+k\,S(n-1,k)$——第 n 個元素自己一組，或者放進已經有的 k 組之一。

=== rc:dm-counting:4
n 顆球放進 k 個箱子：

| 球 | 箱 | 隨便放 | 每箱 ≤ 1 | 每箱 ≥ 1 |
|---|---|---|---|---|
| 不同 | 不同 | $k^n$ | $k(k-1)\cdots(k-n+1)$ | $k!\,S(n,k)$ |
| 相同 | 不同 | $\binom{n+k-1}{n}$ | $\binom kn$ | $\binom{n-1}{k-1}$ |
| 不同 | 相同 | $\sum_{i\le k}S(n,i)$ | 1（n ≤ k）或 0 | $S(n,k)$ |
| 相同 | 相同 | $\sum_{i\le k}p(n,i)$ | 1（n ≤ k）或 0 | $p(n,k)$ |

p(n, k) 是把 n 拆成恰好 k 個正整數的方法數。

=== rc:dm-counting:5
$C_n=\frac{1}{n+1}\binom{2n}{n}$；遞迴 $C_{n+1}=\sum_{i=0}^{n}C_iC_{n-i}$。
四種以上的解釋：n 對合法括號、n 個節點的二元樹形狀、n+1 個矩陣相乘的加括號方式、凸 n+2 邊形的三角剖分、不越過對角線的格子路徑、1..n 的堆疊排列。
反射原理：從 (0,0) 走到 (n,n) 共 $\binom{2n}{n}$ 條路。碰到 y = x+1 的壞路，把碰到之後的部分上下翻轉，剛好一一對應到走到 (n−1, n+1) 的路，有 $\binom{2n}{n-1}$ 條 → $C_n=\binom{2n}{n}-\binom{2n}{n-1}$。

=== rc:dm-counting:6
1. $\binom nk=\binom n{n-k}$：選 k 個要的 = 選 n−k 個不要的。
2. $\binom nk=\binom{n-1}{k-1}+\binom{n-1}{k}$：看第 n 個人有沒有被選。
3. $\binom{m+n}{r}=\sum_k\binom mk\binom n{r-k}$（Vandermonde）：從 m 個男生、n 個女生裡選 r 人，按選了幾個男生分類。

=== rc:dm-recur-gf:1
$a_n=c_1a_{n-1}+\dots+c_ka_{n-k}$ → 特徵方程 $r^k-c_1r^{k-1}-\dots-c_k=0$。
- 根都不同：$a_n=\alpha_1r_1^n+\dots+\alpha_kr_k^n$。
- 某個根 r 重複 m 次：那部分寫成 $(\beta_0+\beta_1n+\dots+\beta_{m-1}n^{m-1})r^n$。

=== rc:dm-recur-gf:2
猜 $(p_tn^t+\dots+p_1n+p_0)s^n$。如果 s 是 m 重特徵根，再整個乘上 $n^m$。

=== rc:dm-recur-gf:3
$\frac{1}{(1-x)^k}=\sum_{n\ge0}\binom{n+k-1}{n}x^n$，係數就是「從 k 種東西可重複選 n 個」的方法數。

=== rc:dm-recur-gf:4
設 $a_0=0$、$G(x)=\sum a_nx^n$。把遞迴乘上 $x^n$ 加起來：$G=2xG+\frac{x}{1-x}$ → $G=\frac{x}{(1-x)(1-2x)}=\frac{1}{1-2x}-\frac{1}{1-x}$ → $a_n=2^n-1$（河內塔的步數）。

=== rc:dm-recur-gf:5
「順序有差」或「有標籤的東西分配」時，用 $\sum a_n\frac{x^n}{n!}$。
例：用 A、B、C 排成長度 n 的字串，A 要出現偶數次：$\frac{e^x+e^{-x}}{2}\cdot e^{2x}=\frac{e^{3x}+e^{x}}{2}$ → 答案 $\frac{3^n+1}{2}$。

=== rc:dm-relations:1
- 自反：每個 a 都有 aRa。
- 對稱：aRb ⇒ bRa。
- 反對稱：aRb 且 bRa ⇒ a = b。
- 遞移：aRb、bRc ⇒ aRc。

不對稱（asymmetric）：aRb ⇒ 一定沒有 bRa，所以連 aRa 都不行。不對稱 = 反對稱 + 非自反。

=== rc:dm-relations:2
- 自反：$2^{n^2-n}$（對角線固定要有，其他隨便）。
- 對稱：$2^{n(n+1)/2}$。
- 反對稱：$2^n\cdot3^{n(n-1)/2}$（對角線隨便；每一對 {a,b} 有「都沒有、只有 (a,b)、只有 (b,a)」三種）。

=== rc:dm-relations:3
遞移閉包 $R^*=R\cup R^2\cup\dots\cup R^n$，用布林矩陣乘法 $O(n^4)$。
Warshall：依序允許用第 1、2、…、n 個點當中繼站，$W_k[i][j]=W_{k-1}[i][j]\lor(W_{k-1}[i][k]\land W_{k-1}[k][j])$，$O(n^3)$。

=== rc:dm-relations:4
- 極大：沒有元素比它大（可以有好幾個）。
- 最大：比所有元素都大（最多一個）。

最大一定是極大，反過來不一定。例：{2, 3} 用整除排序，兩個都是極大，但沒有最大。極小、最小同理。

=== rc:dm-relations:5
- 格：任兩個元素都有最小上界（∨）和最大下界（∧）的偏序集。
- 分配格：∧、∨ 互相滿足分配律（不含 M₃、N₅ 這兩種子格）。
- 有補格：有最大元 1、最小元 0，每個 a 都有 b 使 a∨b = 1、a∧b = 0。
- 布林代數：有補的分配格（這時補數唯一）。

=== rc:dm-relations:6
有限偏序集中，最少能分成幾條鏈 = 最長反鏈（兩兩不能比較的元素）有幾個元素。

=== rc:dm-graph:1
握手定理：$\sum\deg(v)=2|E|$。
Havel–Hakimi：度數由大到小排，拿掉最大的 $d_1$，接下來的 $d_1$ 個各減 1，重新排序，重複。出現負數或不夠減就不可圖；全部變成 0 就可圖。

=== rc:dm-graph:2
二分圖 ⇔ 沒有奇數長度的環 ⇔ 可以用 2 種顏色著色。

=== rc:dm-graph:3
n 個點的圖，以下等價：連通且無環；連通且 n−1 條邊；無環且 n−1 條邊；任兩點之間恰好一條路；連通但拿掉任一條邊就不連通；無環但加任一條邊就出現環。
完全 m 元樹有 i 個內部點：總點數 n = mi + 1，葉子 l = (m−1)i + 1。
Cayley：n 個有標號的點能組成 $n^{n-2}$ 棵不同的樹。

=== rc:dm-graph:4
連通平面圖：V − E + F = 2。簡單平面圖（V ≥ 3）：E ≤ 3V − 6；沒有三角形時 E ≤ 2V − 4。
- $K_5$：E = 10 > 3·5 − 6 = 9。
- $K_{3,3}$：二分圖沒有三角形，E = 9 > 2·6 − 4 = 8。

=== rc:dm-graph:5
Brooks：連通圖如果不是完全圖、也不是奇數長度的環，色數 χ ≤ Δ（最大度數）。
刪除–收縮：$P(G,k)=P(G-e,k)-P(G/e,k)$。G − e 是刪掉邊 e，G/e 是把 e 的兩端合成一點。

=== rc:dm-graph:6
- Hall：二分圖 (X, Y) 有覆蓋整個 X 的匹配 ⇔ X 的每個子集合 S 都滿足 |N(S)| ≥ |S|（鄰居至少跟自己一樣多）。
- König：二分圖中，最大匹配的大小 = 最小點覆蓋的大小。

=== rc:dm-nt-algebra:1
延伸歐幾里得：算 gcd(a, b) 的同時，倒推出整數 x、y 使 ax + by = gcd(a, b)（這就是 Bézout 定理）。
Lamé：歐幾里得演算法的除法次數 ≤ 5 ×（較小那個數的十進位位數），也就是 O(log b)。

=== rc:dm-nt-algebra:2
令 d = gcd(a, m)。有解 ⇔ d 整除 b；有解時，在 mod m 底下恰好有 d 個不同的解。

=== rc:dm-nt-algebra:3
- 費馬小定理：p 是質數、p 不整除 a ⇒ $a^{p-1}\equiv1\pmod p$。
- Euler 定理：gcd(a, n) = 1 ⇒ $a^{\varphi(n)}\equiv1\pmod n$。
- Wilson 定理：p 是質數 ⇔ $(p-1)!\equiv-1\pmod p$。

=== rc:dm-nt-algebra:4
1. 選兩個大質數 p、q，n = pq，φ(n) = (p−1)(q−1)。
2. 選 e 跟 φ(n) 互質，算 d = e⁻¹ mod φ(n)。
3. 公鑰 (n, e)，私鑰 d。加密 $c=m^e\bmod n$，解密 $m=c^d\bmod n$。

正確性：ed = 1 + kφ(n)，用 Euler 定理（m 跟 n 不互質時用中國餘數定理）得到 $m^{ed}\equiv m\pmod n$。

=== rc:dm-nt-algebra:5
群：封閉、結合、有單位元、每個元素有反元素。
Lagrange：有限群 G 的子群 H，|H| 一定整除 |G|（推論：每個元素的階整除 |G|）。
循環群：由一個元素生成；一定交換；子群也都是循環群；n 階循環群對每個 d | n 恰好有一個 d 階子群，生成元有 φ(n) 個。

=== rc:dm-nt-algebra:6
Burnside：不同的圖樣數 = 每個對稱操作「不會改變的塗法數」的平均。
例：4 顆珠子、2 種顏色的項鍊，只算旋轉（4 種）：轉 0 格 16 種不變、轉 1 格 2、轉 2 格 4、轉 3 格 2 → (16 + 2 + 4 + 2) ÷ 4 = 6 種。

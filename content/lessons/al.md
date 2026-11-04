演算法以 CLRS 第 3、4、15、16、22–26、34、35 章為核心，台大常見題型：**判斷漸近大小與遞迴式**、**設計 DP 並寫出遞迴式與時間**、**證明 greedy 正確（交換論證）**、**NP-complete 歸約方向**、**多選題逐一判斷敘述**。設計題一定要寫：狀態定義 → 遞迴式 → 邊界 → 計算順序 → 時間空間。

=== al-recurrence
title: 漸近符號與遞迴式（Master、Akra–Bazzi、變數變換）
est: 140
recall:
- 寫出 $O,\Omega,\Theta,o,\omega$ 的嚴格定義（含量詞）。
- Master theorem 三種情況與 case 3 的 regularity 條件；$T(n)=2T(n/2)+n/\lg n$ 屬於哪一種？
- $T(n)=2T(\sqrt n)+\lg n$ 怎麼解？
- 把 $\lg(n!)$、$(\lg n)!$、$n^{\lg\lg n}$、$2^{\sqrt{2\lg n}}$ 由小到大排。
feynman: 用遞迴樹解釋 Master theorem 三種情況各自「成本集中在哪裡」：根、每層平均、還是葉子。要用 a、b、f(n) 說明每一層的總成本如何變化，最後用 T(n)=3T(n/4)+n lg n 走一遍並驗證 regularity 條件。
rubric:
- 第 $j$ 層有 $a^j$ 個子問題、大小 $n/b^j$，該層總成本 $a^j f(n/b^j)$
- 葉子有 $n^{\log_b a}$ 個，葉子層總成本 $\Theta(n^{\log_b a})$
- Case 1：各層成本由根往葉幾何遞增，總和由葉子主導
- Case 2：各層成本相同量級，乘上 $\log_b n$ 層，多一個 $\lg$
- Case 3：各層成本幾何遞減、由根主導；regularity 正是「下一層總成本 ≤ c 倍這一層」
- 例題寫出 $n^{\log_4 3}\approx n^{0.793}$，並驗證 $3\cdot\frac n4\lg\frac n4\le\frac34 n\lg n$
---
## 1. 定義與性質

- $f=O(g)$：$\exists c>0,n_0,\ \forall n\ge n_0:\ 0\le f(n)\le cg(n)$。
- $f=o(g)$：$\forall c>0,\ \exists n_0,\ \forall n\ge n_0:\ 0\le f(n)<cg(n)$，等價於 $\lim f/g=0$（若極限存在）。
- $\Theta$ = 同時 $O$ 與 $\Omega$。

> [!陷阱] 多選題常見陷阱
> - $2^{2n}\ne O(2^n)$；但 $2^{n+1}=O(2^n)$。
> - $\lg(n!)=\Theta(n\lg n)$，但 $n!\ne\Theta(n^n)$（$n!=o(n^n)$）。
> - 不是所有函數都能比較：$n$ 與 $n^{1+\sin n}$。
> - $f=O(g)$ 不保證 $2^f=O(2^g)$（例：$f=2n,g=n$）。
> - $f(n)=O(f(n)^2)$ 不一定成立（$f<1$ 時）。
> - $f+o(f)=\Theta(f)$ 成立。

### 常考的大小順序（由小到大）
$$1\prec \lg^*n\prec \lg\lg n\prec \sqrt{\lg n}\prec\lg n\prec \lg^2 n\prec 2^{\sqrt{2\lg n}}\prec n^{\varepsilon}\prec n\prec n\lg n=\Theta(\lg n!)\prec n^2\prec (\lg n)!\prec n^{\lg\lg n}=(\lg n)^{\lg n}\prec 2^n\prec n!\prec 2^{2^n}$$
（$\lg(\lg^* n)\prec\lg^*(\lg n)$，因後者 $=\lg^*n-1=\Theta(\lg^*n)$。$(\lg n)!$ 比任何多項式大（取 log 得 $\Theta(\lg n\lg\lg n)$），但由 $m!<m^m$ 知 $(\lg n)!=o((\lg n)^{\lg n})=o(n^{\lg\lg n})$：兩者取 log 同階，要更細地比。）

## 2. Master theorem

$T(n)=aT(n/b)+f(n)$，$a\ge1,b>1$，令 $n^{\log_b a}$ 為「葉子總成本」。

| 情況 | 條件 | 結果 |
|---|---|---|
| 1 | $f(n)=O(n^{\log_b a-\varepsilon})$ | $\Theta(n^{\log_b a})$ |
| 2 | $f(n)=\Theta(n^{\log_b a}\lg^k n)$, $k\ge0$ | $\Theta(n^{\log_b a}\lg^{k+1}n)$ |
| 3 | $f(n)=\Omega(n^{\log_b a+\varepsilon})$ 且 $af(n/b)\le cf(n)$, $c<1$ | $\Theta(f(n))$ |

> [!考點] 落在縫隙的情況（擴充版）
> $f(n)=\Theta(n^{\log_b a}\lg^k n)$：$k>-1\Rightarrow\Theta(n^{\log_b a}\lg^{k+1}n)$；$k=-1\Rightarrow\Theta(n^{\log_b a}\lg\lg n)$；$k<-1\Rightarrow\Theta(n^{\log_b a})$。
> 例：$T(n)=2T(n/2)+n/\lg n=\Theta(n\lg\lg n)$——原始 Master 不適用（$n/\lg n$ 不比 $n$ 小一個多項式因子）。

> [!例題] $T(n)=3T(n/4)+n\lg n$
+++ 看解答
$n^{\log_4 3}\approx n^{0.793}$，$f=n\lg n=\Omega(n^{0.793+\varepsilon})$。regularity：$3\cdot\frac n4\lg\frac n4\le\frac34 n\lg n$，$c=3/4<1$ 成立。故 case 3，$\Theta(n\lg n)$。
+++

## 3. 遞迴樹與 Akra–Bazzi

- $T(n)=T(n/3)+T(2n/3)+n$：每層成本 $\le n$，最長路徑 $\log_{3/2}n$ 層 → $\Theta(n\lg n)$。
- $T(n)=T(n/2)+T(n/4)+T(n/8)+n$：每層成本是上一層的 $7/8$，等比級數 → $\Theta(n)$。
- **Akra–Bazzi**：$T(n)=\sum a_iT(b_in)+g(n)$，找 $p$ 使 $\sum a_ib_i^p=1$，則
$$T(n)=\Theta\!\left(n^p\left(1+\int_1^n\frac{g(u)}{u^{p+1}}du\right)\right).$$
例：$T(n)=T(n/3)+T(2n/3)+n$，$p=1$，積分 $=\ln n$ → $\Theta(n\lg n)$。

## 4. 變數變換與其他型

| 遞迴式 | 方法 | 結果 |
|---|---|---|
| $T(n)=2T(\sqrt n)+\lg n$ | $m=\lg n$，$S(m)=2S(m/2)+m$ | $\Theta(\lg n\lg\lg n)$ |
| $T(n)=\sqrt n\,T(\sqrt n)+n$ | 除以 $n$：$U(n)=U(\sqrt n)+1$ | $\Theta(n\lg\lg n)$ |
| $T(n)=T(\sqrt n)+1$ | | $\Theta(\lg\lg n)$ |
| $T(n)=T(n-1)+n$ | 展開 | $\Theta(n^2)$ |
| $T(n)=T(n-1)+\lg n$ | | $\Theta(n\lg n)$ |
| $T(n)=2T(n-1)+1$ | | $\Theta(2^n)$ |
| $T(n)=T(n-1)+T(n-2)+1$ | 特徵根 $\varphi$ | $\Theta(\varphi^n)$ |
| $T(n)=4T(n/2)+n^2\sqrt n$ | case 3 | $\Theta(n^{2.5})$ |

> [!陷阱] 代入法的經典錯誤
> 要證 $T(n)=2T(\lfloor n/2\rfloor)+1=O(n)$，假設 $T(n)\le cn$ 得 $T(n)\le cn+1$，**不能**說「所以 $O(n)$」——歸納假設要的是**完全相同的形式**。修正：假設 $T(n)\le cn-d$，得 $cn-2d+1\le cn-d$ 只要 $d\ge1$。

=== al-dc
title: 分治法：Strassen、Karatsuba、最近點對、FFT
est: 110
recall:
- Strassen 用幾次乘法？遞迴式與結果？
- 最近點對合併步驟為何只需檢查常數個點？
- 用 merge sort 數逆序對的關鍵一步。
- FFT 的 halving lemma 是什麼？多項式乘法的三步驟？
feynman: 解釋最近點對的 O(n log n) 演算法合併步驟為什麼每個點只要和帶狀區域中、依 y 排序後的後面 7 個點比較。推理鏈要從「左右兩半各自的最近距離 δ」出發，用 δ×2δ 矩形內最多容納幾個點的論證推出常數。
rubric:
- 遞迴得 $\delta=\min(\delta_L,\delta_R)$；跨中線更近的點對，兩點都落在寬 $2\delta$ 的帶狀區
- 對帶狀區中的點 p，更近的點與 p 的 y 差 < δ，都落在一個 δ×2δ 矩形
- 矩形切成 8 個 $\frac\delta2\times\frac\delta2$ 方格，每格至多一點（同側兩點距離 ≥ δ，方格對角線 < δ）
- 所以依 y 排序後每點只比後面 7 個，合併 O(n)
- y 序列預先排好（或隨 merge 維持），得 $T(n)=2T(n/2)+O(n)$
---
## 1. 分治三步

Divide → Conquer → Combine。時間通常寫成 $T(n)=aT(n/b)+D(n)+C(n)$。

## 2. 經典分治

| 問題 | 遞迴式 | 時間 |
|---|---|---|
| Merge sort | $2T(n/2)+n$ | $n\lg n$ |
| Binary search | $T(n/2)+1$ | $\lg n$ |
| 最大子陣列（分治） | $2T(n/2)+n$ | $n\lg n$（Kadane 線性） |
| Karatsuba 大數乘法 | $3T(n/2)+n$ | $n^{\lg3}\approx n^{1.585}$ |
| Strassen 矩陣乘法 | $7T(n/2)+n^2$ | $n^{\lg7}\approx n^{2.807}$ |
| 一般分治矩陣乘法 | $8T(n/2)+n^2$ | $n^3$ |
| 最近點對 | $2T(n/2)+n$ | $n\lg n$ |
| Fibonacci 以矩陣快速冪 | $T(n/2)+1$ | $\lg n$ 次矩陣乘法 |

> [!考點] Karatsuba
> $(a\cdot 10^{m}+b)(c\cdot10^m+d)=ac\cdot10^{2m}+((a+b)(c+d)-ac-bd)\cdot10^m+bd$，只要三次乘法。

## 3. 最近點對

依 $x$ 切兩半，遞迴得 $\delta=\min(\delta_L,\delta_R)$。只看中線兩側寬 $\delta$ 的帶狀區域，依 $y$ 排序後，每點只需和後面 7 個比（$\delta\times2\delta$ 矩形內，每個 $\delta/2$ 小方格最多一點，共 8 格）。預先排序好 $y$ 序列，合併 $O(n)$。

## 4. 逆序對

Merge 時若右半的 $R[j]$ 先被放出去，它與左半剩下的 $n_1-i+1$ 個元素各構成一個逆序對。$O(n\lg n)$。

## 5. FFT（多項式乘法）

係數表示相乘 $\Theta(n^2)$。改成：(1) 在 $2n$ 個 $2n$ 次單位根求值（FFT, $\Theta(n\lg n)$）；(2) 逐點相乘 $\Theta(n)$；(3) 內插回係數（inverse FFT，同樣 $\Theta(n\lg n)$）。

**Halving lemma**：$n$ 為偶數時，$n$ 個 $n$ 次單位根的平方恰為 $n/2$ 個 $n/2$ 次單位根（各出現兩次）。所以 $A(x)=A_{even}(x^2)+xA_{odd}(x^2)$ 只需遞迴兩個一半大小的問題：$T(n)=2T(n/2)+\Theta(n)$。

=== al-dp
title: 動態規劃
est: 180
labs: dp
recall:
- DP 的兩個必要性質？為什麼「最長簡單路徑」不能用 DP？
- 矩陣鏈乘的遞迴式與時間；加括號方式有幾種？
- LCS 遞迴式；只要長度時空間可以壓到多少？
- 0/1 背包 $O(nW)$ 為什麼不是多項式時間？
- Optimal BST 的遞迴式中 $w(i,j)$ 的意義。
feynman: 以矩陣鏈乘為例，講清楚「最佳子結構」到底是什麼意思：為什麼最佳加括號在第 k 個位置切開後，左右兩段各自也必須是最佳加括號？用剪貼論證（cut-and-paste）一步一步證明，並說明為什麼這個論證在「最長簡單路徑」會失敗。
rubric:
- 定義 $m[i,j]$ 與最後一次相乘的切點 k，成本 = 左 + 右 + $p_{i-1}p_kp_j$
- 假設最佳解在 k 切開，但左段不是最佳加括號
- 把左段換成更便宜的加括號（剪貼），總成本嚴格變小
- 與原解最佳矛盾，所以左右兩段都必須是最佳
- 最長簡單路徑：兩段各自最長，接起來可能重複頂點，剪貼後不再是合法解，論證失效
---
## 1. 什麼時候用 DP

1. **最佳子結構**：最佳解包含子問題的最佳解（用剪貼論證證明）。
2. **重疊子問題**：遞迴會反覆解同一個子問題。

時間 ≈（子問題數）×（每個子問題的選擇數）。Top-down memoization 只算用得到的子問題；bottom-up 常數較小。

> [!陷阱] 最短簡單路徑有最佳子結構，**最長**簡單路徑沒有：兩段子路徑各自最長，接起來可能重複經過頂點。最長簡單路徑是 NP-hard；但在 DAG 上可用 DP 線性解。

## 2. 經典題與遞迴式

| 問題 | 狀態 | 遞迴式 | 時間 |
|---|---|---|---|
| 切鋼條 | $r_n$ | $\max_{1\le i\le n}(p_i+r_{n-i})$ | $n^2$ |
| 矩陣鏈乘 | $m[i,j]$ | $\min_{i\le k<j} m[i,k]+m[k+1,j]+p_{i-1}p_kp_j$ | $n^3$ |
| LCS | $c[i,j]$ | 相等 $c[i-1,j-1]+1$，否則 $\max(c[i-1,j],c[i,j-1])$ | $mn$ |
| 編輯距離 | $d[i,j]$ | $\min(d[i-1,j]+1,d[i,j-1]+1,d[i-1,j-1]+[x_i\ne y_j])$ | $mn$ |
| 0/1 背包 | $K[i,w]$ | $\max(K[i-1,w],K[i-1,w-w_i]+v_i)$ | $nW$ |
| LIS | $L[i]$ | $1+\max_{j<i,a_j<a_i}L[j]$ | $n^2$（或 $n\lg n$） |
| Optimal BST | $e[i,j]$ | $\min_{i\le r\le j}e[i,r-1]+e[r+1,j]+w(i,j)$ | $n^3$（Knuth 優化 $n^2$） |
| Floyd–Warshall | $d^{(k)}_{ij}$ | $\min(d^{(k-1)}_{ij},d^{(k-1)}_{ik}+d^{(k-1)}_{kj})$ | $V^3$ |
| TSP（Held–Karp） | $C(S,j)$ | $\min_{i\in S}C(S\setminus\{j\},i)+d_{ij}$ | $n^22^n$ |
| 最少硬幣 | $M[a]$ | $1+\min_i M[a-c_i]$ | $nA$ |

@lab dp

> [!例題] 矩陣鏈乘
> 維度 $p=\langle30,35,15,5,10,20,25\rangle$（6 個矩陣）的最少純量乘法數？
+++ 看解答
$m[1,6]=15125$，最佳加括號 $((A_1(A_2A_3))((A_4A_5)A_6))$。加括號方式總數是 Catalan $C_{n-1}=C_5=42$，暴力不可行。
+++

> [!例題] LCS
> $X=\texttt{ABCBDAB}$、$Y=\texttt{BDCABA}$ 的 LCS 長度？
+++ 看解答
長度 4，例如 `BCBA`（也有 `BDAB`、`BCAB`）。LCS 不唯一，但長度唯一。用上面的動畫切到 LCS 可以看整張表與回溯路徑。
+++

## 3. 空間與重建

- LCS 只要長度：保留兩列，$O(\min(m,n))$；要重建序列則需 Hirschberg（分治＋DP）才能 $O(\min(m,n))$ 空間。
- 背包可壓成一維陣列，但 $w$ 要**由大到小**更新（否則同一物品會被重複放入，變成無限背包）。

## 4. 偽多項式

0/1 背包 $O(nW)$：輸入大小是 $O(n\lg W)$，$W$ 對輸入長度是**指數**，所以不是多項式時間。0/1 背包是（弱）NP-complete；分數背包可用 greedy 在 $O(n\lg n)$ 解。

## 5. LIS 的 $O(n\lg n)$

維護 `tail[k]` = 長度 $k+1$ 的遞增子序列中，最小可能的結尾。每個新元素二分搜尋取代第一個 $\ge$ 它的位置。`tail` 的長度就是答案（`tail` 本身不一定是一個合法子序列）。

=== al-greedy
title: 貪婪法：交換論證、Huffman、擬陣
est: 120
recall:
- 證明 greedy 正確的兩件事？
- Activity selection 為什麼選「最早結束」？舉出「最短活動」「最早開始」的反例。
- Huffman 正確性的兩個引理。
- 擬陣的兩個條件？哪個經典演算法是擬陣 greedy？
feynman: 用交換論證證明 Huffman 編碼最佳。要講出兩個引理：(1) 頻率最小的兩個字元可以是最深層的兄弟；(2) 把它們合併成一個新字元後，子問題的最佳解加回去仍是原問題最佳解。每一步交換時，總成本為什麼不會變大要寫出式子。
rubric:
- 引理一：設 x、y 頻率最小，取任一最佳樹 T，把 x、y 與最深層的兄弟 a、b 交換
- 交換後成本變化 $(f(a)-f(x))(d_T(a)-d_T(x))\ge 0$ 的方向論證，成本不增
- 引理二：x、y 合併成 z，$f(z)=f(x)+f(y)$，且 $B(T)=B(T')+f(x)+f(y)$
- 若 T 不是最佳，存在更好的樹（x、y 為兄弟），合併後得到比 T' 更好的子問題解，矛盾
- 以歸納法把兩個引理接起來，得 greedy 結果最佳
---
## 1. 正確性證明的模板

1. **Greedy-choice property**：存在一個最佳解包含 greedy 的第一個選擇（用交換論證：拿任一最佳解，把它的某個選擇換成 greedy 的，證明不會變差）。
2. **最佳子結構**：做完 greedy 選擇後，剩下的子問題的最佳解與該選擇合起來就是原問題最佳解。

## 2. Activity selection

選最早結束的活動，再遞迴。反例：
- 最短活動：`[1,5) [4,7) [6,10)` → 選 `[4,7)` 只得 1 個，最佳是 2 個。
- 最早開始：`[1,10) [2,3) [4,5)` → 選 `[1,10)` 只得 1 個。
- 衝突最少：有已知 11 個活動的反例。

延伸：區間分割（最少教室）= 同一時間點最大重疊數；最小化最大延遲 → 依截止時間（EDF）排序。

## 3. Huffman

反覆合併頻率最小的兩棵樹，$O(n\lg n)$。成本 $B(T)=\sum_c f(c)\,d_T(c)$。

> [!例題] 頻率 a:45 b:13 c:12 d:16 e:9 f:5（千字元）
+++ 看解答
合併順序：f+e=14；c+b=25；14+d=30；25+30=55；a+55=100。碼長 a:1、b,c,d:3、e,f:4，總位元 $45+3(13+12+16)+4(9+5)=224$ 千位元；固定長度需 300 千位元。
+++

> [!考點] Huffman 性質
> - 是**前綴碼**（prefix code），最佳前綴碼一定是 full binary tree。
> - 合併時遇到平手，碼可能不同但總長相同。
> - 頻率為 Fibonacci 數時，樹會長成一條斜線（最大碼長 $n-1$）。

## 4. 背包

分數背包：依單位價值 $v_i/w_i$ 遞減放，greedy 最佳。0/1 背包 greedy 會錯：容量 50，物品 (10, 60)、(20, 100)、(30, 120)，greedy 依比例先拿 60、100 共 160；最佳是 100+120=220。

## 5. 擬陣（Matroid）

$M=(S,\mathcal I)$：(1) **遺傳性**：$B\in\mathcal I, A\subseteq B\Rightarrow A\in\mathcal I$；(2) **交換性**：$A,B\in\mathcal I,|A|<|B|\Rightarrow\exists x\in B-A,\ A\cup\{x\}\in\mathcal I$。
在擬陣上依權重由大到小、能加就加，得最大權獨立集。

- **圖擬陣**（獨立集 = 無環邊集）→ Kruskal。
- 單位工時任務、截止時間與懲罰的排程：「可以全部準時完成的任務集合」構成擬陣。

## 6. Greedy 失敗的例子

- 找零：幣值 $\{1,3,4\}$ 湊 6，greedy 給 4+1+1，最佳 3+3。美元幣值 $\{1,5,10,25\}$ 時 greedy 正確。
- Belady 離線快取（踢掉最遠才會再用的）是最佳的，是 greedy 的正面例子。

=== al-sp
title: 最短路徑：Bellman-Ford、Dijkstra、Johnson、Floyd–Warshall
est: 150
labs: graph
recall:
- 鬆弛的四個性質（三角不等式、上界、無路徑、路徑鬆弛）。
- Dijkstra 用三種優先佇列的時間？負邊的最小反例？
- 所有邊加同一常數，最短路徑會變嗎？乘以正常數呢？
- Johnson 的重新加權公式為何保持最短路徑、且非負？
- 差分約束如何轉成最短路徑？
feynman: 證明 Dijkstra 在非負權重下正確：當 u 被取出時 u.d = δ(s,u)。推理鏈要用反證，假設 u 是第一個取出時 d 不正確的點，找出最短路徑上第一個還沒取出的點 y，說明 y.d = δ(s,y) ≤ δ(s,u) ≤ u.d ≤ y.d 這串不等式每一步的理由，並指出哪一步用到「非負」。
rubric:
- 反證：令 u 是第一個被取出時 $u.d\ne\delta(s,u)$ 的點
- 取 s 到 u 最短路徑上第一個未取出的點 y，其前驅 x 已取出
- x 取出時 $x.d=\delta(s,x)$ 並鬆弛 (x,y)，所以 $y.d=\delta(s,y)$
- 非負權重 ⇒ $\delta(s,y)\le\delta(s,u)$（指出這是唯一用到非負的地方）
- u 是最小 ⇒ $u.d\le y.d$，串成 $y.d=\delta(s,y)\le\delta(s,u)\le u.d\le y.d$，全部相等，矛盾
---
## 1. 基本工具

$\delta(s,v)$：最短路徑權重。RELAX$(u,v)$：若 $v.d>u.d+w(u,v)$ 則更新。

- **三角不等式**：$\delta(s,v)\le\delta(s,u)+w(u,v)$。
- **上界性質**：永遠 $v.d\ge\delta(s,v)$，一旦相等不再改變。
- **路徑鬆弛**：若最短路徑 $s=v_0,\dots,v_k$ 的邊**依序**被鬆弛過（中間可穿插其他鬆弛），則 $v_k.d=\delta(s,v_k)$。

## 2. 演算法比較

| 演算法 | 限制 | 時間 |
|---|---|---|
| BFS | 無權 | $V+E$ |
| DAG 最短路徑 | 無環（可負邊） | $V+E$ |
| Dijkstra（陣列） | 非負 | $V^2$ |
| Dijkstra（binary heap） | 非負 | $(V+E)\lg V$ |
| Dijkstra（Fibonacci heap） | 非負 | $E+V\lg V$ |
| Bellman-Ford | 可負邊、偵測負環 | $VE$ |
| Floyd–Warshall（全點對） | 無負環 | $V^3$ |
| Johnson（全點對、稀疏） | 無負環 | $VE\lg V$（binary）/ $V^2\lg V+VE$ |
| 矩陣乘法式全點對 | | $V^3\lg V$ |

@lab graph

> [!陷阱] Dijkstra 遇到負邊
> $s\to a$ 權 2、$s\to b$ 權 3、$b\to a$ 權 $-2$、$a\to c$ 權 1。Dijkstra 先取出 $a$（$d=2$）並用它把 $c$ 設為 3；之後取出 $b$ 才發現 $a$ 可以是 1，但 $a$ 已經出佇列，不會再鬆弛 $a\to c$。結果 $c.d=3$，實際 $\delta(s,c)=2$。

> [!陷阱] 所有邊加常數 $c$
> 路徑長變成 $w(p)+c\cdot|p|$，邊數不同的路徑被加的量不同，最短路徑**可能改變**；乘以正常數則不變。所以「把負邊全部加成非負再跑 Dijkstra」是錯的，Johnson 用的是**頂點位能**。

## 3. Bellman-Ford

做 $|V|-1$ 輪「鬆弛所有邊」，再檢查一輪：若還能鬆弛，存在從 $s$ 可達的負環。正確性來自路徑鬆弛性質（最短簡單路徑最多 $|V|-1$ 條邊）。

**差分約束**：$x_j-x_i\le b_k$ → 邊 $v_i\to v_j$ 權重 $b_k$，再加一個源點 $v_0$ 到所有點權 0。有解 $\iff$ 沒有負環，且 $x_i=\delta(v_0,v_i)$ 是一組解。

## 4. Johnson

加新點 $q$ 連到所有點權 0，跑 Bellman-Ford 得 $h(v)=\delta(q,v)$。重新加權 $\hat w(u,v)=w(u,v)+h(u)-h(v)\ge0$（三角不等式）。任一路徑 $\hat w(p)=w(p)+h(v_0)-h(v_k)$，同起終點的路徑都加同一常數，最短路徑不變。再從每點跑 Dijkstra。

## 5. Floyd–Warshall

$d^{(k)}_{ij}$：中間點只能用 $\{1..k\}$ 時的最短距離。$O(V^3)$ 時間、可原地 $O(V^2)$ 空間。$d_{ii}<0$ 代表有負環。把 min/+ 換成 OR/AND 就是**遞移閉包**（Warshall）。

## 6. DAG 與關鍵路徑

依拓撲序鬆弛，$O(V+E)$；把權重取負就是**最長路徑**，即 PERT 的關鍵路徑。

=== al-mst-flow
title: 最小生成樹與網路流
est: 160
labs: graph
recall:
- Cut property 的完整敘述。為什麼 Kruskal、Prim 都對？
- 邊權相異時 MST 唯一的證明想法。
- Max-flow min-cut 定理的三個等價敘述。
- Edmonds-Karp 的時間與擴增次數。
- 二分圖最大匹配如何轉成網路流？König 定理？
feynman: 證明 max-flow min-cut 定理中「殘餘網路沒有擴增路徑 ⇒ 存在一個割的容量等於流量」這一步。推理鏈要定義 S = 殘餘網路中 s 可達的點，然後說明跨割的每條正向邊為什麼滿載、每條反向邊為什麼流量為 0，最後得出 |f| = c(S,T)。
rubric:
- 定義 S = 殘餘網路中 s 可達的點；沒有擴增路徑所以 t 不在 S
- S→T 的原邊必滿載：否則殘餘邊存在，對端可達，矛盾
- T→S 的原邊流量為 0：否則殘餘網路有反向邊，矛盾
- 跨割淨流量 = c(S,T)，而任何割的淨流量都等於流量值
- 由「流量 ≤ 任一割的容量」得 f 是最大流、(S,T) 是最小割
---
## 1. MST

> [!定理] Cut property
> 設 $A$ 是某個 MST 的子集，$(S,V-S)$ 是一個**尊重** $A$ 的割（$A$ 沒有邊跨過它），$(u,v)$ 是跨過這個割的最輕邊，則 $A\cup\{(u,v)\}$ 仍包含於某個 MST。

- **Cycle property**：環上權重**唯一最大**的邊不在任何 MST 中。
- **Kruskal**：邊排序＋Union-Find，$O(E\lg E)=O(E\lg V)$。
- **Prim**：binary heap $O(E\lg V)$；Fibonacci heap $O(E+V\lg V)$；陣列 $O(V^2)$（稠密圖較好）。
- **Borůvka**：每輪每個元件選最輕外連邊，$O(E\lg V)$，適合平行化。
- 邊權相異 ⇒ MST 唯一。有相同權重時 MST 可能不唯一，但**所有 MST 的權重多重集合相同**。
- MST 同時是**最小瓶頸生成樹**；MST 上兩點間路徑是 minimax 路徑。
- 所有邊權加常數，MST 不變（生成樹邊數都是 $V-1$）——對比最短路徑會變。
- 第二好的 MST：換一條邊即可，$O(V^2)$。

## 2. 最大流

流量網路：容量限制 $0\le f(u,v)\le c(u,v)$、流量守恆。殘餘容量 $c_f(u,v)=c(u,v)-f(u,v)$，並有反向邊 $c_f(v,u)=f(u,v)$。

> [!定理] Max-flow min-cut
> 以下三者等價：(1) $f$ 是最大流；(2) 殘餘網路沒有擴增路徑；(3) 存在割 $(S,T)$ 使 $|f|=c(S,T)$。
> (2)⇒(3)：令 $S$＝殘餘網路中 $s$ 可達的點。若 $u\in S,v\in T$ 有邊，必滿載（否則 $v$ 可達）；若 $v\to u$ 有流量，則殘餘網路有 $u\to v$ 反向邊使 $v$ 可達，矛盾。所以淨流量 $=c(S,T)$。

| 演算法 | 時間 |
|---|---|
| Ford–Fulkerson（整數容量） | $O(E|f^*|)$；無理數容量可能不終止 |
| Edmonds–Karp（BFS 最短擴增路徑） | $O(VE^2)$，擴增 $O(VE)$ 次 |
| Dinic | $O(V^2E)$；單位容量二分圖 $O(E\sqrt V)$ |
| Push-relabel（generic / relabel-to-front） | $O(V^2E)$ / $O(V^3)$ |

**整數性**：容量都是整數 ⇒ 存在整數最大流，Ford–Fulkerson 會找到。

## 3. 二分圖匹配與相關定理

加源點連左側、右側連匯點，容量都 1，最大流 = 最大匹配，$O(VE)$；Hopcroft–Karp $O(E\sqrt V)$。

- **König**：二分圖中，最大匹配大小 = 最小頂點覆蓋大小（一般圖不成立，例如三角形：匹配 1、覆蓋 2）。
- **Hall**：左側 $X$ 可完全匹配 $\iff$ 對所有 $W\subseteq X$，$|N(W)|\ge|W|$。
- **Menger**：$s,t$ 間邊互斥路徑最大數 = 最小邊割大小。
- 多源多匯：加超級源與超級匯。頂點有容量：拆成入點、出點。

=== al-np
title: NP 完備、歸約與近似演算法
est: 160
recall:
- 證明問題 X 是 NP-complete 的兩步驟，歸約方向是哪邊到哪邊？
- CLIQUE、IS、VC 三者之間的互相歸約。
- 2-SAT、Horn-SAT、3-SAT 的複雜度；2-coloring 與 3-coloring？
- Vertex cover 的 2-近似演算法與證明；metric TSP 的 2-近似。
- 為什麼一般 TSP 沒有常數近似（除非 P=NP）？
feynman: 解釋「要證明 X 是 NP-hard，必須把已知 NP-complete 問題 Y 歸約到 X，而不是把 X 歸約到 Y」。推理鏈要從歸約的定義（Y ≤p X 表示能用 X 的解法解 Y）出發，說明反方向只證明了 X 不比 Y 難，並用 VERTEX-COVER ≤p SAT 這個（正確但沒用的）歸約當例子。
rubric:
- 寫出 $Y\le_p X$ 的定義：多項式時間可算的 f，$y\in Y\iff f(y)\in X$
- 說明用 X 的解法加上 f 就能解 Y，所以 X 至少和 Y 一樣難
- NP-hard 需要所有 NP 問題都歸約到 X，透過已知 NPC 的 Y 和遞移性得到
- 反方向 $X\le_p Y$ 只給出 X 的上界（X 不比 Y 難）
- 用 VC ≤p SAT 說明：它成立，但只說明 VC ∈ NP，不證明 VC 難
---
## 1. 名詞

- **P**：多項式時間可解的判定問題。**NP**：多項式時間可**驗證**（給 certificate）。**co-NP**：補問題在 NP。
- $A\le_p B$：存在多項式時間的 $f$，使 $x\in A\iff f(x)\in B$。意思是「$B$ 至少和 $A$ 一樣難」。
- **NP-hard**：所有 NP 問題都能歸約到它（不一定在 NP，例如停機問題）。**NP-complete** = NP-hard ∩ NP。
- 證明 $X$ 是 NPC：(1) $X\in$ NP；(2) 某已知 NPC 問題 $Y\le_p X$。

> [!陷阱] 多選題常見敘述
> - 「若某 NPC 問題有多項式解，則 P = NP」✓。
> - 「若 $A\le_p B$ 且 $B\in$ P，則 $A\in$ P」✓；「若 $A\le_p B$ 且 $A\in$ P，則 $B\in$ P」✗。
> - 「NP 是 non-polynomial 的縮寫」✗（nondeterministic polynomial）。
> - 「所有 NP-hard 問題都在 NP」✗。
> - 「P ≠ NP 已被證明」✗。「若 P = NP 則 NP = co-NP」✓。
> - 「分解質因數是 NP-complete」✗（未知；它在 NP ∩ co-NP）。「判斷質數在 P」✓（AKS, 2002）。

## 2. 歸約鏈（CLRS 34 章）

CIRCUIT-SAT → SAT → 3-CNF-SAT → CLIQUE → VERTEX-COVER → HAM-CYCLE → TSP；3-CNF-SAT → SUBSET-SUM。

- **CLIQUE ↔ IS**：$G$ 有大小 $k$ 的 clique $\iff$ 補圖 $\bar G$ 有大小 $k$ 的獨立集。
- **IS ↔ VC**：$S$ 是獨立集 $\iff V-S$ 是頂點覆蓋。所以最大獨立集 + 最小頂點覆蓋 $=|V|$。
- **3-SAT → CLIQUE**：每個子句 3 個點，不同子句間、不互為否定的文字之間連邊，問是否有大小 $k$（子句數）的 clique。

## 3. P 與 NPC 的對照（必背）

| 在 P | NP-complete |
|---|---|
| 2-SAT（蘊含圖＋SCC，線性） | 3-SAT、SAT |
| Horn-SAT | 一般 CNF-SAT |
| 2-著色（二分圖判定） | 3-著色 |
| 歐拉迴路 | 漢米頓迴路 |
| 最短路徑 | 最長簡單路徑 |
| 最小割 | 最大割 |
| 二分圖匹配、一般圖匹配 | 3 維匹配 |
| 線性規劃 | 整數規劃 |
| 樹上的獨立集、二分圖的頂點覆蓋 | 一般圖的獨立集、頂點覆蓋 |
| 分數背包 | 0/1 背包、Subset-sum（弱 NPC，有偽多項式解） |

**強 NP-complete**（即使數字以一元表示仍是 NPC，沒有偽多項式解，除非 P=NP）：3-partition、TSP、bin packing。

## 4. 近似演算法

| 問題 | 方法 | 比率 |
|---|---|---|
| Vertex cover | 任取一條邊、兩端都選、刪掉相連邊（極大匹配） | 2 |
| Metric TSP | MST 前序走訪＋捷徑 | 2（Christofides 1.5） |
| 一般 TSP | — | 除非 P=NP，沒有任何常數比率 |
| Set cover | 每次選蓋住最多未覆蓋元素的集合 | $H(\max|S|)\le\ln n+1$ |
| MAX-3-CNF | 隨機指派 | 期望 8/7 |
| 加權 vertex cover | LP 鬆弛＋取整 | 2 |
| 0/1 背包 | FPTAS | $1+\varepsilon$ |

> [!證明] Vertex cover 2-近似
> 選到的邊 $A$ 兩兩不共點（是匹配）。任何頂點覆蓋都要蓋住 $A$ 的每條邊，且一個點只能蓋 $A$ 中的一條，所以 $|C^*|\ge|A|$。輸出大小 $2|A|\le2|C^*|$。

> [!證明] 一般 TSP 無常數近似
> 若有 $\rho$-近似，對 HAM-CYCLE 的圖 $G$ 建完全圖：$G$ 中的邊權 1，其他邊權 $\rho|V|+1$。$G$ 有漢米頓迴路 ⇔ 最佳 tour 為 $|V|$；否則最佳 tour $>\rho|V|$。近似演算法能分辨兩者，就能解 HAM-CYCLE。

=== al-prob
title: 機率分析、隨機演算法與字串比對
est: 130
recall:
- 指示隨機變數與期望值線性性；雇用問題的期望雇用次數。
- Las Vegas 與 Monte Carlo 的差別，各舉一例。
- KMP 的 prefix function 定義與時間複雜度；Rabin-Karp 最壞情況？
- 球丟進箱子：期望空箱數、收集所有優惠券的期望次數。
feynman: 用指示隨機變數算出雇用問題的期望雇用次數是 H_n ≈ ln n。推理鏈要清楚定義 X_i、說明「第 i 個應徵者被雇用 ⇔ 他是前 i 個中最好的」這一步為什麼機率是 1/i（需要什麼隨機性假設），再用期望值線性性加總。
rubric:
- 定義 $X_i=I\{\text{第 } i \text{ 人被雇用}\}$，$X=\sum X_i$
- 第 i 人被雇用 ⇔ 他是前 i 人中最好的
- 需要「應徵順序為均勻隨機排列」的假設（或演算法先隨機打亂），所以機率 1/i
- 期望值線性性不需要獨立，$E[X]=\sum_{i=1}^n 1/i=H_n$
- $H_n=\ln n+O(1)$；對比最壞情況（遞增順序）雇用 n 次
---
## 1. 指示隨機變數

$X_A=I\{A\}$，$E[X_A]=\Pr[A]$。期望值線性性**不需要獨立**。

| 問題 | 結果 |
|---|---|
| 雇用問題（隨機順序）期望雇用次數 | $H_n=\ln n+O(1)$ |
| 生日問題：$k$ 人中同天生日的期望對數 | $\binom k2/n$，$k\approx\sqrt{2n}$ 時期望 ≥ 1 |
| $n$ 球丟 $n$ 箱，期望空箱數 | $n(1-1/n)^n\approx n/e$ |
| 收集 $n$ 種優惠券的期望次數 | $nH_n$ |
| 擲 $n$ 次公平硬幣，最長連續正面 | $\Theta(\lg n)$ |
| 隨機排列中的固定點個數期望 | 1 |
| 隨機排列的逆序對期望 | $n(n-1)/4$ |

## 2. 隨機演算法

- **Las Vegas**：答案一定對，時間是隨機變數。例：隨機 quicksort、Randomized-Select、treap。
- **Monte Carlo**：時間有上界，答案可能錯（機率有界）。例：Miller–Rabin 質數測試（說「合數」一定對，說「質數」可能錯，每輪錯誤率 $\le1/4$）、Karger 最小割（一次成功率 $\ge\frac{2}{n(n-1)}$，重複 $O(n^2\lg n)$ 次）。
- **隨機排列**：Fisher–Yates，$A[i]$ 與 $A[\text{RANDOM}(i,n)]$ 交換，產生均勻隨機排列。「與 $A[\text{RANDOM}(1,n)]$ 交換」**不**均勻（$n^n$ 種結果不能被 $n!$ 整除）。

## 3. 字串比對

| 演算法 | 前處理 | 比對 |
|---|---|---|
| 樸素 | 0 | $O((n-m+1)m)$ |
| Rabin–Karp | $\Theta(m)$ | 期望 $O(n+m)$，最壞 $O((n-m+1)m)$ |
| 有限自動機 | $O(m|\Sigma|)$ | $\Theta(n)$ |
| KMP | $\Theta(m)$ | $\Theta(n)$ |
| Boyer–Moore | $O(m+|\Sigma|)$ | 實務上次線性 |

**Prefix function**：$\pi[q]$ = $P[1..q]$ 最長的、同時是後綴的**真**前綴長度。

> [!例題] 求 $P=\texttt{ababaca}$ 與 $P=\texttt{aabaaab}$ 的 $\pi$
+++ 看解答
`ababaca`：0 0 1 2 3 0 1。
`aabaaab`：0 1 0 1 2 2 3。第 6 位 `aabaaa` 的後綴 `aa` 是前綴，`aaa` 不是（前綴是 `aab`），所以 2；第 7 位後綴 `aab` = 前綴 `aab`，所以 3。
+++

KMP 比對的總時間 $\Theta(n)$：用位能 $q$（目前匹配長度）分析，每次失敗跳轉讓 $q$ 減少，而 $q$ 總增加量 $\le n$。

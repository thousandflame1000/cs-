import random, sys, math
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
if want('syscall'):
  cnt=0; seen=set()
  while cnt<n:
    S=random.choice([1,4,16]); b1=random.choice([1,16,64]); b2=random.choice([4096,8192,65536]); t=random.choice([F(1,2),1,2])
    if (S,b1,b2,t) in seen: continue
    seen.add((S,b1,b2,t))
    N=S*2**20
    c1=N//b1; c2=N//b2
    tm1=c1*t/10**6; tm2=c2*t/10**6
    ts=str(t.numerator) if t.denominator==1 else f'{t.numerator}/{t.denominator}'
    out.append(f"""@q pr4-? | os-process#4 | 3 | 計算
讀一個 {S} MB（$1\\text{{ MB}}=2^{{20}}$ bytes）的檔案。每次 `read` 系統呼叫光是切到核心模式再回來就要 {float(t):g} µs（不含真正搬資料的時間）。每次讀 {b1} bytes 和每次讀 {b2} bytes，這部分額外開銷各是多少毫秒？（四捨五入到小數第二位）
== {float(tm1*1000):.2f},{float(tm2*1000):.2f}
?? 每次 {b1} B,每次 {b2} B
---
呼叫次數：${S}\\times2^{{20}}/{b1}={c1}$ 次、${S}\\times2^{{20}}/{b2}={c2}$ 次。乘上每次 {float(t):g} µs：約 {float(tm1*1000):.2f} ms vs {float(tm2*1000):.2f} ms，差 {c1//c2} 倍。系統呼叫要切換模式、檢查參數，固定成本不小；所以標準函式庫（例如 `fread`）會先在使用者空間開緩衝區，一次讀一大塊再慢慢給程式用。
""")
    cnt+=1
if want('fibh'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.randint(6,40)
    if N in seen: continue
    seen.add(N)
    m=N-1; trees=bin(m).count('1'); sizes=[2**i for i in range(m.bit_length()) if m>>i&1]
    out.append(f"""@q hp5-? | ds-heap#5 | 3 | 計算
空的 Fibonacci heap 連續 insert {N} 個不同的 key（每次 insert 只是把單一節點加進根串列），接著做一次 extract-min。做完之後根串列裡有幾棵樹？
== {trees}
---
extract-min 拿掉最小的根後，剩下 {m} 棵單節點樹，consolidate 把「度數相同」的樹兩兩合併，像二進位加法進位一樣：最後每種度數最多一棵，樹的大小是 {m} 的二進位中為 1 的那些 2 的次方（{'、'.join(map(str,sorted(sizes,reverse=True)))}），共 {trees} 棵。實際成本約 {m}（要掃過整個根串列），但前面 {N} 次 insert 各存了 1 單位位能，攤銷後 extract-min 只有 $O(\\lg n)$。
""")
    cnt+=1
print(''.join(out))

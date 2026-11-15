import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('comp'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.randint(2,5); b=random.randint(-4,6); c=random.randint(1,3); x=random.randint(-3,4)
    if (a,b,c,x) in seen or b==0: continue
    seen.add((a,b,c,x))
    f=lambda t:a*t+b; g=lambda t:t*t+c
    fg=f(g(x)); gf=g(f(x))
    if fg==gf: continue
    sb=f'+{b}' if b>0 else f'{b}'
    out.append(f"""@q ff-? | f-func | 2 | 計算
$f(x)={a}x{sb}$、$g(x)=x^2+{c}$。$f(g({x}))$ 和 $g(f({x}))$ 各是多少？
== {fg},{gf}
?? f(g({x})),g(f({x}))
---
$f(g({x}))$：先算裡面 $g({x})={x}^2+{c}={g(x)}$，再代進 $f$：${a}\\times{g(x)}{sb}={fg}$。$g(f({x}))$：先算 $f({x})={f(x)}$，再代進 $g$：${f(x)}^2+{c}={gf}$。兩者不一樣——合成的順序會影響結果，裡面那個先做。
""".replace('+-','-'))
    cnt+=1
if want('pow'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.randint(4,7); inc=random.randint(1,2); exc=random.randint(0,2)
    if N-inc-exc<2 or (N,inc,exc) in seen: continue
    seen.add((N,inc,exc))
    I=list(range(1,inc+1)); E=list(range(inc+1,inc+exc+1)); free=N-inc-exc
    st=lambda s:BS+'{'+','.join(map(str,s))+BS+'}'
    cond='一定包含 '+'、'.join(map(str,I))+('，而且不包含 '+'、'.join(map(str,E)) if E else '')
    out.append(f"""@q fe-? | f-set | 2 | 計算
$A={st(range(1,N+1))}$。$A$ 有幾個子集合{cond}？
== {2**free}
---
指定要放的 {inc} 個和指定不放的 {exc} 個都已經決定了，剩下 {free} 個元素每個都有「放／不放」兩種選擇：$2^{{{free}}}={2**free}$ 個。全部的子集合是 $2^{{{N}}}={2**N}$ 個，這些只佔其中 $1/2^{{{inc+exc}}}$。
""")
    cnt+=1
if want('last'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.choice([2,3,7,8,9,13,17]); k=random.randint(20,99)
    if (a,k) in seen: continue
    seen.add((a,k))
    cyc=[]; v=1
    for i in range(1,5):
        v=v*a%10; cyc.append(v)
    L=len(cyc)
    for p in (1,2,4):
        if all(cyc[i]==cyc[i%p] for i in range(4)): L=p; break
    ans=pow(a,k,10)
    r=k%L if k%L else L
    out.append(f"""@q fm-? | f-mod | 2 | 計算
${a}^{{{k}}}$ 的個位數是多少？
== {ans}
---
個位數就是 $\\bmod 10$。${a}^1,{a}^2,{a}^3,{a}^4$ 的個位數依序是 {', '.join(map(str,cyc))}，每 {L} 個重複一次。${k}\\bmod {L}={k%L}$，所以和 ${a}^{{{r}}}$ 的個位數一樣，是 {ans}。只看個位數時，每一步只要拿上一個的個位數去乘就好。
""")
    cnt+=1
if want('lgid'):
  cnt=0; seen=set()
  while cnt<n:
    base=random.choice([4,8,16,9,27]); 
    pr={4:(2,2),8:(2,3),16:(2,4),9:(3,2),27:(3,3)}[base]
    p,e=pr; k=random.randint(1,9)
    if (base,k) in seen or k%e==0: continue
    seen.add((base,k))
    val=p**k; ans=F(k,e)
    out.append(f"""@q fl-? | f-log | 2 | 計算
$\\log_{{{base}}}{val}$ 是多少？（可用分數）
== {fr(ans)}
---
把兩邊都寫成 {p} 的次方：${base}={p}^{{{e}}}$、${val}={p}^{{{k}}}$。$\\log_{{{base}}}{val}=x$ 表示 $({p}^{{{e}}})^x={p}^{{{k}}}$，所以 ${e}x={k}$、$x={fr(ans)}$。也可以用換底：$\\log_{{{base}}}{val}=\\frac{{\\log_{p}{val}}}{{\\log_{p}{base}}}=\\frac{{{k}}}{{{e}}}$。
""")
    cnt+=1
if want('badd'):
  cnt=0
  while cnt<n:
    x=random.randint(40,200); y=random.randint(40,200)
    if x+y>255: continue
    bx=format(x,'08b'); by=format(y,'08b'); bs=format(x+y,'08b')
    out.append(f"""@q fb-? | f-binary | 2 | 計算
二進位相加：`{bx}` + `{by}` 等於？（寫成 8 位的二進位）
== {bs}
---
從最右邊一位一位加，$1+1=10$ 要往左邊多加 1。也可以先換成十進位驗算：{x}＋{y}＝{x+y}，寫回二進位是 `{bs}`。
""")
    cnt+=1
if want('tv'):
  cnt=0
  while cnt<n:
    v=random.randint(-128,127)
    if v>-9: continue
    b=format(v&0xFF,'08b')
    exp=(f'最高位是 1，代表負數。當成無號數是 {int(b,2)}，減掉 256 得 {v}。也可以「反過來再加 1」：得到 {-v} 的二進位，所以原數是 {v}。' if v<0 else f'最高位是 0，代表非負數，直接照二進位讀：{v}。')
    out.append(f"""@q ft-? | f-twos | 2 | 計算
8 位元二補數 `{b}` 代表的十進位數是多少？
== {v}
---
{exp}
""")
    cnt+=1
if want('loop'):
  cnt=0
  while cnt<n:
    N=random.randint(6,9); a=[random.randint(-5,15) for _ in range(N)]; st=random.choice([2,3]); s0=random.randint(0,1)
    s=sum(a[i] for i in range(s0,N,st)); idx=list(range(s0,N,st))
    out.append(f"""@q fa-? | f-c-array | 2 | 追蹤
```
int a[{N}] = {{{', '.join(map(str,a))}}};
int s = 0;
for (int i = {s0}; i < {N}; i += {st}) s += a[i];
```
執行完 `s` 是多少？
== {s}
---
`i` 依序是 {', '.join(map(str,idx))}，加的是 {' + '.join(f'a[{i}]' for i in idx)} ＝ {' + '.join(map(str,(a[i] for i in idx)))} ＝ {s}。注意陣列從 0 開始編號，`i < {N}` 保證不會讀到 `a[{N}]`（界外）。
""".replace('+ -','− '))
    cnt+=1
if want('pp'):
  cnt=0
  while cnt<n:
    x=random.randint(1,9); y=random.randint(1,9); k=random.randint(2,4)
    nx=x+y; ny=y
    out.append(f"""@q fp-? | f-c-pointer | 2 | 追蹤
```
void f(int *p, int q) {{ *p = *p + q; q = q * {k}; }}
int x = {x}, y = {y};
f(&x, y);
```
呼叫完 `x`、`y` 各是多少？
== {nx},{ny}
?? x,y
---
`p` 拿到的是 `x` 的位址，`*p = *p + q` 直接改到 `x`：{x}＋{y}＝{nx}。`q` 只是 `y` 的副本，`q = q * {k}` 改的是副本，`y` 還是 {y}。想讓函式改到呼叫者的變數，就要傳位址。
""")
    cnt+=1
if want('cq'):
  cnt=0
  while cnt<n:
    K=random.choice([5,6,8]); front=random.randint(0,K-1); f0=front; rear=front; size=0; ops=[]; x=1
    for _ in range(random.randint(7,10)):
        if size>0 and (size==K-1 or random.random()<0.4):
            ops.append('拿出'); front=(front+1)%K; size-=1
        else:
            ops.append(f'放入 {x}'); rear=(rear+1)%K; size+=1; x+=1
    out.append(f"""@q fi-? | f-list | 2 | 追蹤
用長度 {K} 的陣列繞圈使用來做佇列：`front` 是第一個元素的前一格、`rear` 是最後一個元素所在格，放入時 `rear = (rear + 1) % {K}`，拿出時 `front = (front + 1) % {K}`。一開始 `front = rear = {f0}`（空的）。依序：{'、'.join(ops)}。最後 `front`、`rear` 各是多少？
== {front},{rear}
?? front,rear
---
放入 {sum(1 for o in ops if o!='拿出')} 次、拿出 {sum(1 for o in ops if o=='拿出')} 次，所以 `rear` 往前走 {sum(1 for o in ops if o!='拿出')} 格、`front` 走 {sum(1 for o in ops if o=='拿出')} 格，都要對 {K} 取餘數：`front`＝{front}、`rear`＝{rear}。佇列裡剩 {size} 個元素（`rear - front` 再對 {K} 取餘數）。
""")
    cnt+=1
if want('mm'):
  cnt=0
  while cnt<n:
    A=[[random.randint(-3,4) for _ in range(2)] for _ in range(2)]; B=[[random.randint(-3,4) for _ in range(2)] for _ in range(2)]
    C=[[sum(A[i][k]*B[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    D=[[sum(B[i][k]*A[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    if C==D: continue
    m=lambda M:'\\left[\\begin{smallmatrix}'+'\\\\'.join('&'.join(map(str,r)) for r in M)+'\\end{smallmatrix}\\right]'
    exp='；'.join(f'第 {i+1} 列第 {j+1} 行 $({A[i][0]})({B[0][j]})+({A[i][1]})({B[1][j]})={C[i][j]}$' for i in range(2) for j in range(2))
    out.append(f"""@q fv-? | f-vec | 2 | 計算
${m(A)}{m(B)}$ 等於？（依左上、右上、左下、右下）
== {C[0][0]},{C[0][1]},{C[1][0]},{C[1][1]}
---
第 $i$ 列第 $j$ 行＝左邊矩陣第 $i$ 列和右邊第 $j$ 行的內積：{exp}。換成 $BA$ 會得到 ${m(D)}$，不一樣——矩陣乘法不能隨便交換。
""")
    cnt+=1
if want('rec2'):
  cnt=0; seen=set()
  while cnt<n:
    c=random.choice([0,1,2]); N=random.randint(5,8); b=random.choice([1,2])
    if (c,N,b) in seen: continue
    seen.add((c,N,b))
    v={}
    for i in range(0,N+1):
        v[i]=b if i<=1 else v[i-1]+v[i-2]+c
    seq='、'.join(f'f({i})={v[i]}' for i in range(2,N+1))
    plus=f' + {c}' if c else ''
    out.append(f"""@q fr-? | f-recursion | 2 | 追蹤
`int f(int n) {{ if (n <= 1) return {b}; return f(n - 1) + f(n - 2){plus}; }}`，`f({N})` 是多少？
== {v[N]}
---
由小往上算比較不會亂：f(0)＝f(1)＝{b}；{seq}。直接照遞迴展開會重複算很多次同樣的 f(k)，由下往上一次一個只要 {N} 步。
""")
    cnt+=1
if want('geo'):
  cnt=0; seen=set()
  while cnt<n:
    r=random.choice([2,3,4,5]); k=random.randint(4,8); a=random.choice([1,2,3])
    if (r,k,a) in seen: continue
    seen.add((r,k,a))
    S=a*(r**(k+1)-1)//(r-1)
    terms=f'{a}+{a*r}+{a*r*r}+\\cdots+{a*r**k}'
    out.append(f"""@q fs-? | f-sum | 2 | 計算
${terms}$（每項乘 {r}）的總和是多少？
== {S}
---
等比級數：首項 {a}、公比 {r}、共 {k+1} 項。$S=\\frac{{{a}({r}^{{{k+1}}}-1)}}{{{r}-1}}=\\frac{{{a}\\times{r**(k+1)-1}}}{{{r-1}}}={S}$。推導：$rS-S$ 中間的項全部消掉，只剩頭尾。
""")
    cnt+=1
print(''.join(out))

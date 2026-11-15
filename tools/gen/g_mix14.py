import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
if want('booth'):
  cnt=0; seen=set()
  while cnt<n:
    M=random.randint(-7,7); Q=random.randint(-8,7)
    if M in (0,1,-1) or Q in (0,1) or (M,Q) in seen: continue
    seen.add((M,Q))
    A=0; q=Q&0xF; q1=0; adds=subs=0; steps=[]
    for i in range(4):
        pair=(q&1,q1)
        if pair==(1,0): A=(A-M)&0xF; subs+=1; act='10→A−M'
        elif pair==(0,1): A=(A+M)&0xF; adds+=1; act='01→A+M'
        else: act=f'{pair[0]}{pair[1]}→不動'
        comb=(A<<5)|(q<<1)|q1
        sign=(A>>3)&1
        comb=(comb>>1)|(sign<<8)
        A=(comb>>5)&0xF; q=(comb>>1)&0xF; q1=comb&1
        steps.append(f'第 {i+1} 輪 {act}，右移後 A=`{A:04b}` Q=`{q:04b}`')
    prod=(A<<4)|q
    if prod>=128: prod-=256
    assert prod==M*Q
    if adds+subs<2: continue
    out.append(f"""@q ar3-? | co-arith#3 | 3 | 追蹤
4 位元 Booth 乘法：被乘數 $M={M}$、乘數 $Q={Q}$（都是二補數）。看 $(Q_0,Q_{{-1}})$：10 做 $A-M$、01 做 $A+M$，然後 $A,Q,Q_{{-1}}$ 一起算術右移，共 4 輪。總共做了幾次加法、幾次減法？乘積是多少？
== {adds},{subs},{M*Q}
?? 加法,減法,乘積
---
$Q={Q}$ 的二補數是 `{Q&0xF:04b}`，$M$＝`{M&0xF:04b}`、$-M$＝`{(-M)&0xF:04b}`。{'；'.join(steps)}。最後 `{A:04b}{q:04b}` 讀成 8 位元二補數是 {M*Q}。Booth 只在乘數的位元「0→1 或 1→0 的交界」做運算，連續的 1 只要一減一加。
""")
    cnt+=1
class Nd:
    def __init__(s,k): s.k=k; s.l=s.r=None; s.h=1
def H(x): return x.h if x else 0
def upd(x): x.h=1+max(H(x.l),H(x.r))
def rr(y):
    x=y.l; y.l=x.r; x.r=y; upd(y); upd(x); return x
def rl(x):
    y=x.r; x.r=y.l; y.l=x; upd(x); upd(y); return y
def ins(t,k,ev):
    if not t: return Nd(k)
    if k<t.k: t.l=ins(t.l,k,ev)
    else: t.r=ins(t.r,k,ev)
    upd(t); b=H(t.l)-H(t.r)
    if b>1:
        if k<t.l.k: ev.append(('LL',t.k)); return rr(t)
        t.l=rl(t.l); ev.append(('LR',t.k)); return rr(t)
    if b<-1:
        if k>t.r.k: ev.append(('RR',t.k)); return rl(t)
        t.r=rr(t.r); ev.append(('RL',t.k)); return rl(t)
    return t
def pre(t): return [t.k]+pre(t.l)+pre(t.r) if t else []
if want('avl'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,60),7); t=None; allev=[]
    for k in ks:
        ev=[]; t=ins(t,k,ev); allev+= [(k,)+e for e in ev]
    if len(allev)<2 or not any(e[1] in ('LR','RL') for e in allev): continue
    desc='；'.join(f'插入 {k} 時在 {at} 失衡，{ty} 型' for k,ty,at in allev)
    out.append(f"""@q bst3-? | ds-bst#3 | 3 | 追蹤
依序把 {', '.join(map(str,ks))} 插入一棵空的 AVL 樹。總共做了幾次失衡調整（左左、右右、左右、右左四種型，每處理一次算一次）？最後的前序走訪是？
== {len(allev)},{' '.join(map(str,pre(t)))}
?? 調整次數,前序（空格隔開）
---
{desc}。LL／RR 型做一次單旋轉，LR／RL 型先轉孩子再轉自己（雙旋轉），都只在「從新節點往上第一個失衡的祖先」處理一次。最後前序 {' '.join(map(str,pre(t)))}，樹高 {t.h-1}（根的深度 0）。
""")
    cnt+=1
if want('qp'):
  cnt=0
  while cnt<n:
    m=11; mode=random.choice(['quad','dbl'])
    ks=random.sample(range(10,99),7); T=[None]*m; col=0; log=[]
    ok=True
    for k in ks:
        h1=k%m; h2=7-(k%7)
        for i in range(m):
            pos=(h1+i*i)%m if mode=='quad' else (h1+i*h2)%m
            if T[pos] is None: T[pos]=k; col+=i; log.append(f'{k}→{pos}' + (f'（撞 {i} 次）' if i else '')); break
        else: ok=False
    if not ok or col<3: continue
    rule='$h(k,i)=(k\\bmod 11+i^2)\\bmod 11$（二次探測）' if mode=='quad' else '$h(k,i)=(k\\bmod 11+i\\cdot h_2(k))\\bmod 11$，$h_2(k)=7-(k\\bmod 7)$（雙重雜湊）'
    out.append(f"""@q hs3-? | ds-hash#3 | 2 | 追蹤
大小 11 的開放定址表，{rule}，$i=0,1,2,\\dots$。依序插入 {', '.join(map(str,ks))}。最後一個 key {ks[-1]} 放在第幾格？全部插入過程總共撞了幾次（找到空格前遇到被佔的格子數）？
== {T.index(ks[-1])},{col}
?? 最後一個的位置,總碰撞
---
依序：{'；'.join(log)}。{'二次探測跳 1、4、9、…格，避開線性探測的「一整串連在一起」' if mode=='quad' else '雙重雜湊的跳距由第二個雜湊函數決定，不同 key 的探測順序不同'}，碰撞比線性探測分散。
""")
    cnt+=1
if want('chain'):
  cnt=0
  while cnt<n:
    m=7; ks=random.sample(range(10,99),random.randint(9,11)); ch=[[] for _ in range(m)]
    for k in ks: ch[k%m].append(k)
    L=max(len(c) for c in ch); succ=F(sum(i+1 for c in ch for i in range(len(c))),len(ks))
    empty=sum(1 for c in ch if not c)
    out.append(f"""@q hs2-? | ds-hash#2 | 2 | 計算
鏈結法雜湊表 7 格，$h(k)=k\\bmod 7$，新的 key 接在串列尾端。依序插入 {', '.join(map(str,ks))}。最長的串列有幾個？每個 key 各搜尋一次（成功搜尋），平均要比較幾次？（分數）
== {L},{fr(succ)}
?? 最長串列,平均比較次數
---
各格：{'；'.join(f'{i}：'+('→'.join(map(str,c)) if c else '空') for i,c in enumerate(ch))}。成功搜尋第 $j$ 個位置的 key 要比較 $j$ 次，總和 {sum(i+1 for c in ch for i in range(len(c)))}，除以 {len(ks)} 得 {fr(succ)}。負載因子 $\\alpha={len(ks)}/7$，理論上成功搜尋約 $1+\\alpha/2$ 次。
""")
    cnt+=1
if want('nonhom'):
  cnt=0; seen=set()
  while cnt<n:
    r=random.choice([2,3,4,-2]); B=random.randint(-5,5); a0=random.randint(-3,6)
    if B==0 or (r,B,a0) in seen: continue
    seen.add((r,B,a0))
    d=B*(1-r); A=a0-B
    if A==0: continue
    seq=[a0]
    for i in range(4): seq.append(r*seq[-1]+d)
    sd=f'+{d}' if d>0 else f'{d}'
    pa0=f'({a0})' if a0<0 else str(a0)
    pA=str(A); pr=f'({r})' if r<0 else str(r); pB=f'({B})' if B<0 else str(B)
    out.append(f"""@q rg3-? | dm-recur-gf#3 | 3 | 計算
$a_n={r}a_{{n-1}}{sd}$，$a_0={a0}$。寫成 $a_n=A\\cdot({r})^n+B$，$A$、$B$ 各是多少？
== {A},{B}
?? A,B
---
特解找常數 $B$：$B={r}B{sd}$，得 $B={B}$。齊次解 $A({r})^n$，用 $a_0={a0}$：$A+B={a0}$，$A={A}$。驗算：$a_1={r}\\times{pa0}{sd}={seq[1]}$，公式 ${pA}\\times{pr}+{pB}={A*r+B}$ ✓；$a_2={seq[2]}$、公式 ${pA}\\times{r*r}+{pB}={A*r*r+B}$ ✓。
""".replace('+-','-'))
    cnt+=1
if want('gfc'):
  cnt=0; seen=set()
  while cnt<n:
    m=random.randint(3,5); c=random.choice([2,3]); k=random.randint(c+2,m*c-1)
    if (m,c,k) in seen: continue
    seen.add((m,c,k))
    cnt_=sum(1 for t in itertools.product(range(c+1),repeat=m) if sum(t)==k)
    terms=[]
    for j in range(0,m+1):
        rest=k-(c+1)*j
        if rest<0: break
        terms.append((j,math.comb(m,j)*math.comb(rest+m-1,m-1)))
    chk=sum((-1)**j*v for j,v in terms); assert chk==cnt_
    poly='+'.join(['1','x']+[f'x^{{{i}}}' for i in range(2,c+1)])
    ie=' - '.join(f'{v}' for j,v in terms) if len(terms)>1 else str(terms[0][1])
    ie=''.join((('+' if j%2==0 else '-') if j>0 else '')+str(v) for j,v in terms)
    out.append(f"""@q rg5-? | dm-recur-gf#5 | 3 | 計算
$({poly})^{{{m}}}$ 展開後，$x^{{{k}}}$ 的係數是多少？
== {cnt_}
---
係數＝把 {k} 寫成 {m} 個數字的和、每個數字介於 0～{c} 的方法數（每個括號挑一個 $x^{{t}}$）。用 $1+x+\\dots+x^{{{c}}}=\\frac{{1-x^{{{c+1}}}}}{{1-x}}$ 加排容：$\\sum_j(-1)^j\\binom{{{m}}}{{j}}\\binom{{{k}-{c+1}j+{m-1}}}{{{m-1}}}={ie}={cnt_}$。
""")
    cnt+=1
def det3(M): 
    a,b,c=M[0];d,e,f=M[1];g,h,i=M[2]
    return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
if want('cramer'):
  cnt=0
  while cnt<n:
    A=[[random.randint(-3,4) for _ in range(3)] for _ in range(3)]; b=[random.randint(-5,6) for _ in range(3)]
    D=det3(A)
    if D==0 or abs(D)>30: continue
    j=random.randint(0,2)
    Aj=[[b[r] if c==j else A[r][c] for c in range(3)] for r in range(3)]
    Dj=det3(Aj); x=F(Dj,D)
    nm='xyz'[j]
    eqs='' if (x.numerator==Dj and x.denominator==D) else '='+fr(x)
    out.append(f"""@q dt3-? | la-det#3 | 2 | 計算
用 Cramer 法則解 ${mat(A)}\\left[\\begin{{smallmatrix}}x\\\\y\\\\z\\end{{smallmatrix}}\\right]=\\left[\\begin{{smallmatrix}}{b[0]}\\\\{b[1]}\\\\{b[2]}\\end{{smallmatrix}}\\right]$，只求 ${nm}$。（可用分數）
== {fr(x)}
---
$\\det A={D}$。把第 {j+1} 行換成右邊的向量得 $A_{{{j+1}}}={mat(Aj)}$，$\\det A_{{{j+1}}}={Dj}$。${nm}=\\det A_{{{j+1}}}/\\det A=\\frac{{{Dj}}}{{{D}}}{eqs}$。只要一個未知數時，Cramer 只需算兩個行列式，比整個消去快。
""")
    cnt+=1
if want('apow'):
  cnt=0; seen=set()
  Ps=[[[1,1],[1,2]],[[1,1],[0,1]],[[2,1],[1,1]],[[1,2],[1,1]],[[1,0],[1,1]],[[1,1],[1,0]]]
  while cnt<n:
    P=random.choice(Ps); l1,l2=random.sample([-1,1,2,3],2); k=random.randint(4,6)
    key=(str(P),l1,l2,k)
    if key in seen: continue
    seen.add(key)
    dp=P[0][0]*P[1][1]-P[0][1]*P[1][0]
    Pi=[[F(P[1][1],dp),F(-P[0][1],dp)],[F(-P[1][0],dp),F(P[0][0],dp)]]
    def mul(X,Y): return [[sum(X[i][t]*Y[t][j] for t in range(2)) for j in range(2)] for i in range(2)]
    Dm=[[l1,0],[0,l2]]; A=mul(mul(P,Dm),Pi); Dk=[[l1**k,0],[0,l2**k]]; Ak=mul(mul(P,Dk),Pi)
    if any(x.denominator!=1 for r in A for x in r): continue
    out.append(f"""@q ei2-? | la-eigen#2 | 3 | 計算
$A={mat(A)}$。用對角化求 $A^{{{k}}}$。（依左上、右上、左下、右下）
== {','.join(fr(x) for r in Ak for x in r)}
---
特徵值 ${l1}$、${l2}$（跡 ${l1+l2}$、行列式 ${l1*l2}$），特徵向量依序 $({P[0][0]},{P[1][0]})$、$({P[0][1]},{P[1][1]})$。$A=PDP^{{-1}}$，$P={mat(P)}$、$P^{{-1}}={mat(Pi)}$，所以 $A^{{{k}}}=P\\,\\mathrm{{diag}}({l1**k},{l2**k})\\,P^{{-1}}={mat(Ak)}$。中間的 $P^{{-1}}P$ 全部抵消，只需要把對角線各自 {k} 次方。
""")
    cnt+=1
if want('sjf'):
  cnt=0
  while cnt<n:
    N=random.choice([4,5]); arr=sorted(random.sample(range(0,8),N)); arr[0]=0
    bur=[random.randint(1,8) for _ in range(N)]
    names=[f'P{i+1}' for i in range(N)]
    t=0; done=set(); gantt=[]; fin={}; start={}
    while len(done)<N:
        av=[i for i in range(N) if i not in done and arr[i]<=t]
        if not av: t=min(arr[i] for i in range(N) if i not in done); continue
        i=min(av,key=lambda x:(bur[x],arr[x],x)); start[i]=t; t+=bur[i]; fin[i]=t; done.add(i); gantt.append(f'{names[i]}({start[i]}–{t})')
    tat=F(sum(fin[i]-arr[i] for i in range(N)),N); wt=F(sum(fin[i]-arr[i]-bur[i] for i in range(N)),N)
    order=[g.split('(')[0] for g in gantt]
    if order==[names[i] for i in sorted(range(N),key=lambda x:arr[x])]: continue
    tbl='、'.join(f'{names[i]}（到達 {arr[i]}、需要 {bur[i]}）' for i in range(N))
    out.append(f"""@q sc2-? | os-sched#2 | 2 | 計算
非搶占式 SJF（同樣長時先到的優先）：{tbl}。平均周轉時間和平均等待時間各是多少？（可用分數）
== {fr(tat)},{fr(wt)}
?? 平均周轉,平均等待
---
甘特圖：{' '.join(gantt)}。周轉＝完成−到達：{'、'.join(f'{names[i]} {fin[i]-arr[i]}' for i in range(N))}，平均 {fr(tat)}。等待＝周轉−執行：{'、'.join(f'{names[i]} {fin[i]-arr[i]-bur[i]}' for i in range(N))}，平均 {fr(wt)}。非搶占式一旦開始就做到完，短工作晚到時只能等目前的做完。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
def rank(M):
    M=[[F(x) for x in r] for r in M]; r=0
    for c in range(len(M[0])):
        p=next((i for i in range(r,len(M)) if M[i][c]!=0),None)
        if p is None: continue
        M[r],M[p]=M[p],M[r]
        for i in range(len(M)):
            if i!=r and M[i][c]!=0:
                f=M[i][c]/M[r][c]; M[i]=[a-f*b for a,b in zip(M[i],M[r])]
        r+=1
    return r
if want('bstdel'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,60),random.randint(8,9))
    T={}
    root=ks[0]; L={}; R={}
    def ins(k):
        x=root
        while True:
            if k<x:
                if x in L: x=L[x]
                else: L[x]=k; return
            else:
                if x in R: x=R[x]
                else: R[x]=k; return
    for k in ks[1:]: ins(k)
    two=[k for k in ks if k in L and k in R]
    if not two: continue
    d=random.choice(two)
    s=R[d]
    while s in L: s=L[s]
    new=[k for k in ks if k!=d]
    # rebuild: deletion by successor copy = tree where d's key replaced by s and s node removed
    def pre(x,repl):
        if x is None: return []
        if x==s and repl: # remove successor node: replaced by its right child
            return pre(R.get(x),repl)
        k=s if (x==d and repl) else x
        return [k]+pre(L.get(x),repl)+pre(R.get(x),repl)
    # careful: when s is direct right child of d
    def pre2(x):
        if x is None: return []
        if x==s: return pre2(R.get(x))
        k=s if x==d else x
        return [k]+pre2(L.get(x))+pre2(R.get(x))
    res=pre2(root)
    assert sorted(res)==sorted(new)
    out.append(f"""@q bst2-? | ds-bst#2 | 3 | 追蹤
依序把 {', '.join(map(str,ks))} 插入空的二元搜尋樹，再刪除 {d}（它有兩個孩子，用中序後繼者取代）。刪除後的前序走訪是？
== {' '.join(map(str,res))}
---
{d} 的後繼者是右子樹最左邊的點 {s}。把 {s} 的值搬到 {d} 的位置，再刪掉原本的 {s} 節點（它沒有左孩子，用它的右孩子{'（'+str(R[s])+'）' if s in R else '（空）'}接上）。刪除後前序 {' '.join(map(str,res))}；中序仍然由小到大，BST 性質保持。
""")
    cnt+=1
if want('hoare'):
  cnt=0
  while cnt<n:
    A=random.sample(range(1,40),random.randint(7,9)); B=A[:]
    x=B[0]; i=-1; j=len(B); sw=[]
    while True:
        j-=1
        while B[j]>x: j-=1
        i+=1
        while B[i]<x: i+=1
        if i<j: B[i],B[j]=B[j],B[i]; sw.append(f'交換 {B[j]}、{B[i]}')
        else: break
    if len(sw)<2: continue
    out.append(f"""@q srt3-? | ds-sort#3 | 3 | 追蹤
Hoare 分割（CLRS 版本：pivot $x=A[\\text{{lo}}]$；`j` 從右往左找 $\\le x$、`i` 從左往右找 $\\ge x$，`i < j` 就交換，否則回傳 `j`）處理 {', '.join(map(str,A))}。分割完的陣列是？回傳的 `j`（從 0 起算）是？
== {' '.join(map(str,B))},{j}
?? 陣列（空格隔開）,j
---
pivot {x}。依序{'；'.join(sw)}；之後 `i` 和 `j` 交錯（i={i}、j={j}），回傳 {j}。結果：第 0～{j} 格都 $\\le{x}$、第 {j+1} 格以後都 $\\ge{x}$——但 pivot 不一定在最終位置，這點和 Lomuto 不同。
""")
    cnt+=1
if want('csort'):
  cnt=0
  while cnt<n:
    k=random.choice([4,5]); A=[random.randint(0,k) for _ in range(random.randint(8,10))]
    C=[A.count(v) for v in range(k+1)]; P=list(itertools.accumulate(C))
    if 0 in C and C.count(0)>1: continue
    t=random.randrange(len(A)); v=A[t]
    # stable: scanning right to left, position of A[t]
    same_after=sum(1 for q in range(t+1,len(A)) if A[q]==v)
    pos=P[v]-1-same_after
    out.append(f"""@q srt4-? | ds-sort#4 | 2 | 追蹤
計數排序 `A = [{', '.join(map(str,A))}]`（值 0～{k}）。做完累加後的 `C`（`C[i]`＝小於等於 i 的個數）是？由右往左放回時，第 {t} 格（從 0 起算）的那個 {v} 會放到輸出的第幾格（從 0 起算）？
== {' '.join(map(str,P))},{pos}
?? C（空格隔開）,位置
---
次數 C＝{' '.join(map(str,C))}，累加得 {' '.join(map(str,P))}。由右往左掃：值 {v} 每放一個就把 `C[{v}]` 減 1，放到 `C[{v}]−1`。第 {t} 格的 {v} 右邊還有 {same_after} 個 {v} 先被放，所以位置是 ${P[v]}-1-{same_after}={pos}$。由右往左才能保證穩定（同值保持原順序）。
""")
    cnt+=1
if want('frac'):
  cnt=0
  while cnt<n:
    N=random.randint(4,5); items=[(random.randint(2,8),random.randint(5,40)) for _ in range(N)]
    W=random.randint(8,16)
    if sum(w for w,v in items)<=W: continue
    order=sorted(range(N),key=lambda i:-F(items[i][1],items[i][0]))
    cap=W; val=F(0); steps=[]
    for i in order:
        w,v=items[i]
        if cap>=w: cap-=w; val+=v; steps.append(f'#{i+1} 全拿（+{v}）')
        else:
            if cap>0: val+=F(v*cap,w); steps.append(f'#{i+1} 拿 {cap}/{w}（+{fr(F(v*cap,w))}）')
            cap=0; break
    if F(val).denominator==1 and random.random()<0.5: continue
    out.append(f"""@q gd4-? | al-greedy#4 | 2 | 計算
分數背包容量 {W}。物品（重量, 價值）：{'、'.join(f'#{i+1} ({w}, {v})' for i,(w,v) in enumerate(items))}。可以只拿一部分，最大總價值是多少？（可用分數）
== {fr(val)}
---
照「價值／重量」由大到小：{'、'.join(f'#{i+1} {fr(F(items[i][1],items[i][0]))}' for i in order)}。依序 {'、'.join(steps)}，總價值 {fr(val)}。分數背包貪婪一定最佳（換一點點重量給單價高的不會變差）；0/1 背包就不行。
""")
    cnt+=1
if want('cross'):
  cnt=0
  while cnt<n:
    A=[random.randint(-9,9) for _ in range(8)]; mid=3
    s=0; bl=-10**9; li=None
    for i in range(mid,-1,-1):
        s+=A[i]
        if s>bl: bl=s; li=i
    s=0; br=-10**9; ri=None
    for j in range(mid+1,8):
        s+=A[j]
        if s>br: br=s; ri=j
    best=max(sum(A[i:j+1]) for i in range(8) for j in range(i,8))
    out.append(f"""@q dc1-? | al-dc#1 | 2 | 計算
最大子陣列的分治法：`A = [{', '.join(map(str,A))}]`，切成第 0～3 格和第 4～7 格。「跨過中間」的最大和怎麼算？從第 3 格往左延伸的最大和、從第 4 格往右延伸的最大和、跨中間的最大和各是多少？
== {bl},{br},{bl+br}
?? 往左,往右,跨中間
---
往左：從 A[3] 開始累加 {', '.join(str(sum(A[i:mid+1])) for i in range(mid,-1,-1))}，最大 {bl}（到第 {li} 格）。往右：從 A[4] 開始累加 {', '.join(str(sum(A[mid+1:j+1])) for j in range(mid+1,8))}，最大 {br}（到第 {ri} 格）。跨中間＝{bl}＋{br}＝{bl+br}。整個問題的答案是左半、右半、跨中間三者的最大值（這題是 {best}）。
""".replace('＋-','−'))
    cnt+=1
exec(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','qa','polyfmt.py'),encoding='utf-8').read())
def cstr(z):
    a,b=int(round(z.real)),int(round(z.imag))
    if b==0: return str(a)
    bs=('' if abs(b)==1 else str(abs(b)))+'i'
    if a==0: return ('-' if b<0 else '')+bs
    return f'{a}{"+" if b>0 else "-"}{bs}'
if want('dft'):
  cnt=0
  while cnt<n:
    a=[random.randint(-3,4) for _ in range(4)]
    ys=[sum(a[j]*(1j)**(j*k) for j in range(4)) for k in range(4)]
    if sum(1 for y in ys if abs(y.imag)>0.5)<2: continue
    out.append(f"""@q dc5-? | al-dc#5 | 3 | 計算
多項式 $A(x)={pf(a)}$ 在 4 個 4 次單位根 $1,\\ i,\\ -1,\\ -i$ 的值（也就是 DFT $y_0,y_1,y_2,y_3$）各是多少？（寫成 $a+bi$，例如 `2-3i`；純實數寫整數）
== {','.join(cstr(y) for y in ys)}
?? y0,y1,y2,y3
---
$\\omega=i$，$y_k=A(i^k)$。$y_0=A(1)={cstr(ys[0])}$；$y_1=A(i)$：$i^2=-1,i^3=-i$，得 {cstr(ys[1])}；$y_2=A(-1)={cstr(ys[2])}$；$y_3=A(-i)={cstr(ys[3])}$（實係數時 $y_3$ 是 $y_1$ 的共軛）。FFT 用偶次項、奇次項分開：$A(x)=A_e(x^2)+xA_o(x^2)$，只要算 $A_e,A_o$ 在 $\\pm1$ 的值。
""")
    cnt+=1
if want('mc'):
  cnt=0; seen=set()
  while cnt<n:
    k=random.choice([2,3,4]); m=random.randint(4,9)
    if (k,m) in seen: continue
    seen.add((k,m))
    r=math.ceil(m/math.log10(k)-1e-12)
    while k**r<10**m: r+=1
    while r>1 and k**(r-1)>=10**m: r-=1
    out.append(f"""@q pb2-? | al-prob#2 | 2 | 計算
某個 Monte Carlo 演算法只有單邊錯誤：答「是」一定對，答「否」時有最多 $1/{k}$ 的機率答錯。獨立重跑 $t$ 次、只要有一次答「是」就答是。要讓答錯機率 $\\le10^{{-{m}}}$，$t$ 最少是多少？
== {r}
---
$t$ 次都錯的機率 $\\le(1/{k})^t$。要 ${k}^t\\ge10^{{{m}}}$：$t\\ge{m}/\\log_{{10}}{k}\\approx{m/math.log10(k):.2f}$，取 $t={r}$（${k}^{{{r}}}={k**r}$）。錯誤率隨次數**指數**下降，所以重跑幾十次就能讓錯誤小到可以忽略。
""")
    cnt+=1
if want('hh'):
  cnt=0
  while cnt<n:
    dim=random.choice([2,3]); v=[random.randint(-2,2) for _ in range(dim)]; x=[random.randint(-3,4) for _ in range(dim)]
    vv=sum(a*a for a in v); vx=sum(a*b for a,b in zip(v,x))
    if vv==0 or vx==0 or sum(1 for a in v if a)<2: continue
    c=F(2*vx,vv); Hx=[F(b)-c*a for a,b in zip(v,x)]
    if any(h.denominator>5 for h in Hx): continue
    vec=lambda u:'('+','.join(fr(F(t)) for t in u)+')'
    hs=('-'+fr(c)) if c>0 else ('+'+fr(-c))
    out.append(f"""@q or4-? | la-ortho#4 | 2 | 計算
Householder 反射 $H=I-\\frac{{2vv^T}}{{v^Tv}}$，$v={vec(v)}$。$Hx$，$x={vec(x)}$，等於？（分量用逗號隔開，可用分數）
== {','.join(fr(h) for h in Hx)}
---
不用真的寫出 $H$：$Hx=x-\\frac{{2(v\\cdot x)}}{{v\\cdot v}}v$。$v\\cdot x={vx}$、$v\\cdot v={vv}$，係數 ${fr(c)}$，$Hx={vec(x)}{hs}\\,{vec(v)}={vec(Hx)}$。檢查長度：$\\|Hx\\|^2={fr(sum(h*h for h in Hx))}=\\|x\\|^2={sum(t*t for t in x)}$——反射是正交變換，保長度。
""")
    cnt+=1
def det3(M):
    a,b,c=M[0];d,e,f=M[1];g,h,i=M[2]
    return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
if want('inv3'):
  cnt=0
  while cnt<n:
    A=[[random.randint(-2,3) for _ in range(3)] for _ in range(3)]; D=det3(A)
    if D==0 or abs(D)>6: continue
    i,j=random.sample(range(3),2)
    minor=[[A[r][c] for c in range(3) if c!=i] for r in range(3) if r!=j]
    Cji=(-1)**(i+j)*(minor[0][0]*minor[1][1]-minor[0][1]*minor[1][0])
    val=F(Cji,D)
    if val==0: continue
    out.append(f"""@q ls2-? | la-systems#2 | 2 | 計算
$A={mat(A)}$。$A^{{-1}}$ 第 {i+1} 列第 {j+1} 行的元素是多少？（可用分數）
== {fr(val)}
---
$A^{{-1}}=\\frac{{1}}{{\\det A}}\\,\\mathrm{{adj}}(A)$，而 $(A^{{-1}})_{{{i+1}{j+1}}}=C_{{{j+1}{i+1}}}/\\det A$（注意下標要對調）。$\\det A={D}$；刪掉第 {j+1} 列第 {i+1} 行的子式 ${mat(minor)}$，行列式 {minor[0][0]*minor[1][1]-minor[0][1]*minor[1][0]}，乘上 $(-1)^{{{i+j+2}}}$ 得 $C_{{{j+1}{i+1}}}={Cji}$。答案 $\\frac{{{Cji}}}{{{D}}}={fr(val)}$。
""")
    cnt+=1
if want('lt'):
  cnt=0
  while cnt<n:
    m=random.choice([2,3]); k=3
    M=[[random.randint(-2,2) for _ in range(k)] for _ in range(m)]
    if m==3 and random.random()<0.7: M[2]=[M[0][t]+M[1][t] for t in range(k)]
    if any(all(x==0 for x in r) for r in M): continue
    r=rank(M)
    def comp(row):
        s=''
        for co,vn in zip(row,'xyz'):
            if co==0: continue
            s+=('+' if co>0 and s else ('-' if co<0 else ''))+('' if abs(co)==1 else str(abs(co)))+vn
        return s
    T='('+', '.join(comp(rw) for rw in M)+')'
    out.append(f"""@q vs3-? | la-vs#3 | 2 | 計算
線性變換 $T:\\mathbb R^3\\to\\mathbb R^{{{m}}}$，$T(x,y,z)={T}$。$\\ker T$ 和 $\\mathrm{{range}}\\,T$ 的維度各是？
== {3-r},{r}
?? ker,range
---
$T$ 的矩陣是 ${mat(M)}$，秩 {r}{'（第 3 列＝第 1 列＋第 2 列）' if m==3 and M[2]==[M[0][t]+M[1][t] for t in range(k)] else ''}。值域維度＝秩＝{r}；由秩–零度定理，$\\dim\\ker T=3-{r}={3-r}$。
""")
    cnt+=1
if want('egf'):
  cnt=0; seen=set()
  conds={'any':('任意',{1:F(1)}),'even':('偶數個',{1:F(1,2),-1:F(1,2)}),'odd':('奇數個',{1:F(1,2),-1:F(-1,2)}),'pos':('至少 1 個',{1:F(1),0:F(-1)})}
  while cnt<n:
    ca=random.choice(['even','odd','pos']); cb=random.choice(['any','even','odd','pos']); N=random.randint(4,6)
    if (ca,cb,N) in seen: continue
    seen.add((ca,cb,N))
    def ok(s):
        def chk(c,cntv):
            return c=='any' or (c=='even' and cntv%2==0) or (c=='odd' and cntv%2==1) or (c=='pos' and cntv>=1)
        return chk(ca,s.count('a')) and chk(cb,s.count('b'))
    tot=sum(1 for s in itertools.product('abc',repeat=N) if ok(s))
    prod={0:F(1)}
    for c in (ca,cb,'any'):
        new={}
        for e1,c1 in prod.items():
            for e2,c2 in conds[c][1].items(): new[e1+e2]=new.get(e1+e2,0)+c1*c2
        prod=new
    val=sum(cf*(e**N) for e,cf in prod.items() if e!=0)
    assert val==tot
    def lf(q):
        s='-' if q<0 else ''
        q=abs(q)
        return s+(str(q.numerator) if q.denominator==1 else BS+'frac{'+str(q.numerator)+'}{'+str(q.denominator)+'}')
    terms='+'.join(lf(cf)+BS+'cdot'+(str(e) if e>=0 else '('+str(e)+')')+'^{'+str(N)+'}' for e,cf in sorted(prod.items(),reverse=True) if e!=0 and cf!=0).replace('+-','-')
    egfs={'any':'e^x','even':'\\frac{e^x+e^{-x}}2','odd':'\\frac{e^x-e^{-x}}2','pos':'(e^x-1)'}
    out.append(f"""@q rg6-? | dm-recur-gf#6 | 3 | 計算
用 a、b、c 組成長度 {N} 的字串，要求 a 出現{conds[ca][0]}、b 出現{conds[cb][0]}（c 不限）。有幾種？
== {tot}
---
字母有順序、可重複，用指數生成函數：a 的部分 ${egfs[ca]}$、b 的部分 ${egfs[cb]}$、c 的部分 $e^x$。相乘展開成 $\\sum c_k e^{{kx}}$，$x^{{{N}}}/{N}!$ 的係數是 $\\sum c_k k^{{{N}}}$：${terms}={tot}$。（$e^{{0x}}$ 的常數項對 $n\\ge1$ 沒有貢獻。）
""")
    cnt+=1
if want('reloc'):
  cnt=0
  while cnt<n:
    B=random.choice([1400,3000,12000,24000,30004]); Lm=random.choice([500,1200,2000,4096])
    ads=random.sample(range(0,int(Lm*1.4)),3)
    if all(a<Lm for a in ads) or all(a>=Lm for a in ads): continue
    res=[str(B+a) if a<Lm else 'trap' for a in ads]
    out.append(f"""@q me1-? | os-memory#1 | 2 | 計算
執行時期繫結：relocation（base）暫存器 {B}、limit 暫存器 {Lm}。程式的邏輯位址 {', '.join(map(str,ads))} 轉換成實體位址依序是？越界的寫 trap。
== {','.join(res)}
---
先檢查邏輯位址 $<$ limit（{Lm}），合法才加上 base：{'；'.join((f'{a}<{Lm}，{B}+{a}={B+a}' if a<Lm else f'{a}≥{Lm}，越界 trap') for a in ads)}。程式本身只看到從 0 開始的邏輯位址，被搬到別處只要改 base，不用改程式。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('kad'):
  cnt=0
  while cnt<n:
    a=[random.randint(-9,9) for _ in range(9)]
    best=(-10**9,0,0)
    for i in range(9):
        for j in range(i,9):
            s=sum(a[i:j+1])
            if s>best[0]: best=(s,i,j)
    if best[1]==0 and best[2]==8: continue
    if sum(1 for x in a if x<0)<3: continue
    out.append(f"""@q dc1-? | al-dc#1 | 2 | 計算
陣列 {', '.join(map(str,a))}。和最大的連續子陣列，和是多少？
== {best[0]}
---
最大的一段是第 {best[1]+1} 到第 {best[2]+1} 個：{', '.join(map(str,a[best[1]:best[2]+1]))}，和 {best[0]}。分治法：答案要嘛在左半、要嘛在右半、要嘛跨中間（從中間往兩邊各找最大的延伸），$O(n\\lg n)$；Kadane 掃一遍「以這裡結尾的最大和」可做到 $O(n)$。
""")
    cnt+=1
if want('spt'):
  cnt=0
  while cnt<n:
    p=random.sample(range(1,15),5)
    s=sorted(p); comp=list(itertools.accumulate(s)); orig=list(itertools.accumulate(p))
    if sum(orig)==sum(comp): continue
    out.append(f"""@q gd1-? | al-greedy#1 | 2 | 計算
一台機器要依序處理 5 個工作，處理時間依到達順序是 {', '.join(map(str,p))}（都在時間 0 就到了）。照到達順序做，和照「處理時間短的先做」，各工作完成時間的總和各是多少？
== {sum(orig)},{sum(comp)}
?? 照到達順序,短的先做
---
照到達順序：完成時間 {', '.join(map(str,orig))}，總和 {sum(orig)}。短的先做（{', '.join(map(str,s))}）：完成時間 {', '.join(map(str,comp))}，總和 {sum(comp)}，這是最小值：排在第 $i$ 個的工作會被後面 $n-i$ 個工作「等」，所以越短的越該放前面。
""")
    cnt+=1
if want('cp'):
  cnt=0
  while cnt<n:
    V=['A','B','C','D','E','F']; dur={v:random.randint(1,6) for v in V}
    E=set()
    for i in range(6):
        for j in range(i+1,6):
            if random.random()<0.4: E.add((V[i],V[j]))
    ES={}
    for v in V:
        ES[v]=max([ES[u]+dur[u] for u,w in E if w==v],default=0)
    L=max(ES[v]+dur[v] for v in V)
    if len(E)<5: continue
    # critical path
    end=max(V,key=lambda v:ES[v]+dur[v]); path=[end]
    while True:
        pr=[u for u,w in E if w==path[-1] and ES[u]+dur[u]==ES[path[-1]]]
        if not pr: break
        path.append(pr[0])
    path=path[::-1]
    out.append(f"""@q sp6-? | al-sp#6 | 3 | 計算
專案有 6 個工作，工期：{'、'.join(f'{v} {dur[v]} 天' for v in V)}。先後關係（左邊做完右邊才能開始）：{'、'.join(f'{u}→{w}' for u,w in sorted(E))}。工作可以平行進行，整個專案最少要幾天？
== {L}
---
依拓撲順序算每個工作最早開始時間（所有前置工作的「最早開始＋工期」取最大）：{'、'.join(f'{v}:{ES[v]}' for v in V)}。專案長度＝最晚結束的那個 $=${L} 天。一條關鍵路徑是 {'→'.join(path)}，上面任一工作延誤都會延誤整個專案。
""".replace('$=$','＝'))
    cnt+=1
if want('cnt'):
  cnt=0
  while cnt<n:
    N=random.randint(20,100)
    flips=sum(N//(2**i) for i in range(10))
    out.append(f"""@q bam4-? | ds-amortized#4 | 2 | 計算
二進位計數器從 0 開始做 {N} 次加 1。所有位元總共翻轉了幾次？平均每次加 1 翻轉幾次（四捨五入到小數第二位）？
== {flips},{flips/N:.2f}
?? 總翻轉次數,平均
---
第 $i$ 位（從 0 起算）每 $2^i$ 次加 1 翻轉一次，共 $\\lfloor {N}/2^i\\rfloor$ 次，加起來 {'+'.join(str(N//2**i) for i in range(10) if N//2**i)}＝{flips}。平均 ${flips}/{N}\\approx{flips/N:.2f}<2$，這就是攤銷 $O(1)$ 的意思：雖然偶爾一次要翻很多位，但總和不超過 $2n$。
""")
    cnt+=1
if want('hop'):
  cnt=0
  while cnt<n:
    def push(h,x):
        h.append(x); i=len(h)-1
        while i>0 and h[(i-1)//2]>h[i]: h[i],h[(i-1)//2]=h[(i-1)//2],h[i]; i=(i-1)//2
    def pop(h):
        r=h[0]; h[0]=h[-1]; h.pop(); i=0; N=len(h)
        while True:
            l,rr=2*i+1,2*i+2; m=i
            if l<N and h[l]<h[m]: m=l
            if rr<N and h[rr]<h[m]: m=rr
            if m==i: break
            h[i],h[m]=h[m],h[i]; i=m
        return r
    a=random.sample(range(1,50),7); h=[]
    for x in a: push(h,x)
    ins=list(h)
    pop(h); pop(h)
    x=random.randint(1,50)
    if x in a: continue
    push(h,x)
    out.append(f"""@q hp1-? | ds-heap#1 | 3 | 追蹤
空的 min-heap（陣列從第 1 格開始）依序插入 {', '.join(map(str,a))}（每次插在最後、往上浮）。接著做兩次「刪除最小值」（拿走根，把最後一個搬到根、往下沉），再插入 {x}。最後陣列依序是？（逗號隔開）
== {','.join(map(str,h))}
---
七次插入後：{', '.join(map(str,ins))}。刪除最小值時拿走根，把最後一格移到根，和較小的孩子比較、一路往下換。兩次之後再插入 {x}，放到最後往上浮。結果 {', '.join(map(str,h))}。檢查：每個父親都不大於孩子。
""")
    cnt+=1
if want('art'):
  cnt=0
  while cnt<n:
    V=list(range(1,8)); E=set()
    while len(E)<8:
        u,v=sorted(random.sample(V,2)); E.add((u,v))
    def conn(vs,es):
        vs=set(vs)
        if not vs: return True
        st=[next(iter(vs))]; seen={st[0]}
        while st:
            u=st.pop()
            for a,b in es:
                for x,y in ((a,b),(b,a)):
                    if x==u and y in vs and y not in seen: seen.add(y); st.append(y)
        return seen==vs
    if not conn(V,E): continue
    arts=[v for v in V if not conn([w for w in V if w!=v],[e for e in E if v not in e])]
    bridges=[e for e in E if not conn(V,[f for f in E if f!=e])]
    if not arts: continue
    out.append(f"""@q gr6-? | ds-graph#6 | 3 | 計算
連通無向圖 7 個點，邊：{'、'.join(f'{u}–{v}' for u,v in sorted(E))}。關節點（拿掉後圖會不連通的點）有幾個？橋有幾條？
== {len(arts)},{len(bridges)}
?? 關節點,橋
---
關節點：{'、'.join(map(str,arts))}。橋：{'、'.join(f'{u}–{v}' for u,v in bridges) if bridges else '沒有'}。不在任何環上的邊就是橋；橋的兩端中度數大於 1 的那一端一定是關節點。用 DFS 的 low 值可以在 $O(V+E)$ 找出全部。
""")
    cnt+=1
if want('span'):
  cnt=0
  while cnt<n:
    V=list(range(5)); E=set()
    while len(E)<7:
        u,v=sorted(random.sample(V,2)); E.add((u,v))
    E=sorted(E)
    def is_tree(es):
        par=list(range(5))
        def f(x):
            while par[x]!=x: x=par[x]
            return x
        for u,v in es:
            a,b=f(u),f(v)
            if a==b: return False
            par[a]=b
        return True
    tcount=sum(1 for c in itertools.combinations(E,4) if is_tree(c))
    if tcount==0: continue
    out.append(f"""@q dg3-? | dm-graph#3 | 3 | 計算
圖有 5 個點 a～e，邊：{'、'.join(f'{"abcde"[u]}–{"abcde"[v]}' for u,v in E)}。這張圖有幾棵不同的生成樹？
== {tcount}
---
生成樹要用 4 條邊連通 5 個點、沒有環。從 7 條邊選 4 條共 $\\binom74=35$ 種，扣掉有環或不連通的，剩 {tcount} 種。也可以用「刪掉一條邊、或把它縮起來」的遞迴：$\\tau(G)=\\tau(G-e)+\\tau(G/e)$。
""")
    cnt+=1
if want('bez'):
  cnt=0
  while cnt<n:
    a=random.randint(40,200); b=random.randint(15,a-1); g=math.gcd(a,b)
    if a%b==0 or (a%b)%(b%(a%b) if b%(a%b) else 1)==0 and False: continue
    nsteps=0; aa,bb=a,b
    while bb: aa,bb=bb,aa%bb; nsteps+=1
    if nsteps<3: continue
    # extended euclid
    def eg(a,b):
        if b==0: return (a,1,0)
        g,x,y=eg(b,a%b); return (g,y,x-(a//b)*y)
    g,x,y=eg(a,b)
    # normalize smallest positive x
    step=b//g
    x0=x%step
    if x0==0: x0=step
    y0=(g-a*x0)//b
    steps=[]; aa,bb=a,b
    while bb: steps.append(f'{aa}={aa//bb}\\times{bb}+{aa%bb}'); aa,bb=bb,aa%bb
    out.append(f"""@q nt1-? | dm-nt-algebra#1 | 3 | 計算
用歐幾里得演算法求 $\\gcd({a},{b})$，並找整數 $x,y$ 使 ${a}x+{b}y=\\gcd({a},{b})$，其中 $x$ 取最小的正整數。$\\gcd$、$x$、$y$ 各是？
== {g},{x0},{y0}
?? gcd,x,y
---
輾轉相除：${'$、$'.join(steps)}$，最後一個非零的餘數 {g} 就是 gcd。往回代可得一組解，所有解是 $x=x_0+{step}t$、$y=y_0-{a//g}t$，取最小正的 $x={x0}$，$y={y0}$。驗算：${a}\\times{x0}+{b}\\times({y0})={a*x0+b*y0}$。
""")
    cnt+=1
if want('rsa'):
  cnt=0
  while cnt<n:
    p,q=random.sample([5,7,11,13,17,19],2); N=p*q; phi=(p-1)*(q-1)
    e=random.choice([3,5,7,11,13])
    if math.gcd(e,phi)!=1 or e>=phi: continue
    d=pow(e,-1,phi); m=random.randint(2,N-1)
    if math.gcd(m,N)!=1: continue
    c=pow(m,e,N)
    out.append(f"""@q nt3-? | dm-nt-algebra#3 | 3 | 計算
RSA：$p={p}$、$q={q}$、公鑰指數 $e={e}$。私鑰 $d$ 是多少（$0<d<\\varphi(n)$）？明文 $m={m}$ 加密後的密文 $c$ 是多少？
== {d},{c}
?? d,c
---
$n={N}$、$\\varphi(n)=({p}-1)({q}-1)={phi}$。$d$ 是 $e$ 在模 {phi} 下的反元素：${e}\\times{d}={e*d}={e*d//phi}\\times{phi}+1$。加密 $c=m^e\\bmod n={m}^{{{e}}}\\bmod{N}={c}$。解密 $c^d\\bmod n$ 會回到 {m}。
""")
    cnt+=1
if want('rp'):
  cnt=0
  while cnt<n:
    A=[1,2,3]; R=set()
    for a in A:
        for b in A:
            if random.random()<0.45: R.add((a,b))
    if len(R)<3: continue
    refl=all((a,a) in R for a in A); sym=all((b,a) in R for a,b in R)
    anti=all(not((b,a) in R and a!=b) for a,b in R); tran=all((a,d) in R for a,b in R for c,d in R if b==c)
    yn=lambda x:'是' if x else '否'
    out.append(f"""@q rl1-? | dm-relations#1 | 2 | 計算
$\\{{1,2,3\\}}$ 上的關係 $R=\\{{{', '.join(f'({a},{b})' for a,b in sorted(R))}\\}}$。它是不是自反、對稱、反對稱、遞移的？
== {yn(refl)},{yn(sym)},{yn(anti)},{yn(tran)}
?? 自反,對稱,反對稱,遞移
---
自反要 $(1,1),(2,2),(3,3)$ 都在：{'都在' if refl else '缺 '+'、'.join(f'({a},{a})' for a in A if (a,a) not in R)}。對稱要每個 $(a,b)$ 的反向也在：{'成立' if sym else '反例 '+next(f'({a},{b})' for a,b in sorted(R) if (b,a) not in R)}。反對稱不能有 $a\\ne b$ 且兩個方向都在：{'成立' if anti else '反例 '+next(f'({a},{b}) 和 ({b},{a})' for a,b in sorted(R) if a!=b and (b,a) in R)}。遞移要 $(a,b),(b,c)$ 都在時 $(a,c)$ 也在：{'成立' if tran else '反例 '+next(f'({a},{b})、({b},{d}) 但沒有 ({a},{d})' for a,b in sorted(R) for c,d in sorted(R) if b==c and (a,d) not in R)}。
""")
    cnt+=1
print('\n'.join(out))

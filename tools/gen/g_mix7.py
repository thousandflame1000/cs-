import random, sys, math, itertools
from fractions import Fraction as F
from collections import deque
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
# Master theorem
if want('mt'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.choice([1,2,3,4,7,8,9,16]); b=random.choice([2,3,4]); c=random.choice([0,1,2,F(1,2),3]); kk=random.choice([0,0,1])
    crit=math.log(a,b)
    key=(a,b,c,kk)
    if key in seen: continue
    seen.add(key)
    fc=('1' if c==0 else ('n' if c==1 else ('\\sqrt n' if c==F(1,2) else f'n^{c}')))
    if kk: fc=(fc if fc!='1' else '')+('\\lg n')
    if abs(crit-float(c))<1e-9:
        ans=f'\\Theta(n^{{{fr(F(c))}}}\\lg^{{{kk+1}}}n)' if True else ''
        if c==0: ans=f'\\Theta(\\lg^{{{kk+1}}}n)'
        case='第二種情況（$f(n)$ 和 $n^{\\log_ba}$ 同階，多一個 $\\lg n$）'
    elif crit>float(c):
        ans=f'\\Theta(n^{{\\log_{{{b}}}{a}}})' if abs(crit-round(crit))>1e-9 else f'\\Theta(n^{{{round(crit)}}})'
        case='第一種情況（葉子那一層主導）'
    else:
        ans=f'\\Theta({fc})'; case='第三種情況（根那一層主導，regularity 條件成立）'
    ans=ans.replace('n^{1}','n').replace('\\lg^{1}n','\\lg n').replace('n^{1/2}','\\sqrt n').replace('n^{0}','')
    wrong=set()
    cands=[f'\\Theta(n^{{{round(crit)}}})',f'\\Theta({fc})',f'\\Theta({fc}\\lg n)',f'\\Theta(n\\lg n)',f'\\Theta(n^2)',f'\\Theta(n)']
    for w in cands:
        w=w.replace('n^{1}','n')
        if w!=ans and len(wrong)<3 and w not in ('\\Theta()',): wrong.add(w)
    if len(wrong)<3: continue
    import re as _re
    nz=lambda s: _re.sub(r'\^\{(\d)\}', r'^\1', s)
    ans=nz(ans); wrong={nz(w) for w in wrong if nz(w)!=nz(ans)}
    if len(wrong)<3: continue
    opts=[('x',ans)]+[(' ',w) for w in sorted(wrong)][:3]; random.shuffle(opts)
    out.append(f"""@q rc2-? | al-recurrence#2 | 2 | 計算
$T(n)={a if a>1 else ''}T(n/{b})+{fc}$ 的漸近解是？
{chr(10).join(f'[{m}] ${o}$' for m,o in opts)}
---
比較 $f(n)={fc}$ 和 $n^{{\\log_{{{b}}}{a}}}\\approx n^{{{crit:.3g}}}$：屬於主定理{case}，所以 $T(n)={ans}$。
""")
    cnt+=1
# Floyd-Warshall entry
if want('fw'):
  cnt=0
  while cnt<n:
    V=4; E={}
    for i in range(V):
        for j in range(V):
            if i!=j and random.random()<0.45: E[(i,j)]=random.randint(-2,8)
    INF=10**9; d=[[0 if i==j else E.get((i,j),INF) for j in range(V)] for i in range(V)]
    for k in range(V):
        for i in range(V):
            for j in range(V):
                if d[i][k]+d[k][j]<d[i][j]: d[i][j]=d[i][k]+d[k][j]
    if any(d[i][i]<0 for i in range(V)): continue
    if not any(w<0 for w in E.values()): continue
    s,t=random.sample(range(V),2)
    if d[s][t]>=INF//2 or (s,t) in E and E[(s,t)]==d[s][t]: continue
    es='、'.join(f'{i+1}→{j+1} {w}' for (i,j),w in sorted(E.items()))
    out.append(f"""@q sp5-? | al-sp#5 | 3 | 計算
有向圖 4 個點，邊（有負權重、沒有負環）：{es}。用 Floyd–Warshall 求所有點對最短距離。$d[{s+1}][{t+1}]$ 是多少？
== {d[s][t]}
---
$d^{{(k)}}[i][j]=\\min(d^{{(k-1)}}[i][j],\\ d^{{(k-1)}}[i][k]+d^{{(k-1)}}[k][j])$，$k$ 從 1 到 4 依序允許當中間點。最後的距離矩陣第 {s+1} 列是 {', '.join('∞' if x>=INF//2 else str(x) for x in d[s])}，所以 $d[{s+1}][{t+1}]={d[s][t]}$。負權重可以，只要沒有負環（對角線都不小於 0）。
""")
    cnt+=1
# max flow (Edmonds-Karp)
if want('mf'):
  cnt=0
  while cnt<n:
    V=['s','a','b','c','t']; cap={}
    for u in V:
        for v in V:
            if u!=v and u!='t' and v!='s' and random.random()<0.45: cap[(u,v)]=random.randint(2,9)
    def maxflow(cap):
        res=dict(cap); flow=0
        for (u,v) in list(cap):
            res.setdefault((v,u),0)
        while True:
            par={'s':None}; q=deque(['s'])
            while q:
                u=q.popleft()
                for (x,y),c in res.items():
                    if x==u and c>0 and y not in par: par[y]=u; q.append(y)
            if 't' not in par: break
            path=[]; v='t'
            while par[v] is not None: path.append((par[v],v)); v=par[v]
            b=min(res[e] for e in path)
            for (x,y) in path: res[(x,y)]-=b; res[(y,x)]+=b
            flow+=b
        # min cut: reachable set
        S={'s'}; q=deque(['s'])
        while q:
            u=q.popleft()
            for (x,y),c in res.items():
                if x==u and c>0 and y not in S: S.add(y); q.append(y)
        return flow,S
    f,S=maxflow(cap)
    if f<5 or len(cap)<6: continue
    cut=[(u,v) for (u,v) in cap if u in S and v not in S]
    es='、'.join(f'{u}→{v} {c}' for (u,v),c in sorted(cap.items()))
    out.append(f"""@q mf2-? | al-mst-flow#2 | 3 | 計算
網路的容量：{es}。從 s 到 t 的最大流是多少？
== {f}
---
用擴增路徑一直推流，直到殘餘網路找不到 s 到 t 的路。最後從 s 在殘餘網路走得到的點是 {{{', '.join(sorted(S))}}}，對應的割切斷 {'、'.join(f'{u}→{v}({cap[(u,v)]})' for u,v in cut)}，容量和 {sum(cap[e] for e in cut)}，正好等於最大流（最大流最小割定理），可以用來驗算。
""")
    cnt+=1
# bipartite matching
if want('bm'):
  cnt=0
  while cnt<n:
    L=['甲','乙','丙','丁']; R=['A','B','C','D']
    E={(l,r) for l in L for r in R if random.random()<0.38}
    if any(not any((l,r) in E for r in R) for l in L): continue
    best=0
    for perm in itertools.permutations(R):
        best=max(best,sum((L[i],perm[i]) in E for i in range(4)))
    if best==4 or best<2: continue
    adj='；'.join(f'{l}：'+'、'.join(r for r in R if (l,r) in E) for l in L)
    hall=None
    for sz in range(2,5):
        for S in itertools.combinations(L,sz):
            NS={r for l in S for r in R if (l,r) in E}
            if len(NS)<len(S): hall=(S,NS); break
        if hall: break
    hs='、'.join(hall[0]); hn='、'.join(sorted(hall[1]))
    out.append(f"""@q mf3-? | al-mst-flow#3 | 3 | 計算
4 位工人和 4 項工作，每人只會做某些工作：{adj}。每人最多做一項、每項工作最多一人，最多能同時安排幾組？
== {best}
---
最大匹配是 {best}，不到 4。Hall 條件不成立：{hs} 這 {len(hall[0])} 個人會做的工作合起來只有 {hn}，{len(hall[1])} 項，不夠分。最大匹配也可以用最大流算：s 連到每位工人、每項工作連到 t，容量都是 1。
""")
    cnt+=1
# SCC count
if want('scc'):
  cnt=0
  while cnt<n:
    V=list('abcdefg'); E=set()
    while len(E)<10:
        u,v=random.sample(V,2); E.add((u,v))
    reach={v:{v} for v in V}
    ch=True
    while ch:
        ch=False
        for u,v in E:
            if not reach[v]<=reach[u]: reach[u]|=reach[v]; ch=True
    comps=[]; seen=set()
    for v in V:
        if v in seen: continue
        c={w for w in V if w in reach[v] and v in reach[w]}; comps.append(sorted(c)); seen|=c
    if len(comps) in (1,7): continue
    es='、'.join(f'{u}→{v}' for u,v in sorted(E))
    out.append(f"""@q gr5-? | ds-graph#5 | 2 | 計算
有向圖 7 個點 a～g，邊：{es}。有幾個強連通元件？
== {len(comps)}
---
互相走得到的點分在同一個元件：{'、'.join('{'+','.join(c)+'}' for c in comps)}，共 {len(comps)} 個。把每個元件縮成一點後得到的圖沒有環。Kosaraju：先做一次 DFS 記完成時間，再在反向圖上依完成時間由大到小做 DFS。
""")
    cnt+=1
# chromatic number
if want('chi'):
  cnt=0
  while cnt<n:
    V=6; E=set()
    while len(E)<9:
        u,v=sorted(random.sample(range(V),2)); E.add((u,v))
    def chi():
        for k in range(1,V+1):
            for col in itertools.product(range(k),repeat=V):
                if all(col[u]!=col[v] for u,v in E): return k,col
    k,col=chi()
    if k<3: continue
    # clique number
    w=max(len(c) for r in range(1,V+1) for c in itertools.combinations(range(V),r) if all((min(a,b),max(a,b)) in E for a,b in itertools.combinations(c,2)))
    es='、'.join(f'{u+1}–{v+1}' for u,v in sorted(E))
    out.append(f"""@q dg5-? | dm-graph#5 | 3 | 計算
圖有 6 個點，邊：{es}。色數（相鄰的點不同色，最少要幾種顏色）是多少？
== {k}
---
一種用 {k} 色的塗法：{'、'.join(f'{i+1}:{c+1}' for i,c in enumerate(col))}。{'圖中有 '+str(w)+' 個點兩兩相鄰，所以至少要 '+str(w)+' 色。' if w==k else '最大的完全子圖只有 '+str(w)+' 個點，但圖中有奇數長的環等結構，'+str(k-1)+' 色不夠（可以窮舉檢查）。'}
""")
    cnt+=1
# truth table count
if want('tt'):
  cnt=0
  ops=[('\\land',lambda a,b:a and b),('\\lor',lambda a,b:a or b),('\\to',lambda a,b:(not a) or b),('\\leftrightarrow',lambda a,b:a==b)]
  while cnt<n:
    o1,f1=random.choice(ops); o2,f2=random.choice(ops); neg=random.choice([0,1,2])
    def form(p,q,r):
        x=f1(p,q)
        y=(not r) if neg==2 else r
        return f2(x,y) if neg!=1 else f2(not x,y)
    c=sum(form(*v) for v in itertools.product([True,False],repeat=3))
    left=f'(p{o1} q)' if neg!=1 else f'\\lnot(p{o1} q)'
    right='\\lnot r' if neg==2 else 'r'
    if c in (0,8): continue
    hard=('to' in o1 or 'left' in o1) and ('to' in o2 or 'left' in o2)
    dd=3 if hard else 2
    out.append(f"""@q lg1-? | dm-logic#1 | {dd} | 計算
$p,q,r$ 有 8 組真假值。${left} {o2} {right}$ 在幾組下為真？
== {c}
---
逐列算真值表：先算 ${left}$，再和 ${right}$ 用 ${o2}$ 結合。為真的有 {c} 組（為假的 {8-c} 組）。$\\to$ 只有「前真後假」為假，$\\leftrightarrow$ 兩邊相同才為真。
""")
    cnt+=1
# Hasse diagram edges for divisors
if want('hasse'):
  cnt=0
  while cnt<n:
    N=random.choice([12,18,20,24,28,30,36,40,45,48,60,72])
    D=[d for d in range(1,N+1) if N%d==0]
    edges=sum(1 for a in D for b in D if b%a==0 and b!=a and all(not(c!=a and c!=b and c%a==0 and b%c==0) for c in D))
    out.append(f"""@q rl4-? | dm-relations#4 | 2 | 計算
{N} 的所有正因數在「整除」關係下形成偏序集。它有幾個元素？Hasse 圖有幾條邊？
== {len(D)},{edges}
?? 元素個數,邊數
---
因數：{', '.join(map(str,D))}，共 {len(D)} 個。Hasse 圖只畫「中間沒有別人」的覆蓋關係：$a\\mid b$ 而且 $b/a$ 是質數。數每個因數乘上一個質數後仍是 {N} 的因數的次數，加起來 {edges} 條。
""")
    cnt+=1
# binomial coefficient term
if want('bin'):
  cnt=0
  while cnt<n:
    a=random.choice([1,2,3]); b=random.choice([1,-1,2,-2,3]); N=random.choice([4,5,6,7]); k=random.randint(1,N-1)
    coef=math.comb(N,k)*a**(N-k)*b**k
    dd=3 if (b<0 and N>=6) else 2
    xp='x' if N-k==1 else f'x^{{{N-k}}}'; yp='y' if k==1 else f'y^{{{k}}}'
    out.append(f"""@q cn2-? | dm-counting#2 | {dd} | 計算
$({a if a>1 else ''}x{'+' if b>0 else '-'}{abs(b) if abs(b)>1 else ''}y)^{{{N}}}$ 展開後，${xp}{yp}$ 的係數是多少？
== {coef}
---
二項式定理：這一項是 $\\binom{{{N}}}{{{k}}}({a}x)^{{{N-k}}}({b}y)^{{{k}}}$，係數 $\\binom{{{N}}}{{{k}}}\\cdot{a}^{{{N-k}}}\\cdot({b})^{{{k}}}={math.comb(N,k)}\\cdot{a**(N-k)}\\cdot{('('+str(b**k)+')') if b**k<0 else b**k}={coef}$。{'負號的次方是奇數，所以係數為負。' if b<0 and k%2 else ''}
""")
    cnt+=1
print('\n'.join(out))

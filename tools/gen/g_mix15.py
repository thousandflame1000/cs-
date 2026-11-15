import random, sys, math, itertools, heapq
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
if want('prufer'):
  cnt=0
  while cnt<n:
    N=random.randint(6,8); code=[random.randint(1,N) for _ in range(N-2)]
    deg=[1]*(N+1)
    for c in code: deg[c]+=1
    edges=[]; dg=deg[:]
    for c in code:
        leaf=min(v for v in range(1,N+1) if dg[v]==1)
        edges.append((leaf,c)); dg[leaf]-=1; dg[c]-=1
    u,w=[v for v in range(1,N+1) if dg[v]==1]; edges.append((u,w))
    # re-encode to verify and to produce trace
    adj={v:set() for v in range(1,N+1)}
    for a,b in edges: adj[a].add(b); adj[b].add(a)
    seq=[]; trace=[]
    for _ in range(N-2):
        leaf=min(v for v in adj if len(adj[v])==1); nb=next(iter(adj[leaf]))
        seq.append(nb); trace.append(f'拿掉 {leaf}、記 {nb}'); adj[nb].discard(leaf); del adj[leaf]
    assert seq==code
    if len(set(code))<2: continue
    es='、'.join(f'{min(a,b)}–{max(a,b)}' for a,b in sorted((min(a,b),max(a,b)) for a,b in edges))
    out.append(f"""@q dg3-? | dm-graph#3 | 3 | 追蹤
點 1～{N} 的樹，邊：{es}。它的 Prüfer 序列是？（每次拿掉編號最小、度數為 1 的點，記下它的鄰居；逗號隔開）
== {','.join(map(str,code))}
---
{'；'.join(trace)}，剩下兩個點停止。檢查：每個點在序列中出現的次數＝度數−1（葉子不會出現）。Prüfer 序列和「點有編號的樹」一一對應，所以 $n$ 個點的有標號樹共 $n^{{n-2}}$ 棵。
""")
    cnt+=1
if want('planar'):
  cnt=0; seen=set()
  while cnt<n:
    mode=random.choice(['F','comp','bip'])
    if mode=='F':
        V=random.randint(6,12); E=random.randint(V,3*V-6)
        if (mode,V,E) in seen: continue
        seen.add((mode,V,E))
        out.append(f"""@q dg4-? | dm-graph#4 | 2 | 計算
一張**連通**的平面圖有 {V} 個點、{E} 條邊，畫在平面上（邊不交叉）。共有幾個面（含外面那一塊）？
== {E-V+2}
---
歐拉公式 $V-E+F=2$：$F=2-{V}+{E}={E-V+2}$。不管怎麼畫，只要邊不交叉，面數都一樣。簡單平面圖還要滿足 $E\\le3V-6={3*V-6}$，這裡 {E} 沒超過。
""")
    elif mode=='comp':
        k=random.randint(2,4); V=random.randint(8,14); E=random.randint(V-k+1,2*V)
        if (mode,V,E,k) in seen: continue
        seen.add((mode,V,E,k))
        out.append(f"""@q dg4-? | dm-graph#4 | 3 | 計算
一張平面圖（邊不交叉）有 {V} 個點、{E} 條邊，分成 {k} 個連通塊。畫在平面上共有幾個面（含外面那一塊）？
== {E-V+1+k}
---
每個連通塊各自滿足 $V_i-E_i+F_i=2$，但外面那一塊被 {k} 個塊重複算了 {k} 次，要扣回 {k-1}：$V-E+F=1+k$。所以 $F=1+{k}-{V}+{E}={E-V+1+k}$。陷阱：直接用 $V-E+F=2$ 會少算 {k-1} 個。
""")
    else:
        V=random.randint(7,12); E=random.randint(2*V-4-2,2*V-4+3)
        if (mode,V,E) in seen: continue
        seen.add((mode,V,E))
        ok=E<=2*V-4
        out.append(f"""@q dg4-? | dm-graph#4 | 3 | 計算
一張簡單**二分**圖有 {V} 個點、{E} 條邊（連通）。它有沒有可能是平面圖？
[{'x' if not ok else ' '}] 不可能：二分圖沒有三角形，平面圖每個面至少 4 條邊，必須 $E\\le2V-4={2*V-4}$
[{'x' if ok else ' '}] 光看點數和邊數排除不了，要再看圖的結構
[ ] 一定可能，因為 $E\\le3V-6={3*V-6}$
[ ] 一定不可能，因為二分圖都不是平面圖
---
沒有三角形時每個面至少 4 條邊圍成，$4F\\le2E$；代入 $F=2-V+E$ 得 $E\\le2V-4$。這裡 $2V-4={2*V-4}$，$E={E}$，{'超過了，所以一定不是平面圖' if not ok else '沒超過，條件只是必要條件，還不能斷定'}。只用 $E\\le3V-6$（一般簡單平面圖）會太寬鬆。
""")
    cnt+=1
if want('kmp'):
  cnt=0; seen=set()
  while cnt<n:
    L=random.randint(7,9); base=''.join(random.choice('ab') for _ in range(random.randint(2,4)))
    P=(base*5)[:L]
    P=list(P); i=random.randrange(L//2,L); P[i]=random.choice('ab'); P=''.join(P)
    if P in seen: continue
    seen.add(P)
    pi=[0]*L; k=0
    for q in range(1,L):
        while k>0 and P[k]!=P[q]: k=pi[k-1]
        if P[k]==P[q]: k+=1
        pi[q]=k
    if max(pi)<2: continue
    out.append(f"""@q pb3-? | al-prob#3 | 3 | 計算
樣式 `{P}`。KMP 的前綴函數 $\\pi[q]$（$P[1..q]$ 最長的「既是真前綴又是後綴」的長度），$q=1,\\dots,{L}$ 依序是？（逗號隔開）
== {','.join(map(str,pi))}
---
逐一看前 $q$ 個字：{'；'.join(f'`{P[:q+1]}`→{pi[q]}' for q in range(L))}。比對失敗時，KMP 用 $\\pi$ 直接跳到「已經對上的最長前綴」，文字指標不必往回退，所以總時間 $O(n+m)$。
""")
    cnt+=1
if want('rk'):
  cnt=0
  while cnt<n:
    q=random.choice([11,13]); m=random.choice([2,3]); T=''.join(random.choice('0123456789') for _ in range(random.randint(12,15)))
    Pv=random.randint(10**(m-1),10**m-1); P=str(Pv)
    hp=Pv%q; hits=[]; spur=[]; real=[]
    for s in range(len(T)-m+1):
        w=T[s:s+m]
        if int(w)%q==hp:
            (real if w==P else spur).append(s)
    if len(spur)<1: continue
    out.append(f"""@q pb3-? | al-prob#3 | 3 | 計算
Rabin–Karp：文字 `{T}`、樣式 `{P}`，把每 {m} 位數字當成十進位整數、取 $\\bmod {q}$ 當作「指紋」。有幾個位置指紋和樣式相同、但其實不是真的出現（假警報）？真的出現幾次？
== {len(spur)},{len(real)}
?? 假警報,真的出現
---
${P}\\bmod{q}={hp}$。指紋相同的位置（從 0 起算）：{'、'.join(f'{s}（`{T[s:s+m]}`）' for s in sorted(spur+real))}；逐字比對後真的相同的：{('、'.join(map(str,real))) if real else '沒有'}。雜湊只是篩選，相同時一定要再逐字確認；模數 $q$ 選大一點，偽命中就會變少。
""")
    cnt+=1
if want('qsel'):
  cnt=0
  while cnt<n:
    N=random.randint(7,9); a=random.sample(range(1,60),N); k=random.randint(2,N-1)
    A=a[:]; lo,hi=0,N-1; pivs=[]; calls=0; last1=None
    while True:
        calls+=1; x=A[hi]; i=lo-1
        for j in range(lo,hi):
            if A[j]<=x: i+=1; A[i],A[j]=A[j],A[i]
        A[i+1],A[hi]=A[hi],A[i+1]; p=i+1; pivs.append(x)
        if p==k-1: break
        if k-1<p: hi=p-1
        else: lo=p+1
        if lo==hi: last1=A[lo]; break
    ans=sorted(a)[k-1]
    if calls<2: continue
    out.append(f"""@q srt5-? | ds-sort#5 | 3 | 追蹤
用 quickselect（Lomuto 分割，每次拿範圍最後一個當 pivot）在 {', '.join(map(str,a))} 中找第 {k} 小的數。依序用了哪些 pivot？答案是多少？
== {' '.join(map(str,pivs))},{ans}
?? pivot（空格隔開）,第 {k} 小
---
每次分割後 pivot 落在它最終的位置 $p$：若 $p+1=k$ 就找到；否則只往含第 {k} 小的那一側繼續（範圍只剩一個元素時它就是答案）。依序 pivot：{'、'.join(map(str,pivs))}{'，最後範圍只剩 '+str(last1)+' 一個，它就是答案' if last1 is not None else ''}，答案 {ans}。和快速排序不同，只需要遞迴一邊，平均 $O(n)$。
""")
    cnt+=1
if want('kara'):
  cnt=0
  while cnt<n:
    x=random.randint(1000,9999); y=random.randint(1000,9999)
    a,b=divmod(x,100); c,d=divmod(y,100)
    z2=a*c; z0=b*d; s=(a+b)*(c+d); z1=s-z2-z0
    assert z2*10**4+z1*100+z0==x*y
    out.append(f"""@q dc2-? | al-dc#2 | 2 | 計算
Karatsuba 算 ${x}\\times{y}$：切成 $a={a},b={b}$、$c={c},d={d}$。三次乘法 $ac$、$bd$、$(a+b)(c+d)$ 各是多少？中間項 $ad+bc$ 是多少？
== {z2},{z0},{s},{z1}
?? ac,bd,(a+b)(c+d),ad+bc
---
$ac={a}\\times{c}={z2}$、$bd={b}\\times{d}={z0}$、$(a+b)(c+d)={a+b}\\times{c+d}={s}$。$ad+bc=(a+b)(c+d)-ac-bd={z1}$。結果 ${z2}\\times10^4+{z1}\\times10^2+{z0}={x*y}$。只用 3 次乘法（不是 4 次），遞迴下去得到 $O(n^{{\\lg3}})$。
""")
    cnt+=1
if want('lu'):
  cnt=0
  while cnt<n:
    l21,l31,l32=[random.choice([-2,-1,1,2,3]) for _ in range(3)]
    U=[[random.choice([1,2,3,-1,-2]),random.randint(-3,3),random.randint(-3,3)],[0,random.choice([1,2,-1,3]),random.randint(-3,3)],[0,0,random.choice([1,2,-2,3,-1])]]
    L=[[1,0,0],[l21,1,0],[l31,l32,1]]
    A=[[sum(L[i][k]*U[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    if max(abs(v) for r in A for v in r)>12: continue
    r3=[A[2][j]-l31*U[0][j] for j in range(3)]
    pa=f'({A[0][0]})' if A[0][0]<0 else str(A[0][0]); pu=f'({U[1][1]})' if U[1][1]<0 else str(U[1][1])
    out.append(f"""@q ls3-? | la-systems#3 | 3 | 計算
$A={mat(A)}$ 做 LU 分解（不換列，$L$ 對角線是 1）。$\\ell_{{21}}$、$\\ell_{{31}}$、$\\ell_{{32}}$ 和 $u_{{33}}$ 各是多少？
== {l21},{l31},{l32},{U[2][2]}
?? ℓ21,ℓ31,ℓ32,u33
---
第 1 步：$\\ell_{{21}}={A[1][0]}/{pa}={l21}$、$\\ell_{{31}}={A[2][0]}/{pa}={l31}$，把第 2、3 列各減去倍數的第 1 列，第 2 列變成 $({U[1][0]},{U[1][1]},{U[1][2]})$、第 3 列變成 $(0,{r3[1]},{r3[2]})$。第 2 步：$\\ell_{{32}}={r3[1]}/{pu}={l32}$，消完得 $U={mat(U)}$。$L$ 就是把這些乘數放回原位置：$L={mat(L)}$。
""")
    cnt+=1
if want('mcpi'):
  cnt=0
  while cnt<n:
    cuts=sorted(random.sample(range(1,20),4)); parts=[b-a for a,b in zip([0]+cuts,cuts+[20])]
    if min(parts)==0: continue
    pct=[p*5 for p in parts]; cyc=[5,4,4,3,3]; nm=['lw','sw','R 型','beq','j']
    cpi=F(sum(p*c for p,c in zip(pct,cyc)),100)
    Ts=random.choice([800,1000]); Tm=random.choice([200,250])
    sp=F(Ts,1)/(cpi*Tm)
    out.append(f"""@q cd3-? | co-datapath#3 | 2 | 計算
多週期資料路徑各類指令的週期數：lw 5、sw 4、R 型 4、beq 3、j 3。程式的指令比例 {'、'.join(f'{a} {b}%' for a,b in zip(nm,pct))}。平均 CPI 是多少？若多週期時脈 {Tm} ps、單週期時脈 {Ts} ps，多週期比單週期快幾倍（四捨五入到小數第二位）？
== {float(cpi):g},{float(sp):.2f}
?? CPI,倍數
---
CPI＝{'＋'.join(f'{p/100:g}×{c}' for p,c in zip(pct,cyc))}＝{float(cpi):g}。每條指令平均：多週期 ${float(cpi):g}\\times{Tm}={float(cpi*Tm):g}$ ps，單週期 {Ts} ps，${Ts}/{float(cpi*Tm):g}\\approx{float(sp):.2f}$。{'多週期反而比較慢：時脈雖然短，但平均要好幾個週期' if sp<1 else '多週期贏在不必讓每條指令都等最慢的 lw'}。
""")
    cnt+=1
if want('svd'):
  cnt=0; seen=set()
  while cnt<n:
    A=[[random.randint(-4,4) for _ in range(2)] for _ in range(2)]
    G=[[sum(A[k][i]*A[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    tr=G[0][0]+G[1][1]; dt=G[0][0]*G[1][1]-G[0][1]**2; disc=tr*tr-4*dt
    if disc<=0: continue
    r=math.isqrt(disc)
    if r*r!=disc or (tr+r)%2: continue
    l1=(tr+r)//2; l2=(tr-r)//2
    s1=math.isqrt(l1); s2=math.isqrt(l2)
    if s1*s1!=l1 or s2*s2!=l2 or s2==0 or G[0][1]==0: continue
    if str(A) in seen: continue
    seen.add(str(A))
    out.append(f"""@q sv4-? | la-sym-svd#4 | 3 | 計算
$A={mat(A)}$。$A$ 的兩個奇異值（由大到小）是？
== {s1},{s2}
---
奇異值是 $A^TA$ 特徵值的平方根。$A^TA={mat(G)}$，跡 {tr}、行列式 {dt}，特徵值滿足 $\\lambda^2-{tr}\\lambda+{dt}=0$，得 {l1}、{l2}。奇異值 $\\sqrt{{{l1}}}={s1}$、$\\sqrt{{{l2}}}={s2}$。檢查：$\\sigma_1\\sigma_2={s1*s2}=|\\det A|$。
""")
    cnt+=1
if want('chg'):
  cnt=0
  while cnt<n:
    b1=[random.randint(-2,3),random.randint(-2,3)]; b2=[random.randint(-2,3),random.randint(-2,3)]
    D=b1[0]*b2[1]-b2[0]*b1[1]
    if D==0 or abs(D)>4: continue
    v=[random.randint(-5,6),random.randint(-5,6)]
    c1=F(v[0]*b2[1]-b2[0]*v[1],D); c2=F(b1[0]*v[1]-v[0]*b1[1],D)
    if c1==0 or c2==0: continue
    def lin(p,q,r):
        s=[]
        for co,vn in ((p,'c_1'),(q,'c_2')):
            if co==0: continue
            if co==1: s.append('+'+vn)
            elif co==-1: s.append('-'+vn)
            else: s.append(('+' if co>0 else '')+str(co)+vn)
        e=''.join(s).lstrip('+')
        return e+'='+str(r)
    eq1=lin(b1[0],b2[0],v[0]); eq2=lin(b1[1],b2[1],v[1])
    out.append(f"""@q vs4-? | la-vs#4 | 2 | 計算
基底 $\\mathcal B=\\{{b_1=({b1[0]},{b1[1]}),\\ b_2=({b2[0]},{b2[1]})\\}}$。$v=({v[0]},{v[1]})$ 在 $\\mathcal B$ 下的座標 $[v]_{{\\mathcal B}}=(c_1,c_2)$ 是？（可用分數）
== {fr(c1)},{fr(c2)}
---
解 $c_1b_1+c_2b_2=v$：${eq1}$、${eq2}$。行列式 {D}，得 $c_1={fr(c1)}$、$c_2={fr(c2)}$。驗算：${fr(c1)}({b1[0]},{b1[1]})+{fr(c2)}({b2[0]},{b2[1]})=({v[0]},{v[1]})$。座標是「用這組基底要各拿幾份」，換基底就是解這個方程組。
""".replace('+-','-'))
    cnt+=1
print(''.join(out))

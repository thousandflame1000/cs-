import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('rod'):
  cnt=0
  while cnt<n:
    N=random.choice([6,7,8]); p=[0]+sorted(random.sample(range(1,30),N))
    r=[0]*(N+1); cut=[0]*(N+1)
    for j in range(1,N+1):
        best=-1
        for i in range(1,j+1):
            if p[i]+r[j-i]>best: best=p[i]+r[j-i]; cut[j]=i
        r[j]=best
    if r[N]==p[N]: continue
    pieces=[]; j=N
    while j: pieces.append(cut[j]); j-=cut[j]
    if all(x==1 for x in pieces): continue
    out.append(f"""@q dp1-? | al-dp#1 | 3 | 計算
長度 {N} 的鋼條，長度 $i$ 的一段可以賣 $p_i$ 元：{'、'.join(f'$p_{i}={p[i]}$' for i in range(1,N+1))}。怎麼切（也可以不切）賣最多錢？最多是多少？
== {r[N]}
---
$r_j=\\max_{{1\\le i\\le j}}(p_i+r_{{j-i}})$，$r_0=0$。依序 {'、'.join(f'$r_{j}={r[j]}$' for j in range(1,N+1))}。最佳切法：{'＋'.join(map(str,sorted(pieces,reverse=True)))}，共 {r[N]} 元。每個 $r_j$ 只算一次，$O(n^2)$。
""")
    cnt+=1
if want('ss'):
  cnt=0
  while cnt<n:
    a=sorted(random.sample(range(2,15),4)); sums={0}
    for x in a: sums|={s+x for s in sums}
    T=sum(a); missing=[s for s in range(1,T+1) if s not in sums]
    if not missing: continue
    out.append(f"""@q dp4-? | al-dp#4 | 2 | 計算
從 {', '.join(map(str,a))} 中挑一些（每個最多一次，可以都不挑），可以湊出幾種不同的和（包含 0）？
== {len(sums)}
---
一個一個加入，維護「目前能湊出的和」：從 $\\{{0\\}}$ 開始，每加一個數 $x$，就把現有的每個和加上 $x$ 併進來。最後能湊出 {len(sums)} 種，1 到 {T} 之間湊不出的有 {', '.join(map(str,missing))}。表格法是 $O(nT)$，$T$ 是總和。
""")
    cnt+=1
if want('coin'):
  cnt=0
  while cnt<n:
    c=sorted([1]+random.sample(range(2,16),2)); A=random.randint(10,40)
    INF=10**9; d=[0]+[INF]*A
    for x in range(1,A+1):
        d[x]=min(d[x-cc]+1 for cc in c if cc<=x)
    g=0; r=A; gl=[]
    for cc in reversed(c):
        k=r//cc; g+=k; r-=k*cc; gl+=[cc]*k
    if g==d[A]: continue
    out.append(f"""@q gd6-? | al-greedy#6 | 2 | 計算
面額 {', '.join(map(str,c))}，湊 {A} 元。貪婪（每次拿不超過剩餘金額的最大面額）用幾枚？最少要幾枚？
== {g},{d[A]}
?? 貪婪,最少
---
貪婪：{'＋'.join(map(str,gl))}，共 {g} 枚。用 DP $dp[a]=1+\\min_c dp[a-c]$ 得最少 {d[A]} 枚。面額不是「正規」的組合時，先拿最大的不一定最好。
""")
    cnt+=1
if want('vc'):
  cnt=0
  while cnt<n:
    V=list('abcdef'); E=[]
    while len(E)<7:
        u,v=sorted(random.sample(V,2))
        if (u,v) not in E: E.append((u,v))
    cov=set(); picked=[]
    for u,v in E:
        if u not in cov and v not in cov: cov|={u,v}; picked.append((u,v))
    opt=min(len(S) for r in range(0,7) for S in itertools.combinations(V,r) if all(u in S or v in S for u,v in E))
    if len(cov)==opt: continue
    out.append(f"""@q np4-? | al-np#4 | 3 | 計算
圖的邊依序是 {'、'.join(f'{u}{v}' for u,v in E)}。點覆蓋的 2-近似：依序看每條邊，若兩端都還沒被選，就把兩端都選進來。得到的覆蓋有幾個點？最小點覆蓋有幾個點？
== {len(cov)},{opt}
?? 2-近似,最佳
---
選到的邊：{'、'.join(f'{u}{v}' for u,v in picked)}（它們互不共用點，是一組匹配），覆蓋 {{{', '.join(sorted(cov))}}}，{len(cov)} 個點。窮舉得最小覆蓋 {opt} 個。任何覆蓋都至少要在每條被選的邊上選一端，所以最佳 $\\ge${len(picked)}，近似解 $=2\\times{len(picked)}$，比值不超過 2。
""".replace('$\\ge$','$\\ge ').replace('，近似解 $=','$，近似解 $=').replace('${len(picked)}',''))
    cnt+=1
if want('mips'):
  cnt=0
  regs={f'$t{i}':8+i for i in range(8)}; regs.update({f'$s{i}':16+i for i in range(8)})
  while cnt<n:
    op,fn=random.choice([('add',32),('sub',34),('and',36),('or',37),('slt',42)])
    rd,rs,rt=random.sample(list(regs),3)
    code=(0<<26)|(regs[rs]<<21)|(regs[rt]<<16)|(regs[rd]<<11)|(0<<6)|fn
    b=format(code,'032b')
    out.append(f"""@q cd1-? | co-datapath#1 | 3 | 計算
MIPS 指令 `{op} {rd}, {rs}, {rt}` 的機器碼（十六進位）是？（R 型：opcode 0、funct {fn}；`$t0`～`$t7` 是 8～15、`$s0`～`$s7` 是 16～23）
== {code:08X}
== 0x{code:08X}
---
R 型欄位依序 op(6) rs(5) rt(5) rd(5) shamt(5) funct(6)：`000000` `{regs[rs]:05b}`（`{rs}`={regs[rs]}）`{regs[rt]:05b}`（`{rt}`={regs[rt]}）`{regs[rd]:05b}`（`{rd}`={regs[rd]}）`00000` `{fn:06b}`。注意組合語言寫 rd 在前，機器碼裡 rd 卻在第三個暫存器欄位。每 4 位一組換成十六進位得 {code:08X}。
""")
    cnt+=1
if want('rob'):
  cnt=0
  while cnt<n:
    st=[random.choice(['完成','完成','完成','未完成']) for _ in range(8)]
    w=random.choice([2,3,4])
    c=0
    for s in st:
        if s=='完成' and c<w: c+=1
        else: break
    out.append(f"""@q il4-? | co-ilp#4 | 2 | 追蹤
ROB 從頭（最舊）到尾的 8 項狀態：{'、'.join(st)}。每拍最多 commit {w} 條。這一拍能 commit 幾條？
== {c}
---
commit 只能從 ROB 頭依程式順序進行：從第 1 項往後數連續「完成」的，最多 {w} 條，遇到第一個未完成就停（後面完成的也得等），所以是 {c} 條。這就是「亂序執行、照順序完成」。
""")
    cnt+=1
if want('mesi'):
  cnt=0
  while cnt<n:
    ops=[(random.choice([0,1]),random.choice(['讀','寫'])) for _ in range(4)]
    s=['I','I']; trace=[]
    for p,o in ops:
        q=1-p
        if o=='讀':
            if s[p]=='I':
                if s[q]=='I': s[p]='E'
                else: s[q]='S'; s[p]='S'
        else:
            s[p]='M'; s[q]='I'
        trace.append(f'P{p}{o}→({s[0]},{s[1]})')
    out.append(f"""@q vc2-? | co-vm-coherence#2 | 3 | 追蹤
兩顆核心 P0、P1，某個區塊一開始兩邊的 cache 都是 I。依序：{'、'.join(f'P{p}{o}' for p,o in ops)}。最後 P0、P1 的 MESI 狀態各是？
== {s[0]},{s[1]}
?? P0,P1
---
規則：讀取 miss 時，別人都沒有就進 E，有人有就大家都變 S（M 的那一方要先寫回或直接提供資料）；寫入時自己變 M、別人變 I；E 寫入可以直接變 M 不用通知。逐步（括號內是 P0、P1 的狀態）：{'、'.join(trace)}。
""")
    cnt+=1
if want('sem'):
  cnt=0
  while cnt<n:
    v0=random.randint(0,3); ops=[random.choice(['wait','wait','signal']) for _ in range(7)]
    v=v0; blocked=0; tr=[]
    for o in ops:
        if o=='wait': v-=1
        else: v+=1
        tr.append(str(v))
    blk=max(0,-v)
    out.append(f"""@q sy4-? | os-sync#4 | 2 | 追蹤
號誌 S 初值 {v0}（wait 先減 1，結果小於 0 就去等；signal 先加 1，結果 $\\le0$ 就叫醒一個在等的）。不同的行程依序做：{'、'.join(ops)}。最後 S 的值是多少？有幾個行程正在等？
== {v},{blk}
?? S 的值,等待中的行程數
---
S 依序變成 {', '.join(tr)}。這種實作中 S 為負時，$|S|$ 就是等待佇列的長度：最後 S＝{v}，所以有 {blk} 個在等。
""")
    cnt+=1
if want('rag'):
  cnt=0
  while cnt<n:
    P=['P1','P2','P3','P4']; R=['R1','R2','R3','R4']
    hold={r:random.choice(P+[None]) for r in R}
    req={p:random.choice([None]+R) for p in P}
    # wait-for
    wf={p:(hold[req[p]] if req[p] and hold[req[p]] and hold[req[p]]!=p else None) for p in P}
    dead=set()
    for p in P:
        seen=[]; x=p
        while x and x not in seen: seen.append(x); x=wf[x]
        if x and x in seen: dead|=set(seen[seen.index(x):])
    if not dead and random.random()<0.6: continue
    if any(req[p]==r and hold[r]==p for p in P for r in R): continue
    hs='、'.join(f'{p} 拿著 '+'、'.join(r for r in R if hold[r]==p) for p in P if any(hold[r]==p for r in R))
    rs='、'.join(f'{p} 要 {req[p]}' for p in P if req[p])
    out.append(f"""@q dl2-? | os-deadlock#2 | 3 | 計算
每種資源只有 1 個。{hs}；{rs}。有沒有死結？卡在死結裡的行程有幾個？
== {'有' if dead else '沒有'},{len(dead)}
?? 有沒有死結,行程數
---
畫成等待圖（$P\\to Q$：$P$ 要的資源在 $Q$ 手上）：{'、'.join(f'{p}→{wf[p]}' for p in P if wf[p]) or '沒有任何等待邊'}。單一實例時，有環 ⇔ 死結。{('環上的 '+'、'.join(sorted(dead))+' 互相等待，形成死結。') if dead else '沒有環，所以沒有死結：等待的行程最後都會拿到。'}
""")
    cnt+=1
if want('seg'):
  cnt=0
  while cnt<n:
    tab=[(random.randint(10,90)*100,random.choice([200,300,400,500,600,1000])) for _ in range(4)]
    qs=[(random.randrange(4),random.randint(0,1100)) for _ in range(3)]
    res=[('trap' if o>=tab[s][1] else str(tab[s][0]+o)) for s,o in qs]
    if all(r=='trap' for r in res) or 'trap' not in res: continue
    out.append(f"""@q me5-? | os-memory#5 | 2 | 計算
段表（base, limit）：{'、'.join(f'第 {i} 段 ({b}, {l})' for i,(b,l) in enumerate(tab))}。邏輯位址 {'、'.join(f'({s}, {o})' for s,o in qs)} 依序轉成實體位址，越界的寫 trap。
== {','.join(res)}
?? {','.join(f'({s},{o})' for s,o in qs)}
---
位移要小於 limit 才合法，實體位址＝base＋位移：{'；'.join(f'({s},{o})：{"位移 "+str(o)+" ≥ limit "+str(tab[s][1])+"，trap" if r=="trap" else str(tab[s][0])+"+"+str(o)+"="+r}' for (s,o),r in zip(qs,res))}。
""")
    cnt+=1
if want('neck'):
  cnt=0
  while cnt<n:
    N=random.choice([4,5,6,8]); k=random.choice([2,3])
    if (N,k) in [(4,2),(6,2),(7,2)]: continue
    tot=sum(k**math.gcd(N,j) for j in range(N))
    ans=tot//N
    out.append(f"""@q nt5-? | dm-nt-algebra#5 | 3 | 計算
{N} 顆珠子圍成一圈，每顆塗 {k} 種顏色之一。只把「旋轉後一樣」的算同一種，有幾種不同的項鍊？
== {ans}
---
Burnside：轉 $j$ 格固定的塗法有 ${k}^{{\\gcd({N},j)}}$ 種。$j=0,\\dots,{N-1}$ 加起來：{'+'.join(str(k**math.gcd(N,j)) for j in range(N))}＝{tot}，除以 {N} 得 {ans}（每一種項鍊的旋轉同伴數不一定相同，所以不能直接用 ${k}^{{{N}}}/{N}$）。
""")
    cnt+=1
if want('lsq'):
  cnt=0
  while cnt<n:
    xs=sorted(random.sample(range(0,6),3)); ys=[random.randint(0,8) for _ in xs]
    nn=3; sx=sum(xs); sy=sum(ys); sxx=sum(x*x for x in xs); sxy=sum(x*y for x,y in zip(xs,ys))
    den=nn*sxx-sx*sx
    d=F(nn*sxy-sx*sy,den); c=F(sy,nn)-d*F(sx,nn)
    if d==0: continue
    pts='、'.join(f'$({x},{y})$' for x,y in zip(xs,ys))
    out.append(f"""@q or3-? | la-ortho#3 | 2 | 計算
用最小平方法把直線 $y=c+dx$ 擬合到 {pts}。$c$ 和 $d$ 各是多少？
== {fr(c)},{fr(d)}
?? c,d
---
正規方程：$\\left[\\begin{{smallmatrix}}3&{sx}\\\\{sx}&{sxx}\\end{{smallmatrix}}\\right]\\left[\\begin{{smallmatrix}}c\\\\d\\end{{smallmatrix}}\\right]=\\left[\\begin{{smallmatrix}}{sy}\\\\{sxy}\\end{{smallmatrix}}\\right]$。解得 $d={fr(d)}$、$c={fr(c)}$。檢查：直線通過 $(\\bar x,\\bar y)=({fr(F(sx,3))},{fr(F(sy,3))})$。
""")
    cnt+=1
if want('area'):
  cnt=0
  while cnt<n:
    P=[(random.randint(-4,6),random.randint(-4,6)) for _ in range(3)]
    (x1,y1),(x2,y2),(x3,y3)=P
    D=(x2-x1)*(y3-y1)-(x3-x1)*(y2-y1)
    if D==0: continue
    out.append(f"""@q dt4-? | la-det#4 | 2 | 計算
平面上三點 $A({x1},{y1})$、$B({x2},{y2})$、$C({x3},{y3})$ 圍成的三角形面積是多少？
== {fr(F(abs(D),2))}
---
$\\vec{{AB}}=({x2-x1},{y2-y1})$、$\\vec{{AC}}=({x3-x1},{y3-y1})$，兩者張成的平行四邊形面積是 $\\left|\\det\\left[\\begin{{smallmatrix}}{x2-x1}&{x3-x1}\\\\{y2-y1}&{y3-y1}\\end{{smallmatrix}}\\right]\\right|=|{D}|$，三角形是一半：{fr(F(abs(D),2))}。行列式的正負號表示 A→B→C 是逆時針還是順時針。
""")
    cnt+=1
if want('trie'):
  cnt=0
  pool=['car','cat','cart','care','dog','do','dot','door','tea','ten','team','to','top','tap']
  while cnt<n:
    ws=random.sample(pool,random.choice([4,5]))
    pref={w[:i] for w in ws for i in range(0,len(w)+1)}
    out.append(f"""@q bt4-? | ds-btree#4 | 2 | 計算
把 {', '.join(ws)} 存進一棵 Trie（每個節點代表一個前綴，根代表空字串）。共有幾個節點（含根）？
== {len(pref)}
---
節點數＝所有不同前綴的個數（含空字串）：{', '.join(sorted(p or 'ε' for p in pref))}，共 {len(pref)} 個。共同前綴只存一次，所以比各字長度相加再加 1（{sum(len(w) for w in ws)+1}）少。
""")
    cnt+=1
if want('sel'):
  cnt=0
  while cnt<n:
    a=random.sample(range(1,60),7); b=a[:]; k=random.choice([2,3])
    for i in range(k):
        m=min(range(i,7),key=lambda j:b[j]); b[i],b[m]=b[m],b[i]
    out.append(f"""@q srt1-? | ds-sort#1 | 2 | 追蹤
選擇排序（第 $i$ 輪在第 $i$ 個以後找最小的，和第 $i$ 個交換）處理 {', '.join(map(str,a))}。做完第 {k} 輪後陣列是？（逗號隔開）
== {','.join(map(str,b))}
---
每一輪把剩下的最小值換到前面，前 {k} 個就是全部中最小的 {k} 個、已經排好：{', '.join(map(str,b))}。選擇排序不管輸入如何都做 $\\frac{{n(n-1)}}2$ 次比較，但交換最多 $n-1$ 次。
""")
    cnt+=1
if want('walk'):
  cnt=0
  while cnt<n:
    V=4; E=set()
    while len(E)<5:
        u,v=sorted(random.sample(range(V),2)); E.add((u,v))
    A=[[1 if (min(i,j),max(i,j)) in E and i!=j else 0 for j in range(V)] for i in range(V)]
    A2=[[sum(A[i][k]*A[k][j] for k in range(V)) for j in range(V)] for i in range(V)]
    i,j=random.sample(range(V),2)
    out.append(f"""@q gr1-? | ds-graph#1 | 3 | 計算
無向圖 4 個點，邊：{'、'.join(f'{u+1}–{v+1}' for u,v in sorted(E))}。從點 {i+1} 走到點 {j+1}、剛好走 2 步（可以重複經過點）的走法有幾種？
== {A2[i][j]}
---
就是相鄰矩陣平方 $A^2$ 的 $({i+1},{j+1})$ 元：$\\sum_kA_{{{i+1}k}}A_{{k{j+1}}}$，數有幾個 $k$ 同時和 {i+1}、{j+1} 相鄰：{'、'.join(str(k+1) for k in range(V) if A[i][k] and A[k][j]) or '沒有'}，共 {A2[i][j]} 種。$A^2$ 的對角線就是各點的度數。
""")
    cnt+=1
print('\n'.join(out))

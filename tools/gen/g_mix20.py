import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('kn3'):
  cnt=0
  while cnt<n:
    N=4; it=[(random.randint(1,5),random.randint(3,15)) for _ in range(N)]; W=random.randint(7,11)
    dp=[[0]*(W+1) for _ in range(N+1)]
    for i in range(1,N+1):
        w,v=it[i-1]
        for c in range(W+1):
            dp[i][c]=dp[i-1][c]
            if w<=c and dp[i-1][c-w]+v>dp[i][c]: dp[i][c]=dp[i-1][c-w]+v
    c=W; ch=[]; trace=[]
    for i in range(N,0,-1):
        if dp[i][c]!=dp[i-1][c]: ch.append(i); trace.append(f'dp[{i}][{c}]={dp[i][c]}≠dp[{i-1}][{c}]={dp[i-1][c]}，選 #{i}'); c-=it[i-1][0]
        else: trace.append(f'dp[{i}][{c}]＝dp[{i-1}][{c}]={dp[i][c]}，不選 #{i}')
    ch=sorted(ch)
    if len(ch)<2: continue
    out.append(f"""@q dp3-? | al-dp#3 | 3 | 追蹤
0/1 背包容量 {W}，物品（重量, 價值）：{'、'.join(f'#{i+1} ({w}, {v})' for i,(w,v) in enumerate(it))}。填完 $dp[i][c]$（前 $i$ 個物品、容量 $c$ 的最大價值）後，從 $dp[{N}][{W}]$ 往回重建：若 $dp[i][c]\\ne dp[i-1][c]$ 就選物品 $i$、$c$ 減掉它的重量。最大價值是多少？選了哪些物品？
== {dp[N][W]},{' '.join(map(str,ch))}
?? 最大價值,物品編號（空格隔開）
---
{'；'.join(trace)}。選 {'、'.join('#'+str(i) for i in ch)}，總重 {sum(it[i-1][0] for i in ch)}、總價值 {dp[N][W]}。只要表格留著，重建只要 $O(n)$；若為了省空間只留一列，就沒辦法這樣往回追。
""")
    cnt+=1
class RB:
    def __init__(s,k): s.k=k; s.c='R'; s.l=s.r=s.p=None
def rb_insert(root,k,st):
    z=RB(k); y=None; x=root
    while x: y=x; x=x.l if k<x.k else x.r
    z.p=y
    if not y: root=z
    elif k<y.k: y.l=z
    else: y.r=z
    def lrot(x):
        nonlocal root
        y=x.r; x.r=y.l
        if y.l: y.l.p=x
        y.p=x.p
        if not x.p: root=y
        elif x is x.p.l: x.p.l=y
        else: x.p.r=y
        y.l=x; x.p=y; st['rot']+=1
    def rrot(x):
        nonlocal root
        y=x.l; x.l=y.r
        if y.r: y.r.p=x
        y.p=x.p
        if not x.p: root=y
        elif x is x.p.r: x.p.r=y
        else: x.p.l=y
        y.r=x; x.p=y; st['rot']+=1
    while z.p and z.p.c=='R':
        g=z.p.p
        if z.p is g.l:
            u=g.r
            if u and u.c=='R': z.p.c='B'; u.c='B'; g.c='R'; z=g; st['case1']+=1
            else:
                if z is z.p.r: z=z.p; lrot(z)
                z.p.c='B'; g.c='R'; rrot(g)
        else:
            u=g.l
            if u and u.c=='R': z.p.c='B'; u.c='B'; g.c='R'; z=g; st['case1']+=1
            else:
                if z is z.p.l: z=z.p; rrot(z)
                z.p.c='B'; g.c='R'; lrot(g)
    root.c='B'
    return root
def rbpre(t): return [f'{t.k}{t.c}']+rbpre(t.l)+rbpre(t.r) if t else []
if want('rb'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,50),7); root=None; st={'rot':0,'case1':0}
    for k in ks: root=rb_insert(root,k,st)
    if st['rot']<2 or st['case1']<1: continue
    out.append(f"""@q bst4-? | ds-bst#4 | 3 | 追蹤
依序把 {', '.join(map(str,ks))} 插入一棵空的紅黑樹（CLRS 的插入修正）。總共做了幾次旋轉？最後的前序走訪（每個 key 後面接 R 或 B 表示顏色）是？
== {st['rot']},{' '.join(rbpre(root))}
?? 旋轉次數,前序（空格隔開）
---
新節點一律塗紅；父節點也是紅的才要修：叔叔是紅的→父、叔變黑，祖父變紅，問題往上移（這種情況發生 {st['case1']} 次，不用旋轉）；叔叔是黑的→「之字形」先轉一次變「一字形」，再轉祖父並交換顏色。共旋轉 {st['rot']} 次，最後前序 {' '.join(rbpre(root))}，根一定是黑的。
""")
    cnt+=1
class SN:
    def __init__(s,k): s.k=k; s.l=s.r=s.p=None
def splay_ins(root,k,log):
    z=SN(k); y=None; x=root
    while x: y=x; x=x.l if k<x.k else x.r
    z.p=y
    if not y: return z
    if k<y.k: y.l=z
    else: y.r=z
    def rot(x):
        p=x.p; g=p.p
        if x is p.l:
            p.l=x.r
            if x.r: x.r.p=p
            x.r=p
        else:
            p.r=x.l
            if x.l: x.l.p=p
            x.l=p
        p.p=x; x.p=g
        if g:
            if g.l is p: g.l=x
            else: g.r=x
    while z.p:
        p=z.p; g=p.p
        if not g: rot(z); log.append('zig')
        elif (z is p.l)==(p is g.l): rot(p); rot(z); log.append('zig-zig')
        else: rot(z); rot(z); log.append('zig-zag')
    return z
def spre(t): return [t.k]+spre(t.l)+spre(t.r) if t else []
if want('splay'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,60),6); root=None; logs=[]
    for k in ks:
        lg=[]; root=splay_ins(root,k,lg); logs.append((k,lg))
    allops=[o for k,l in logs for o in l]
    if 'zig-zag' not in allops or 'zig-zig' not in allops: continue
    desc='；'.join(f'插入 {k}：'+('、'.join(l) if l else '（第一個）') for k,l in logs)
    out.append(f"""@q bst5-? | ds-bst#5 | 3 | 追蹤
Splay tree：每次照 BST 規則插入新 key，再把它 splay 到根（由下往上，zig／zig-zig／zig-zag）。依序插入 {', '.join(map(str,ks))}。最後的前序走訪是？
== {' '.join(map(str,spre(root)))}
---
{desc}。最後的根是最後插入的 {ks[-1]}，前序 {' '.join(map(str,spre(root)))}。zig-zig 先轉祖父再轉父親（和一般「一路單轉上去」不同），這是攤銷 $O(\\lg n)$ 的關鍵。
""")
    cnt+=1
if want('cuckoo'):
  cnt=0
  while cnt<n:
    m=7; ks=random.sample(range(10,80),5)
    T=[[None]*m,[None]*m]; ev=0; log=[]; ok=True
    h=[lambda k:k%m, lambda k:(k//m)%m]
    for k in ks:
        cur=k; t=0
        for _ in range(12):
            pos=h[t](cur)
            if T[t][pos] is None: T[t][pos]=cur; log.append(f'{cur}→T{t+1}[{pos}]'); break
            out_=T[t][pos]; T[t][pos]=cur; ev+=1; log.append(f'{cur} 踢走 T{t+1}[{pos}] 的 {out_}'); cur=out_; t=1-t
        else: ok=False; break
    if not ok or ev<2: continue
    q=ks[0]; where='T1' if q in T[0] else 'T2'; idx=T[0].index(q) if q in T[0] else T[1].index(q)
    out.append(f"""@q hs4-? | ds-hash#4 | 3 | 追蹤
Cuckoo hashing：兩張大小 7 的表，$h_1(k)=k\\bmod7$（T1）、$h_2(k)=\\lfloor k/7\\rfloor\\bmod7$（T2）。插入時先放 T1；位置被佔就把原住戶踢出、把它改放到另一張表、用那張表的雜湊函數算出的位置，如此輪流。依序插入 {', '.join(map(str,ks))}。總共踢出幾次？最後 {q} 在哪張表的第幾格？
== {ev},{where},{idx}
?? 踢出次數,表,格
---
{'；'.join(log)}。共踢出 {ev} 次，{q} 最後在 {where}[{idx}]。查詢只要看兩個位置，最壞 $O(1)$；代價是插入可能連鎖踢很多次，甚至繞圈，這時要換雜湊函數重建。
""")
    cnt+=1
if want('fcomp'):
  cnt=0
  while cnt<n:
    D=[1,2,3,4,5]; f={x:random.choice(D) for x in D}; g={x:random.choice(D) for x in D}
    if random.random()<0.5: perm=random.sample(D,5); f={x:perm[x-1] for x in D}
    gf=[g[f[x]] for x in D]
    finj=len(set(f.values()))==5; gfinj=len(set(gf))==5
    if finj and gfinj: continue
    out.append(f"""@q rl5-? | dm-relations#5 | 2 | 計算
在 $\\{{1,2,3,4,5\\}}$ 上，$f$ 把 1～5 依序送到 {', '.join(str(f[x]) for x in D)}；$g$ 把 1～5 依序送到 {', '.join(str(g[x]) for x in D)}。$(g\\circ f)(1),\\dots,(g\\circ f)(5)$ 依序是？$f$ 是不是一對一？
== {','.join(map(str,gf))},{'是' if finj else '不是'}
?? g∘f(1..5),f 一對一
---
$g\\circ f$ 先做 $f$ 再做 $g$：{'、'.join(f'$g(f({x}))=g({f[x]})={g[f[x]]}$' for x in D)}。$f$ 的值是 {', '.join(str(f[x]) for x in D)}，{'五個都不同，是一對一（也是映成）' if finj else '有重複，不是一對一'}。有限集合到自己的函數：一對一 ⇔ 映成。
""")
    cnt+=1
if want('ballot'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.randint(3,7); b=random.randint(2,a)
    if (a,b) in seen: continue
    seen.add((a,b))
    cntp=F(a-b+1,a+1)*math.comb(a+b,b)
    # brute verify
    tot=0
    for s in itertools.combinations(range(a+b),b):
        h=0; okp=True; S=set(s)
        for i in range(a+b):
            h+= -1 if i in S else 1
            if h<0: okp=False; break
        tot+=okp
    assert tot==cntp
    out.append(f"""@q cn5-? | dm-counting#5 | 3 | 計算
{a} 個 `(` 和 {b} 個 `)` 排成一列，要求由左往右看的每一個前綴，`(` 的數目都不少於 `)`。有幾種排法？
== {tot}
---
不限制時有 $\\binom{{{a+b}}}{{{b}}}={math.comb(a+b,b)}$ 種。用反射法（或選票定理）扣掉「某一刻 `)` 比 `(` 多」的壞序列，得 $\\frac{{{a}-{b}+1}}{{{a}+1}}\\binom{{{a+b}}}{{{b}}}={tot}$。{'$a=b$ 時就是 Catalan 數 $C_'+str(a)+'$。' if a==b else '$a=b$ 時這個公式就變成 Catalan 數。'}
""")
    cnt+=1
if want('eatd'):
  cnt=0; seen=set()
  while cnt<n:
    ma=random.choice([100,150,200]); ts=random.choice([6,8,10]); dirty=random.choice([30,50,70]); pct=random.choice([10,20,40])
    if (ma,ts,dirty,pct) in seen: continue
    seen.add((ma,ts,dirty,pct))
    svc=F(ts*10**6)*(1+F(dirty,100))   # ns
    p=F(pct,100)*ma/(svc-ma)
    inv=1/p
    out.append(f"""@q vm1-? | os-vm#1 | 3 | 計算
記憶體存取 {ma} ns。page fault 時：要換出的頁有 {dirty}% 機率是髒的；換入一頁要 {ts} ms，髒頁還要再花 {ts} ms 寫回。要讓有效存取時間不超過 {ma} ns 的 {100+pct}%，page fault 機率 $p$ 最多約是「每幾次存取一次」？（四捨五入到整數）
== {round(float(inv))}
== {int(float('%.2g'%float(inv)))}
---
平均處理一次 fault：${ts}\\times(1+{dirty/100:g})={float(svc)/1e6:g}$ ms $={float(svc):.0f}$ ns。$(1-p){ma}+p\\cdot{float(svc):.0f}\\le{ma}\\times{1+pct/100:g}$ ⇒ $p\\le\\frac{{{pct*ma//100}}}{{{float(svc-ma):.0f}}}$，約每 {round(float(inv))} 次存取才能有一次 fault。髒頁越多，代價越高——所以替換時偏好挑乾淨的頁。
""")
    cnt+=1
if want('gm'):
  cnt=0; seen=set()
  sets=[(2,8,4),(1,4,16),(3,12,6),(2,2,16),(5,20,10),(3,9,27),(4,6,9),(2,18,6),(8,2,4),(1,9,3)]
  while cnt<n:
    s=random.choice(sets); t=random.choice(sets)
    if s==t or (s,t) in seen: continue
    seen.add((s,t))
    gs=round((s[0]*s[1]*s[2])**(1/3)); gt=round((t[0]*t[1]*t[2])**(1/3))
    if gs**3!=s[0]*s[1]*s[2] or gt**3!=t[0]*t[1]*t[2]: continue
    out.append(f"""@q pf2-? | co-perf#2 | 2 | 計算
三個測試程式的 SPEC ratio：機器 A 是 {s[0]}、{s[1]}、{s[2]}；機器 B 是 {t[0]}、{t[1]}、{t[2]}。A、B 的幾何平均各是多少？用幾何平均比，A 是 B 的幾倍？（可用分數）
== {gs},{gt},{fr(F(gs,gt))}
?? A,B,A/B
---
A：$\\sqrt[3]{{{s[0]}\\times{s[1]}\\times{s[2]}}}=\\sqrt[3]{{{s[0]*s[1]*s[2]}}}={gs}$；B：$\\sqrt[3]{{{t[0]*t[1]*t[2]}}}={gt}$。比值 ${fr(F(gs,gt))}$。幾何平均的好處：比值跟選哪台當參考機器無關（參考機器的時間在相除時消掉）；壞處是它不對應任何真實的總執行時間。
""")
    cnt+=1
if want('dpath3'):
  cnt=0
  while cnt<n:
    st=[random.choice([150,200,250]),random.choice([100,150]),random.choice([150,200]),random.choice([200,250,300]),random.choice([100,150])]
    reg=random.choice([0,20])
    cuts=sorted(random.sample(range(1,20),4)); parts=[b-a for a,b in zip([0]+cuts,cuts+[20])]
    if min(parts)==0: continue
    pct=[p*5 for p in parts]; cyc=[5,4,4,3,3]; nm=['lw','sw','R 型','beq','j']
    single=sum(st); multi=max(st)+reg
    cpi=F(sum(p*c for p,c in zip(pct,cyc)),100)
    sp=F(single)/(cpi*multi)
    out.append(f"""@q cd3-? | co-datapath#3 | 3 | 計算
五個步驟的延遲：取指 {st[0]}、解碼／讀暫存器 {st[1]}、ALU {st[2]}、記憶體 {st[3]}、寫回 {st[4]} ps。單週期的時脈要容納 lw 的全部五步；多週期每一步一個週期，時脈＝最慢的一步{'＋暫存器延遲 '+str(reg)+' ps' if reg else ''}。各指令週期數 lw 5、sw 4、R 型 4、beq 3、j 3，比例 {'、'.join(f'{a} {b}%' for a,b in zip(nm,pct))}。多週期比單週期快幾倍（四捨五入到小數第二位）？
== {float(sp):.2f}
---
單週期時脈 ${'+'.join(map(str,st))}={single}$ ps，每條指令 {single} ps。多週期時脈 {multi} ps；CPI＝{'＋'.join(f'{p/100:g}×{c}' for p,c in zip(pct,cyc))}＝{float(cpi):g}，平均每條 ${float(cpi):g}\\times{multi}={float(cpi*multi):g}$ ps。比值 ${single}/{float(cpi*multi):g}\\approx{float(sp):.2f}$。{'多週期反而較慢——各步不平衡時，每一步都得等最慢的那一步' if sp<1 else '多週期贏在短指令不必走完五步'}。
""")
    cnt+=1
if want('deps'):
  cnt=0
  while cnt<n:
    regs=['r1','r2','r3','r4']
    ins=[(random.choice(regs),random.choice(regs),random.choice(regs)) for _ in range(4)]
    raw=war=waw=0; lst=[]
    for i in range(4):
        for j in range(i+1,4):
            di,a,b=ins[i]; dj,c,d=ins[j]
            if di in (c,d): raw+=1; lst.append(f'I{i+1}→I{j+1} RAW({di})')
            if dj in (a,b): war+=1; lst.append(f'I{i+1}→I{j+1} WAR({dj})')
            if di==dj: waw+=1; lst.append(f'I{i+1}→I{j+1} WAW({di})')
    if raw<2 or war<1 or waw<1: continue
    seq='；'.join(f'I{k+1}: `add {d}, {a}, {b}`' for k,(d,a,b) in enumerate(ins))
    out.append(f"""@q il1-? | co-ilp#1 | 3 | 計算
{seq}。把所有「前面的指令 $i$、後面的指令 $j$」的配對都算進來（不管中間有沒有別的指令），RAW、WAR、WAW 各有幾對？
== {raw},{war},{waw}
?? RAW,WAR,WAW
---
逐對檢查（$i$ 寫的被 $j$ 讀→RAW；$j$ 寫的是 $i$ 讀的→WAR；兩者寫同一個→WAW）：{'；'.join(lst)}。共 RAW {raw}、WAR {war}、WAW {waw}。實際排程時只有「最近的那次寫入」才真正限制順序；用暫存器換名可以消掉所有 WAR、WAW。
""")
    cnt+=1
print(''.join(out))

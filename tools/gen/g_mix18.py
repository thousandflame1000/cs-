import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
if want('tomasulo'):
  cnt=0
  while cnt<n:
    regs=['F0','F2','F4','F6','F8','F10']
    ins=[]; rstat={}; addn=multn=0; rows=[]
    for k in range(5):
        op=random.choice(['ADD.D','SUB.D','MUL.D','DIV.D'])
        d,s1,s2=random.choice(regs),random.choice(regs),random.choice(regs)
        if op in ('ADD.D','SUB.D'):
            addn+=1; st=f'Add{addn}'
        else:
            multn+=1; st=f'Mult{multn}'
        if addn>3 or multn>2: break
        qj=rstat.get(s1,'—'); qk=rstat.get(s2,'—')
        rows.append((op,d,s1,s2,st,qj,qk)); rstat[d]=st
    if len(rows)<5: continue
    last=rows[-1]
    ask=sorted(set(r[1] for r in rows))
    if len(ask)<3 or not any(r[5]!='—' or r[6]!='—' for r in rows): continue
    if last[5]=='—' and last[6]=='—': continue
    seq='；'.join(f'`{op} {d},{s1},{s2}`' for op,d,s1,s2,st,qj,qk in rows)
    trace='；'.join(f'{op} {d} 進 {st}（Qj={qj}、Qk={qk}），{d}→{st}' for op,d,s1,s2,st,qj,qk in rows)
    out.append(f"""@q il3-? | co-ilp#3 | 3 | 追蹤
Tomasulo，加法保留站 Add1～Add3、乘除保留站 Mult1～Mult2，依序 issue（還沒有任何指令完成）：{seq}。最後一條指令的 $Q_j$、$Q_k$ 各是什麼（運算元已就緒寫 —）？暫存器狀態表中 {'、'.join(ask)} 各指向哪個保留站？
== {last[5]},{last[6]},{','.join(rstat[r] for r in ask)}
?? Qj,Qk,{','.join(ask)}
---
每條指令 issue 時，查暫存器狀態表：來源暫存器若有保留站要寫它，就記下那個站名（$Q$），否則直接讀值；然後把目的暫存器改指向自己。{trace}。同一個暫存器被寫兩次時，狀態表只留**最後**那個寫入者——後面讀它的人等的是新值，WAW、WAR 就這樣被換名消掉。
""")
    cnt+=1
if want('rob'):
  cnt=0
  while cnt<n:
    N=6; issue=list(range(1,N+1)); lat=[random.choice([1,2,3,5,8]) for _ in range(N)]
    done=[issue[i]+lat[i] for i in range(N)]
    com=[]; last=0
    for i in range(N):
        c=max(done[i]+1,last+1); com.append(c); last=c
    if all(done[i]+1==com[i] for i in range(N)): continue
    out.append(f"""@q il4-? | co-ilp#4 | 3 | 追蹤
ROB 每拍最多 commit 1 條，而且只能照程式順序 commit。I1～I6 寫回結果（完成）的時間依序是第 {', '.join(map(str,done))} 拍；指令最早在完成的下一拍才能 commit。I1～I6 各在第幾拍 commit？
== {','.join(map(str,com))}
---
commit 時間＝max(完成時間＋1, 前一條的 commit 時間＋1)：{'；'.join(f'I{i+1}：max({done[i]+1}, {(com[i-1]+1) if i else 1})＝{com[i]}' for i in range(N))}。像 {'、'.join(f'I{i+1}' for i in range(1,N) if com[i]>done[i]+1) or '後面的指令'} 雖然早就算完，還是要等前面的人 commit——這就是「亂序執行、循序完成」，讓例外可以是精確的。
""")
    cnt+=1
def simpi(a,b,c,m,pi):
    # programs: list of ops; priority: H=3,M=2,L=1
    P={'L':{'pri':1,'arr':0,'prog':[('run',1),('lock',),('cs',c),('unlock',),('run',1)]},
       'H':{'pri':3,'arr':a,'prog':[('run',1),('lock',),('cs',1),('unlock',)]},
       'M':{'pri':2,'arr':b,'prog':[('run',m)]}}
    for p in P.values(): p['pc']=0; p['left']=None; p['done']=None
    owner=None; t=0; waiting=set(); log=[]
    def norm(p):
        while p['pc']<len(p['prog']):
            op=p['prog'][p['pc']]
            if op[0]=='lock':
                return 'lock'
            if op[0]=='unlock':
                return 'unlock'
            if p['left'] is None: p['left']=op[1]
            if p['left']==0: p['pc']+=1; p['left']=None; continue
            return 'run'
        return 'end'
    while t<100:
        # resolve instantaneous lock/unlock ops
        changed=True
        while changed:
            changed=False
            for name,p in P.items():
                if p['arr']>t or p['done'] is not None: continue
                s=norm(p)
                if s=='end': p['done']=t; changed=True
                elif s=='unlock': owner=None; p['pc']+=1; changed=True
                elif s=='lock' and owner is None: owner=name; p['pc']+=1; waiting.discard(name); changed=True
                elif s=='lock': waiting.add(name)
        if all(p['done'] is not None for p in P.values()): break
        def eff(name):
            pr=P[name]['pri']
            if pi and owner==name and waiting: pr=max(pr,max(P[w]['pri'] for w in waiting))
            return pr
        ready=[nm for nm,p in P.items() if p['arr']<=t and p['done'] is None and norm(p)=='run']
        if not ready: t+=1; log.append('閒'); continue
        r=max(ready,key=eff); P[r]['left']-=1; log.append(r); t+=1
    return P['H']['done'],log
if want('pinv'):
  cnt=0; seen=set()
  while cnt<n:
    c=random.randint(3,5); a=random.randint(2,c); b=a+random.randint(1,2); m=random.randint(3,6)
    if (a,b,c,m) in seen: continue
    seen.add((a,b,c,m))
    h0,l0=simpi(a,b,c,m,False); h1,l1=simpi(a,b,c,m,True)
    if h0<=h1: continue
    out.append(f"""@q sy6-? | os-sync#6 | 3 | 追蹤
單核心、優先權搶占式排程（H＞M＞L）。L 在時間 0 到達：先算 1 單位，拿鎖，臨界區 {c} 單位，放鎖，再算 1 單位。H 在時間 {a} 到達：算 1 單位後要拿同一把鎖，臨界區 1 單位就結束。M 在時間 {b} 到達：不用鎖，算 {m} 單位。H 在什麼時間完成？如果用優先權繼承（拿著鎖的 L 暫時升到 H 的優先權）呢？
== {h0},{h1}
?? 沒有繼承,優先權繼承
---
每一單位時間誰在跑：沒有繼承 {' '.join(l0)}；有繼承 {' '.join(l1)}。沒有繼承時，H 卡在等 L 的鎖，而 M 的優先權比 L 高，把 L 擠掉——H 實際上在等 M，這就是優先權反轉。繼承讓 L 用 H 的優先權跑完臨界區，M 插不進來，H 提早到 {h1} 完成。
""")
    cnt+=1
if want('relax'):
  cnt=0
  while cnt<n:
    V='sabcd'; E={}
    while len(E)<7:
        u,v=random.sample(V,2)
        if v=='s' or (u,v) in E: continue
        E[(u,v)]=random.randint(1,9)
    order=random.sample(sorted(E),len(E))
    d={x:math.inf for x in V}; d['s']=0; changes=0; log=[]
    for (u,v) in order:
        if d[u]+E[(u,v)]<d[v]: d[v]=d[u]+E[(u,v)]; changes+=1; log.append(f'{u}→{v}：{d[v]}')
        else: log.append(f'{u}→{v}：不變')
    if changes<3 or any(d[x]==math.inf for x in V): continue
    ds=lambda x:'∞' if d[x]==math.inf else str(d[x])
    out.append(f"""@q sp1-? | al-sp#1 | 2 | 追蹤
一開始 $s.d=0$、其他都是 $\\infty$。依序**只鬆弛一次**這些邊：{'、'.join(f'{u}→{v}({E[(u,v)]})' for u,v in order)}。結束時 $a.d,b.d,c.d,d.d$ 各是多少？
== {ds('a')},{ds('b')},{ds('c')},{ds('d')}
?? a,b,c,d
---
鬆弛 $(u,v)$：若 $u.d+w<v.d$ 就更新。依序：{'；'.join(log)}。$u.d$ 還是 ∞ 時鬆弛它的出邊不會有作用，所以鬆弛的**順序**決定一輪能傳多遠；照拓撲順序（或最短路徑順序）只要一輪就會全對。
""")
    cnt+=1
if want('bf'):
  cnt=0
  while cnt<n:
    V='sabcd'; E={}
    while len(E)<7:
        u,v=random.sample(V,2)
        if v=='s' or (u,v) in E or (v,u) in E: continue
        E[(u,v)]=random.randint(-3,8)
    order=sorted(E,key=lambda e:(e[0]!='s',random.random()))
    order=random.sample(sorted(E),len(E))
    d={x:math.inf for x in V}; d['s']=0; rounds=0; snap=[]
    for r in range(1,6):
        ch=False
        for (u,v) in order:
            if d[u]+E[(u,v)]<d[v]: d[v]=d[u]+E[(u,v)]; ch=True
        snap.append(dict(d))
        if not ch: rounds=r; break
    else: continue
    if any(d[u]+w<d[v] for (u,v),w in E.items()): continue
    if rounds<3 or any(x==math.inf for x in d.values()) or not any(w<0 for w in E.values()): continue
    s1=snap[0]; ds=lambda D,x:'∞' if D[x]==math.inf else str(D[x])
    out.append(f"""@q sp3-? | al-sp#3 | 3 | 追蹤
Bellman-Ford，每一輪照固定順序鬆弛 {'、'.join(f'{u}→{v}({E[(u,v)]})' for u,v in order)}；某一輪完全沒有更新就停。最後 $a,b,c,d$ 的距離是？總共跑了幾輪（含最後那輪沒更新的）？
== {d['a']},{d['b']},{d['c']},{d['d']},{rounds}
?? a,b,c,d,輪數
---
{'；'.join(f'第 1 輪後 '+', '.join(f'{x}={ds(snap[0],x)}' for x in 'abcd') for _ in [0])}；{'；'.join(f'第 {i+1} 輪後 '+', '.join(f'{x}={ds(snap[i],x)}' for x in 'abcd') for i in range(1,len(snap)))}。最終距離 {', '.join(f'{x}={d[x]}' for x in 'abcd')}。最壞要 $V-1=4$ 輪才保證收斂，但順序剛好時可以提早停；加上「整輪沒更新就停」能省很多時間。
""")
    cnt+=1
if want('prop'):
  cnt=0
  while cnt<n:
    m=random.choice([62,64,96,100,128]); s=[random.choice([10,20,40,60,80,127,150]) for _ in range(3)]
    S=sum(s); a=[si*m//S for si in s]
    if len(set(s))<3: continue
    left=m-sum(a)
    out.append(f"""@q vm4-? | os-vm#4 | 2 | 計算
共有 {m} 個 frame，三個行程的大小依序是 {s[0]}、{s[1]}、{s[2]} 頁。用比例配置（$a_i=\\lfloor s_i/S\\times m\\rfloor$）各分到幾個 frame？
== {a[0]},{a[1]},{a[2]}
---
$S={S}$。$a_1=\\lfloor{s[0]}/{S}\\times{m}\\rfloor={a[0]}$、$a_2=\\lfloor{s[1]}/{S}\\times{m}\\rfloor={a[1]}$、$a_3=\\lfloor{s[2]}/{S}\\times{m}\\rfloor={a[2]}$，剩下 {left} 個可以當作空閒池。比平均分配合理：大的行程拿多一點；也可以再依優先權加權。
""")
    cnt+=1
if want('eig3'):
  cnt=0; seen=set()
  Ps=[[[1,1],[1,2]],[[1,1],[0,1]],[[2,1],[1,1]],[[1,2],[1,1]],[[1,0],[1,1]],[[1,1],[1,0]],[[1,1],[1,-1]]]
  while cnt<n:
    P=random.choice(Ps); l1,l2=random.sample([-1,1,2,3,F(1,2)],2); c1,c2=random.choice([1,2,-1]),random.choice([1,2,-1,3]); k=random.randint(3,5)
    key=(str(P),l1,l2,c1,c2,k)
    if key in seen: continue
    seen.add(key)
    v1=[P[0][0],P[1][0]]; v2=[P[0][1],P[1][1]]
    dp=P[0][0]*P[1][1]-P[0][1]*P[1][0]
    Pi=[[F(P[1][1],dp),F(-P[0][1],dp)],[F(-P[1][0],dp),F(P[0][0],dp)]]
    def mul(X,Y): return [[sum(X[i][t]*Y[t][j] for t in range(2)) for j in range(2)] for i in range(2)]
    A=mul(mul(P,[[l1,0],[0,l2]]),Pi)
    if any(F(x).denominator>2 for r in A for x in r): continue
    x0=[c1*v1[0]+c2*v2[0],c1*v1[1]+c2*v2[1]]
    cs1={1:'',-1:'-'}.get(c1,str(c1)); cs2={1:'+',-1:'-'}.get(c2,('+' if c2>0 else '')+str(c2))
    xk=[F(c1)*F(l1)**k*v1[i]+F(c2)*F(l2)**k*v2[i] for i in range(2)]
    out.append(f"""@q ei3-? | la-eigen#3 | 3 | 計算
$x_{{t+1}}=Ax_t$，$A={mat(A)}$，$x_0=({x0[0]},{x0[1]})$。$x_{{{k}}}$ 是？（兩個分量，可用分數）
== {fr(xk[0])},{fr(xk[1])}
---
$A$ 的特徵值 {fr(F(l1))}、{fr(F(l2))}，特徵向量 $v_1=({v1[0]},{v1[1]})$、$v_2=({v2[0]},{v2[1]})$。把 $x_0$ 拆成 $x_0={cs1}v_1{cs2}v_2$，每一步各自乘上自己的特徵值：$x_{{{k}}}={cs1}({fr(F(l1))})^{{{k}}}v_1{cs2}({fr(F(l2))})^{{{k}}}v_2=({fr(xk[0])},{fr(xk[1])})$。$t$ 很大時，絕對值最大的特徵值那一項會主導。
""".replace('+-','-'))
    cnt+=1
print(''.join(out))

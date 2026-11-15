import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('lnk'):
  cnt=0; seen=set()
  while cnt<n:
    # state: names -> ('h',inode) or ('s',target name)
    names={'f':('h',1)}; links={1:1}; ops=['建立檔案 `f`']; avail=['g','h','k','m']; 
    for _ in range(random.randint(4,6)):
        r=random.random()
        hard=[x for x,v in names.items() if v[0]=='h']
        if r<0.35 and hard and avail:
            src=random.choice(hard); dst=avail.pop(0); names[dst]=('h',names[src][1]); links[names[src][1]]+=1; ops.append(f'`ln {src} {dst}`')
        elif r<0.55 and hard and avail and not any(v[0]=='s' for v in names.values()):
            src=random.choice(hard); dst='s'; names[dst]=('s',src); ops.append(f'`ln -s {src} s`')
        elif len(names)>1:
            victim=random.choice([x for x in names if x!='s'] or list(names))
            if names[victim][0]=='h': links[names[victim][1]]-=1
            del names[victim]; ops.append(f'`rm {victim}`')
    if not any(v[0]=='s' for v in names.values()): continue
    tgt=names['s'][1]; ok=tgt in names
    lc=links[1]
    key=tuple(ops)
    if key in seen or len(ops)<5: continue
    seen.add(key)
    remain=[x for x,v in names.items() if v[0]=='h']
    out.append(f"""@q st4-? | os-storage#4 | 3 | 追蹤
在同一個目錄依序執行：{'、'.join(ops)}。最後原本那個檔案的 inode 連結數是多少？`cat s` 讀得到內容嗎？
== {lc},{'讀得到' if ok else '讀不到'}
== {lc},{'能' if ok else '不能'}
?? 連結數,cat s
---
硬連結（`ln`）是同一個 inode 多一個名字，連結數 +1；`rm` 一個硬連結名字讓連結數 −1，降到 0 且沒人開著時才真的釋放資料。符號連結（`ln -s`）只存「路徑字串」{names['s'][1]}，不算連結數。最後還指向原 inode 的名字：{'、'.join(remain) if remain else '沒有'}，連結數 {lc}。`s` 存的路徑 `{tgt}` {'還在' if ok else '已經被刪掉'}，所以 `cat s` {'讀得到' if ok else '會失敗（懸空的符號連結）'}{'——即使原本的名字 f 不在了，只要路徑名字還在就行' if ok and 'f' not in names else ''}。
""")
    cnt+=1
if want('eqc'):
  cnt=0
  while cnt<n:
    N=random.randint(7,9); m=random.randint(3,5)
    pairs=set()
    while len(pairs)<m:
        a,b=random.sample(range(1,N+1),2); pairs.add((min(a,b),max(a,b)))
    par=list(range(N+1))
    def find(x):
        while par[x]!=x: x=par[x]
        return x
    for a,b in pairs: par[find(a)]=find(b)
    cls={}
    for x in range(1,N+1): cls.setdefault(find(x),[]).append(x)
    C=sorted(cls.values())
    k=len(C); tot=sum(len(c)**2 for c in C)
    if max(len(c) for c in C)<3: continue
    ps='、'.join(f'$({a},{b})$' for a,b in sorted(pairs))
    st=lambda s:BS+'{'+','.join(map(str,s))+BS+'}'
    cl='、'.join('$'+st(c)+'$' for c in C)
    sq='+'.join(f'{len(c)}^2' for c in C)
    out.append(f"""@q rl3-? | dm-relations#3 | 3 | 計算
在 $\\{{1,\\dots,{N}\\}}$ 上，找包含 {ps} 的**最小**等價關係。它有幾個等價類？這個關係一共有幾個有序對？
== {k},{tot}
?? 等價類數,有序對數
---
要自反、對稱、遞移，等於把有連到的元素併成同一類（像找連通塊）：{cl}，共 {k} 類。每一類大小 $s$ 的類裡任兩個（含自己和自己、兩種順序）都有關係，貢獻 $s^2$ 個有序對：${sq}={tot}$。
""")
    cnt+=1
if want('stair'):
  cnt=0; seen=set()
  while cnt<n:
    S=random.choice([[1,2],[1,3],[1,2,3],[2,3],[1,4]]); N=random.randint(8,11); bad=random.sample(range(2,N),random.randint(1,2))
    key=(tuple(S),N,tuple(sorted(bad)))
    if key in seen: continue
    seen.add(key)
    w=[0]*(N+1); w[0]=1
    for i in range(1,N+1):
        if i in bad: w[i]=0; continue
        w[i]=sum(w[i-s] for s in S if i-s>=0)
    if w[N]<3: continue
    bs='、'.join(f'第 {b} 階' for b in sorted(bad))
    seq='、'.join(f'$a_{{{i}}}={w[i]}$' for i in range(1,N+1))
    out.append(f"""@q rg1-? | dm-recur-gf#1 | 3 | 計算
爬 {N} 階樓梯，每一步可以上 {'、'.join(map(str,S))} 階；但{bs}壞掉了，不能踩。從地面（第 0 階）到第 {N} 階有幾種走法？
== {w[N]}
---
$a_i$＝走到第 $i$ 階的方法數，最後一步從 $i-s$（$s\\in\\{{{','.join(map(str,S))}\\}}$）上來：$a_i=\\sum_s a_{{i-s}}$，壞掉的階 $a_i=0$，$a_0=1$。依序 {seq}。壞階設成 0 之後，遞迴照樣用，等於自動排除所有會踩到它的走法。
""")
    cnt+=1
if want('gs'):
  cnt=0
  while cnt<n:
    v1=[random.randint(-2,2) for _ in range(3)]; v2=[random.randint(-3,3) for _ in range(3)]
    d11=sum(x*x for x in v1); d12=sum(a*b for a,b in zip(v1,v2))
    if d11==0 or d12==0: continue
    c=F(d12,d11); u=[F(b)-c*a for a,b in zip(v1,v2)]
    if all(x==0 for x in u) or all(x.denominator==1 for x in u) and c.denominator==1 and False: continue
    if any(x.denominator>9 for x in u): continue
    ans=','.join(fr(x) for x in u)
    chk=sum(a*x for a,x in zip(v1,u))
    vec=lambda v:'('+','.join(map(str,v))+')'
    out.append(f"""@q or5-? | la-ortho#5 | 2 | 計算
Gram–Schmidt 處理 $v_1={vec(v1)}$、$v_2={vec(v2)}$。第二步得到的（還沒正規化的）$u_2=v_2-\\frac{{v_2\\cdot v_1}}{{v_1\\cdot v_1}}v_1$ 是？（三個分量，可用分數）
== {ans}
---
$v_2\\cdot v_1={d12}$、$v_1\\cdot v_1={d11}$，係數 ${fr(c)}$。$u_2={vec(v2)}-({fr(c)}){vec(v1)}=({', '.join(fr(x) for x in u)})$。檢查：$u_2\\cdot v_1={fr(chk)}$，確實和 $v_1$ 垂直。
""")
    cnt+=1
if want('wfg'):
  cnt=0
  while cnt<n:
    N=random.randint(5,6); P=[f'P{i}' for i in range(1,N+1)]
    E=set()
    while len(E)<N+1:
        a,b=random.sample(range(N),2); E.add((a,b))
    # cycles exist?
    def has_cycle(alive):
        col={}
        def dfs(u):
            col[u]=1
            for a,b in E:
                if a==u and b in alive:
                    if col.get(b)==1: return True
                    if col.get(b) is None and dfs(b): return True
            col[u]=2; return False
        return any(col.get(u) is None and dfs(u) for u in alive)
    full=set(range(N))
    if not has_cycle(full): continue
    best=None
    for k in range(1,N):
        sols=[c for c in itertools.combinations(range(N),k) if not has_cycle(full-set(c))]
        if sols: best=(k,sols); break
    if best[0]<2 and random.random()<0.5: continue
    if len(best[1])!=1: continue
    sol=best[1][0]
    es='、'.join(f'{P[a]}→{P[b]}' for a,b in sorted(E))
    out.append(f"""@q dl4-? | os-deadlock#4 | 3 | 計算
等待圖（$P_i\\to P_j$ 表示 $P_i$ 在等 $P_j$ 手上的資源）的邊：{es}（一個行程可能同時在等好幾個資源）。若用「終止行程」來解除死結，最少要終止幾個行程？要終止哪些？（行程名稱由小到大、用空格隔開）
== {best[0]},{' '.join(P[i] for i in sol)}
?? 個數,哪些
---
等待圖有環就有死結。要讓圖上不再有任何環，最少得拿掉 {best[0]} 個點，而且唯一的選法是 {'、'.join(P[i] for i in sol)}（終止後它手上的資源釋放，等它的行程就能繼續）。{'只殺一個不夠：任選一個拿掉都還留著別的環。' if best[0]>=2 else '這個行程在所有的環上，殺它一個就夠。'}實務上還要看各行程的優先權、已跑多久、拿了多少資源來挑犧牲者。
""")
    cnt+=1
if want('jor'):
  cnt=0; seen=set()
  def parts(m,mx=None):
    if mx is None: mx=m
    if m==0: yield []; return
    for k in range(min(m,mx),0,-1):
        for p in parts(m-k,k): yield [k]+p
  while cnt<n:
    N=random.choice([5,6,7]); L=list(parts(N)); p=random.choice(L)
    if len(p)==1 or len(p)==N or tuple(p) in seen: continue
    seen.add(tuple(p))
    lam=random.choice([2,3,-1,4])
    dims=[sum(min(b,k) for b in p) for k in range(1,max(p)+1)]
    ks=len(dims)
    sh=('A-'+str(lam)+'I') if lam>0 else 'A+I'
    give='、'.join(f'$\\dim N({sh})^{{{k}}}={dims[k-1]}$' if k>1 else f'$\\dim N({sh})={dims[0]}$' for k in range(1,ks+1))
    diffs=[dims[0]]+[dims[i]-dims[i-1] for i in range(1,ks)]
    out.append(f"""@q ei5-? | la-eigen#5 | 3 | 計算
${N}\\times{N}$ 矩陣 $A$ 只有特徵值 ${lam}$，已知 {give}。Jordan 形式中各區塊的大小是？（由大到小，逗號隔開）
== {','.join(map(str,p))}
---
$\\dim N(A-\\lambda I)^k-\\dim N(A-\\lambda I)^{{k-1}}$＝大小至少 $k$ 的區塊個數：依序 {', '.join(map(str,diffs))}。所以有 {diffs[0]} 個區塊；{'；'.join(f'至少 {k+1} 的有 {diffs[k]} 個' for k in range(1,ks))}。由此得區塊大小 {', '.join(map(str,p))}（總和 {N}）。
""")
    cnt+=1
print(''.join(out))

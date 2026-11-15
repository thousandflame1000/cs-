import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
class LN:
    def __init__(s,k): s.k=k; s.l=s.r=None; s.s=1
def S(x): return x.s if x else 0
def lmerge(a,b,log):
    if not a: return b
    if not b: return a
    if a.k>b.k: a,b=b,a
    a.r=lmerge(a.r,b,log)
    if S(a.l)<S(a.r): a.l,a.r=a.r,a.l; log.append(a.k)
    a.s=S(a.r)+1
    return a
def lpre(t): return [t.k]+lpre(t.l)+lpre(t.r) if t else []
if want('leftist'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,50),7); t=None; sw=[]
    for k in ks: t=lmerge(t,LN(k),sw)
    if len(sw)<2: continue
    out.append(f"""@q hp3-? | ds-heap#3 | 3 | 追蹤
Leftist min-heap，$s(x)$＝$x$ 到最近的空指標的距離（空指標 $s=0$）。插入＝和單一節點合併；合併時根較小的當根、遞迴合併它的右子樹，回來後若 $s(\\text{{左}})<s(\\text{{右}})$ 就交換左右。依序插入 {', '.join(map(str,ks))}。最後的前序走訪是？根的 $s$ 值是？
== {' '.join(map(str,lpre(t)))},{t.s}
?? 前序（空格隔開）,根的 s
---
合併時發生左右交換的節點依序是 {'、'.join(map(str,sw))}。最後前序 {' '.join(map(str,lpre(t)))}，根的 $s={t.s}$。交換保證「右邊那條路最短」，所以合併只沿右路徑走，$O(\\lg n)$。
""")
    cnt+=1
class BN:
    def __init__(s,leaf=True): s.keys=[]; s.ch=[]; s.leaf=leaf
def bsplit(x,i,cnt):
    y=x.ch[i]; z=BN(y.leaf); mid=y.keys[1]
    z.keys=y.keys[2:]; y.keys=y.keys[:1]
    if not y.leaf: z.ch=y.ch[2:]; y.ch=y.ch[:2]
    x.ch.insert(i+1,z); x.keys.insert(i,mid); cnt[0]+=1
def binsert(root,k,cnt):
    if len(root.keys)==3:
        s=BN(False); s.ch=[root]; bsplit(s,0,cnt); root=s
    x=root
    while not x.leaf:
        i=sum(1 for v in x.keys if k>v)
        if len(x.ch[i].keys)==3:
            bsplit(x,i,cnt)
            if k>x.keys[i]: i+=1
        x=x.ch[i]
    x.keys.append(k); x.keys.sort()
    return root
def bdepth(x): return 1 if x.leaf else 1+bdepth(x.ch[0])
if want('btree'):
  cnt=0
  while cnt<n:
    ks=random.sample(range(1,90),random.randint(9,11)); root=BN(); c=[0]
    for k in ks: root=binsert(root,k,c)
    if c[0]<3: continue
    out.append(f"""@q bt1-? | ds-btree#1 | 3 | 追蹤
最小度數 $t=2$ 的 B 樹（每個節點 1～3 個 key），用 CLRS 的插入法：從根往下走時，遇到已經有 3 個 key 的節點就**先分裂**（中間的 key 往上提），再繼續往下。依序插入 {', '.join(map(str,ks))}。一共分裂了幾次？最後根有哪些 key？
== {c[0]},{' '.join(map(str,root.keys))}
?? 分裂次數,根的 key（空格隔開）
---
照規則模擬：共分裂 {c[0]} 次，樹高 {bdepth(root)} 層，根是 {' '.join(map(str,root.keys))}。「往下時先分裂」保證插入時父節點一定有空位，不必再往上回溯；樹只會在根分裂時長高，所以所有葉子永遠同一層。
""")
    cnt+=1
def fifo(ref,k):
    fr_=[]; f=0
    for p in ref:
        if p not in fr_:
            f+=1
            if len(fr_)==k: fr_.pop(0)
            fr_.append(p)
    return f
if want('belady'):
  cnt=0; seen=set()
  while cnt<n:
    ref=[random.randint(1,5) for _ in range(12)]
    a3=fifo(ref,3); a4=fifo(ref,4)
    if a4<=a3 or tuple(ref) in seen or ref==[1,2,3,4,1,2,5,1,2,3,4,5]: continue
    seen.add(tuple(ref))
    out.append(f"""@q vm2-? | os-vm#2 | 3 | 計算
參考串 {' '.join(map(str,ref))}，用 FIFO 頁替換。frame 有 3 個時會發生幾次 page fault？4 個時呢？
== {a3},{a4}
?? 3 frames,4 frames
---
照 FIFO 模擬：3 個 frame {a3} 次、4 個 frame {a4} 次——frame 變多，fault 反而變多，這就是 Belady 異常。FIFO 不是堆疊演算法（$k$ 個 frame 時留在記憶體的頁，不一定是 $k+1$ 個 frame 時那組的子集）；LRU、OPT 不會有這個現象。
""")
    cnt+=1
if want('cla'):
  cnt=0
  while cnt<n:
    a=random.randint(0,15); b=random.randint(0,15); c0=random.randint(0,1)
    A=[(a>>i)&1 for i in range(4)]; B=[(b>>i)&1 for i in range(4)]
    g=[A[i]&B[i] for i in range(4)]; p=[A[i]|B[i] for i in range(4)]
    c=[c0]
    for i in range(4): c.append(g[i]|(p[i]&c[i]))
    G=g[3]|(p[3]&g[2])|(p[3]&p[2]&g[1])|(p[3]&p[2]&p[1]&g[0]); P=p[3]&p[2]&p[1]&p[0]
    assert c[4]==(G|(P&c0)) and c[4]==((a+b+c0)>>4)
    out.append(f"""@q ar2-? | co-arith#2 | 3 | 計算
4 位元先行進位加法器：$a=$`{a:04b}`、$b=$`{b:04b}`、$c_0={c0}$，$g_i=a_ib_i$、$p_i=a_i+b_i$（OR）。$c_1c_2c_3c_4$ 依序是？群組的 $P$、$G$ 各是？
== {''.join(map(str,c[1:]))},{P},{G}
?? c1c2c3c4,P,G
---
由右（第 0 位）往左：$g=$({','.join(map(str,g))})、$p=$({','.join(map(str,p))})（依 $i=0..3$）。$c_{{i+1}}=g_i+p_ic_i$ 得 $c_1..c_4$＝{''.join(map(str,c[1:]))}。$P=p_3p_2p_1p_0={P}$、$G=g_3+p_3g_2+p_3p_2g_1+p_3p_2p_1g_0={G}$，檢查 $c_4=G+Pc_0={c[4]}$ ✓（{a}＋{b}＋{c0}＝{a+b+c0}，{'≥16 確實有進位' if a+b+c0>=16 else '小於 16，沒有進位'}）。先行進位把每個 $c_i$ 都展開成只依賴 $g,p,c_0$ 的式子，所以能同時算出。
""")
    cnt+=1
if want('twostack'):
  cnt=0
  while cnt<n:
    ops=[]; Sin=[]; Sout=[]; moves=0; deq=[]; x=1; size=0
    for _ in range(random.randint(9,12)):
        if size>0 and random.random()<0.45:
            if not Sout:
                while Sin: Sout.append(Sin.pop()); moves+=1
            deq.append(Sout.pop()); size-=1; ops.append('出')
        else:
            Sin.append(x); ops.append(f'入{x}'); x+=1; size+=1
    if moves<3 or len(deq)<3: continue
    out.append(f"""@q bam1-? | ds-amortized#1 | 2 | 追蹤
用兩個堆疊做佇列：入隊 push 到 $S_{{in}}$；出隊時若 $S_{{out}}$ 是空的，先把 $S_{{in}}$ 全部一個一個搬到 $S_{{out}}$，再從 $S_{{out}}$ pop。依序：{'、'.join(ops)}（「入k」是放入 k，「出」是拿出）。總共搬了幾個元素？拿出來的順序是？
== {moves},{' '.join(map(str,deq))}
?? 搬移總數,拿出順序（空格隔開）
---
只有在 $S_{{out}}$ 空的時候才整批搬，搬一次順序剛好反過來，所以拿出順序 {' '.join(map(str,deq))} 和一般佇列一樣先進先出。每個元素一生最多被搬一次，總搬移 {moves} 次 $\\le$ 放入的個數，攤銷後每個操作 $O(1)$。
""")
    cnt+=1
if want('konig'):
  cnt=0
  while cnt<n:
    L=['a','b','c','d','e']; R=['1','2','3','4','5']
    E=set()
    while len(E)<7: E.add((random.choice(L),random.choice(R)))
    E=sorted(E); best=0
    for k in range(len(E),0,-1):
        for comb in itertools.combinations(E,k):
            if len({u for u,v in comb})==k and len({v for u,v in comb})==k: best=k; break
        if best: break
    vc=None
    for k in range(1,11):
        for comb in itertools.combinations(L+R,k):
            s=set(comb)
            if all(u in s or v in s for u,v in E): vc=comb; break
        if vc: break
    assert len(vc)==best
    if best>=5 or best<3: continue
    es='、'.join(f'{u}–{v}' for u,v in E)
    out.append(f"""@q dg6-? | dm-graph#6 | 3 | 計算
二分圖左邊 a～e、右邊 1～5，邊：{es}。最大匹配有幾條邊？最少要選幾個點，才能讓每條邊至少有一端被選到？
== {best},{len(vc)}
?? 最大匹配,最小點覆蓋
---
最大匹配 {best}；一個最小的覆蓋是 {{{', '.join(vc)}}}，大小 {len(vc)}。任何覆蓋都要碰到匹配裡每條邊（而那些邊兩兩沒有共同端點），所以覆蓋 $\\ge$ 匹配；König 定理說在二分圖裡兩者一定**相等**。一般圖就不一定（例如三角形：匹配 1、覆蓋 2）。
""")
    cnt+=1
if want('vsk'):
  cnt=0
  while cnt<n:
    V=[[random.randint(-2,3) for _ in range(3)] for _ in range(3)]
    i,j=random.randrange(3),random.randrange(3)
    def det(M): 
        a,b,c=M[0];d,e,f=M[1];g,h,k_=M[2]
        return a*(e*k_-f*h)-b*(d*k_-f*g)+c*(d*h-e*g)
    V[i][j]=0; d0=det(V); V[i][j]=1; d1=det(V)-d0
    if d1==0 or d0%d1: continue
    k=-d0//d1
    if k==0: continue
    V[i][j]='k'
    vs='、'.join('$('+','.join(map(str,v))+')$' for v in V)
    V2=[[k if x=='k' else x for x in v] for v in V]
    assert det(V2)==0
    out.append(f"""@q vs2-? | la-vs#2 | 2 | 計算
向量 {vs}。$k$ 等於多少時，這三個向量線性相依？
== {k}
---
三個 $\\mathbb R^3$ 向量線性相依 ⇔ 排成的矩陣行列式為 0。展開後行列式是 $k$ 的一次式：${d1}k{'+' if d0>=0 else ''}{d0}=0$，得 $k={k}$。此時其中一個可以寫成另外兩個的組合，三個只張出一個平面。
""")
    cnt+=1
if want('ch'):
  cnt=0; seen=set()
  while cnt<n:
    A=[[random.randint(-3,4) for _ in range(2)] for _ in range(2)]
    t=A[0][0]+A[1][1]; d=A[0][0]*A[1][1]-A[0][1]*A[1][0]
    if d==0 or t==0 or str(A) in seen: continue
    seen.add(str(A))
    p=t*t-d; q=-t*d
    def mul(X,Y): return [[sum(X[i][k]*Y[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    A3=mul(mul(A,A),A)
    assert all(A3[i][j]==p*A[i][j]+(q if i==j else 0) for i in range(2) for j in range(2))
    sg=lambda x:('+' if x>=0 else '-')+str(abs(x))
    cp='\\lambda^2'+(sg(-t)+'\\lambda' if t else '')+sg(d)
    a2=f'{t}A'+sg(-d)+'I'
    a3=f'{t}A^2'+sg(-d)+'A'
    a3b=f'{t}({a2})'+sg(-d)+'A'
    out.append(f"""@q ei4-? | la-eigen#4 | 3 | 計算
$A={mat(A)}$。用 Cayley–Hamilton 定理把 $A^3$ 寫成 $pA+qI$，$p$、$q$ 各是多少？
== {p},{q}
?? p,q
---
特徵多項式 ${cp}$（跡 {t}、行列式 {d}），代入 $A$ 得 $A^2={a2}$。$A^3=A\\cdot A^2={a3}={a3b}$，整理得 $p=t^2-d={p}$、$q=-td={q}$。驗算：$A^3={mat(A3)}$，和 ${p}A{sg(q)}I$ 相同。
""")
    cnt+=1
if want('johnson'):
  cnt=0
  while cnt<n:
    Vs='abcd'; E={}
    while len(E)<6:
        u,v=random.sample(Vs,2)
        if (v,u) in E: continue
        E[(u,v)]=random.randint(-3,6)
    if not any(w<0 for w in E.values()): continue
    h={v:0 for v in Vs}
    for _ in range(4):
        for (u,v),w in E.items():
            if h[u]+w<h[v]: h[v]=h[u]+w
    if any(h[u]+w<h[v] for (u,v),w in E.items()): continue
    neg=[(u,v) for (u,v),w in E.items() if w<0]; u,v=random.choice(neg)
    wp={e:w+h[e[0]]-h[e[1]] for e,w in E.items()}
    assert min(wp.values())>=0
    if all(x==0 for x in h.values()): continue
    es='、'.join(f'{a}→{b} {w}' for (a,b),w in sorted(E.items()))
    out.append(f"""@q sp4-? | al-sp#4 | 3 | 計算
Johnson 演算法：圖的邊 {es}。加一個新點 $s$ 連到每個點（權重 0），用 Bellman-Ford 算 $h(x)=\\delta(s,x)$。$h(a),h(b),h(c),h(d)$ 依序是？重新加權後 {u}→{v} 的權重 $\\hat w=w+h({u})-h({v})$ 是？
== {h['a']},{h['b']},{h['c']},{h['d']},{wp[(u,v)]}
?? h(a),h(b),h(c),h(d),新權重
---
從 $s$ 出發每個點一開始都是 0（直接走權重 0 的邊），再沿負邊往下壓：$h$＝({h['a']}, {h['b']}, {h['c']}, {h['d']})。{u}→{v}：${E[(u,v)]}+({h[u]})-({h[v]})={wp[(u,v)]}$。所有新權重都 $\\ge0$（三角不等式保證），之後每個點跑 Dijkstra；任一條路徑的長度只差 $h(\\text{{起點}})-h(\\text{{終點}})$，最短路徑不變。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
if want('hdiv'):
  cnt=0; seen=set()
  while cnt<n:
    s=random.choice([4,6,8,10]); N=random.randint(15,25); m1=random.choice([8,10,12,16]); m2=random.choice([7,11,13])
    if math.gcd(s,m1)==1 or (s,N,m1,m2) in seen: continue
    seen.add((s,N,m1,m2))
    ks=[s*i for i in range(1,N+1)]
    u1=len(set(k%m1 for k in ks)); u2=len(set(k%m2 for k in ks))
    out.append(f"""@q hs1-? | ds-hash#1 | 3 | 計算
key 都是 {s} 的倍數：{s}, {2*s}, …, {s*N}（共 {N} 個）。用除法法 $h(k)=k\\bmod m$。$m={m1}$ 時這些 key 只會用到幾個不同的格子？$m={m2}$ 時呢？
== {u1},{u2}
?? m={m1},m={m2}
---
$k={s}i$，$k\\bmod m$ 只能是 $\\gcd({s},m)$ 的倍數。$\\gcd({s},{m1})={math.gcd(s,m1)}$，所以最多只用到 ${m1}/{math.gcd(s,m1)}={m1//math.gcd(s,m1)}$ 格（實際 {u1} 格）；${m2}$ 是質數、和 {s} 互質，{N} 個 key 會輪流用到 {u2} 格。這就是除法法建議 $m$ 取「不靠近 2 的次方的質數」的原因：資料常有規律，$m$ 和規律有公因數就會擠在少數格子。
""")
    cnt+=1
if want('hmean'):
  cnt=0; seen=set()
  while cnt<n:
    d=[random.choice([30,40,60,90,120]) for _ in range(3)]; v=[random.choice([30,40,60,90,120]) for _ in range(3)]
    if len(set(v))<2 or (tuple(d),tuple(v)) in seen: continue
    seen.add((tuple(d),tuple(v)))
    T=sum(F(a,b) for a,b in zip(d,v)); D=sum(d); avg=F(D)/T; am=F(sum(v),3)
    out.append(f"""@q pf2-? | co-perf#2 | 3 | 計算
一趟車程分三段：{d[0]} km 以 {v[0]} km/h、{d[1]} km 以 {v[1]} km/h、{d[2]} km 以 {v[2]} km/h。整趟的平均速率是多少 km/h？（可用分數）它和三個速率的算術平均 {fr(am)} 比，哪個大？
== {fr(avg)},{'算術平均大' if am>avg else ('一樣' if am==avg else '平均速率大')}
?? 平均速率,比較
---
平均速率＝總距離／總時間＝${D}\\div({'+'.join(f'{a}/{b}' for a,b in zip(d,v))})={D}\\div{fr(T)}={fr(avg)}$。這是以距離加權的**調和平均**。速率（例如 MIPS、每秒工作量）要用調和平均合併；直接取算術平均 {fr(am)} 會{'高估' if am>avg else '低估'}——慢的那段花了比較多時間。
""")
    cnt+=1
if want('pig2'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.randint(10,40)
    if N in seen: continue
    seen.add(N)
    pairs=N//2; mid=N%2
    ans=pairs+mid+1
    out.append(f"""@q lg4-? | dm-logic#4 | 3 | 計算
從 1～{N} 中挑一些不同的整數。至少要挑幾個，才能**保證**其中有兩個數的和是 {N+1}？
== {ans}
---
把 1～{N} 配成和為 {N+1} 的「箱子」：(1,{N})、(2,{N-1})、…，共 {pairs} 對{'，另外 '+str((N+1)//2)+' 自己一個（它找不到不同的伴）' if mid else ''}。每對最多只能挑一個而不湊成 {N+1}，所以最多能挑 {pairs+mid} 個而沒有任何一對；再多挑一個就一定湊成。答案 {ans}。鴿籠的關鍵是「怎麼設計箱子」。
""")
    cnt+=1
if want('dcfull'):
  cnt=0
  while cnt<n:
    A=[random.randint(-9,9) for _ in range(8)]
    def best(a): return max(sum(a[i:j+1]) for i in range(len(a)) for j in range(i,len(a)))
    L=best(A[:4]); R=best(A[4:])
    bl=max(sum(A[i:4]) for i in range(4)); br=max(sum(A[4:j+1]) for j in range(4,8)); C=bl+br
    tot=max(L,R,C)
    if len({L,R,C})<3 or tot!=best(A): continue
    out.append(f"""@q dc1-? | al-dc#1 | 3 | 計算
用分治法找 `A = [{', '.join(map(str,A))}]` 的最大子陣列和（切成第 0～3、4～7 格）。左半的答案、右半的答案、跨中間的最大和、最後答案各是多少？
== {L},{R},{C},{tot}
?? 左半,右半,跨中間,答案
---
左半 [{', '.join(map(str,A[:4]))}] 的最大子陣列和 {L}；右半 [{', '.join(map(str,A[4:]))}] 是 {R}（兩半各自再遞迴，這裡長度小直接看）。跨中間：從第 3 格往左最多 {bl}、從第 4 格往右最多 {br}，合計 {C}。答案 $\\max({L},{R},{C})={tot}$。合併步驟 $O(n)$，總時間 $T(n)=2T(n/2)+O(n)=O(n\\lg n)$。
""")
    cnt+=1
def det3(M):
    a,b,c=M[0];d,e,f=M[1];g,h,i=M[2]
    return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
if want('inv3full'):
  cnt=0
  while cnt<n:
    A=[[random.randint(-2,2) for _ in range(3)] for _ in range(3)]; D=det3(A)
    if D not in (1,-1): continue
    inv=[[0]*3 for _ in range(3)]
    for i in range(3):
        for j in range(3):
            mi=[[A[r][c] for c in range(3) if c!=i] for r in range(3) if r!=j]
            inv[i][j]=F((-1)**(i+j)*(mi[0][0]*mi[1][1]-mi[0][1]*mi[1][0]),D)
    chk=[[sum(A[i][k]*inv[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    assert all(chk[i][j]==(1 if i==j else 0) for i in range(3) for j in range(3))
    if sum(1 for r in A for x in r if x==0)>4: continue
    out.append(f"""@q ls2-? | la-systems#2 | 3 | 計算
$A={mat(A)}$。求 $A^{{-1}}$（9 個元素，一列一列、逗號隔開）。
== {','.join(fr(x) for r in inv for x in r)}
---
$\\det A={D}$，所以 $A^{{-1}}=\\frac{{1}}{{{D}}}\\mathrm{{adj}}(A)$，元素都是整數。$\\mathrm{{adj}}(A)$ 是餘因子矩陣的轉置，得 $A^{{-1}}={mat(inv)}$。驗算 $AA^{{-1}}=I$。也可以對 $[A\\,|\\,I]$ 做 Gauss–Jordan 消去。
""")
    cnt+=1
if want('dary'):
  cnt=0; seen=set()
  while cnt<n:
    d=random.choice([3,4,5]); i=random.randint(5,40); N=random.randint(50,500)
    if (d,i) in seen: continue
    seen.add((d,i))
    par=(i-1)//d; c1=d*i+1; c2=d*i+d
    h=0; cap=1; tot=1
    while tot<N: cap*=d; tot+=cap; h+=1
    out.append(f"""@q hp2-? | ds-heap#2 | 2 | 計算
{d} 元堆積（每個節點最多 {d} 個孩子）用陣列存，從第 0 格開始、一層一層由左到右放。第 {i} 格的父節點在第幾格？它的孩子在第幾格到第幾格？存 {N} 個元素時樹高（根的高度，只有根時為 0）是多少？
== {par},{c1},{c2},{h}
?? 父,第一個孩子,最後一個孩子,樹高
---
父節點 $\\lfloor(i-1)/{d}\\rfloor={par}$；孩子 ${d}i+1={c1}$ 到 ${d}i+{d}={c2}$。高度 $h$ 的滿 {d} 元樹最多 $1+{d}+\\cdots+{d}^h$ 個節點，要放下 {N} 個需要 $h={h}$。$d$ 越大樹越矮：插入（往上浮）變快、刪除最小值（每層要比 $d$ 個孩子）變慢——Dijkstra 在稠密圖上常用較大的 $d$。
""")
    cnt+=1
if want('pot'):
  cnt=0; seen=set()
  while cnt<n:
    s=random.choice([4,8,16,32,64]); mode=random.choice(['full','notfull'])
    if (s,mode) in seen: continue
    seen.add((s,mode))
    if mode=='full':
        num=s; act=s+1; phi0=2*num-s; phi1=2*(num+1)-2*s; amort=act+phi1-phi0
        desc=f'表大小 {s}、已經放了 {s} 個（滿了）。再插入一個：先開大小 {2*s} 的新表、搬 {s} 個，再放新的'
    else:
        num=random.randint(s//2+1,s-1); act=1; phi0=2*num-s; phi1=2*(num+1)-s; amort=act+phi1-phi0
        desc=f'表大小 {s}、已經放了 {num} 個（還沒滿）。再插入一個'
    out.append(f"""@q bam4-? | ds-amortized#4 | 3 | 計算
會自動加倍的陣列表（滿了就開兩倍大、全部搬過去），用位能 $\\Phi=2\\cdot\\text{{num}}-\\text{{size}}$。{desc}。這次的實際成本、位能變化 $\\Delta\\Phi$、攤銷成本各是多少？（實際成本：每放一個或搬一個算 1）
== {act},{phi1-phi0},{amort}
?? 實際,ΔΦ,攤銷
---
插入前 $\\Phi=2\\times{num}-{s}={phi0}$；插入後 num＝{num+1}、size＝{2*s if mode=='full' else s}，$\\Phi={phi1}$，$\\Delta\\Phi={phi1-phi0}$。攤銷＝實際＋$\\Delta\\Phi$＝{act}{'+' if phi1-phi0>=0 else ''}{phi1-phi0}＝{amort}。不管有沒有擴表，攤銷成本都是 3：平常每次存下 2 單位位能，擴表時一次用掉。
""")
    cnt+=1
print(''.join(out))

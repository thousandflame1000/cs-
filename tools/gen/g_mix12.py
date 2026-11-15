import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('wb'):
  cnt=0
  while cnt<n:
    L=random.randint(9,11)
    ops=[(random.choice('RRWW W'.replace(' ','')),random.randint(0,11)) for _ in range(L)]
    # policy A: write-through, no-write-allocate
    cA={}; wA=0; hA=0
    for o,a in ops:
        idx=a%4
        if o=='R':
            if cA.get(idx)==a: hA+=1
            else: cA[idx]=a
        else:
            wA+=1
            if cA.get(idx)==a: hA+=1
    # policy B: write-back, write-allocate
    cB={}; dB={}; wB=0; hB=0; ev=[]
    for o,a in ops:
        idx=a%4
        if cB.get(idx)==a: hB+=1
        else:
            if idx in cB and dB.get(idx): wB+=1; ev.append(cB[idx])
            cB[idx]=a; dB[idx]=False
        if o=='W': dB[idx]=True
    left=[cB[i] for i in cB if dB.get(i)]
    if wB==0 or wB==wA: continue
    seq='、'.join(f'{o}{a}' for o,a in ops)
    out.append(f"""@q ca2-? | co-cache#2 | 3 | 追蹤
direct-mapped cache 有 4 個區塊，每個區塊 1 個字，字位址 $a$ 放在第 $a\\bmod4$ 格，一開始是空的。存取序列（R＝讀、W＝寫，數字是字位址）：{seq}。(甲) write-through＋no-write-allocate；(乙) write-back＋write-allocate。過程中各寫了記憶體幾次？（乙不算最後還留在 cache 裡的髒區塊）
== {wA},{wB}
?? 甲,乙
---
甲：每一次 W 都直接寫進記憶體，共 {wA} 次（寫入 miss 時不把區塊搬進 cache）。乙：寫入只改 cache 並標成髒的，只有髒區塊被換出時才寫回；被換出的髒區塊依序是 {'、'.join(map(str,ev))}，共 {wB} 次{('；結束時還有 '+'、'.join(map(str,left))+' 是髒的，之後換出才會寫') if left else ''}。同一個位址連續寫很多次時，乙的優勢最明顯。
""")
    cnt+=1
if want('cfs'):
  cnt=0
  while cnt<n:
    W=dict(zip('ABC',random.sample([512,1024,2048,4096],3)))
    v={k:random.choice([0,5,10,15,20]) for k in 'ABC'}
    v0=dict(v); order=[]
    for _ in range(8):
        k=min('ABC',key=lambda x:(v[x],x)); order.append(k); v[k]+=F(10*1024,W[k])
    if len(set(order))<3: continue
    inc='、'.join(f'{k} 每次加 {fr(F(10*1024,W[k]))}' for k in 'ABC')
    out.append(f"""@q sc4-? | os-sched#4 | 3 | 追蹤
CFS 的簡化模型：每次挑 vruntime 最小的行程跑 10 ms（一樣小時照字母順序），跑完它的 vruntime 增加 $10\\times1024$ 除以權重。A、B、C 的權重 {W['A']}、{W['B']}、{W['C']}，一開始 vruntime 是 {v0['A']}、{v0['B']}、{v0['C']}。前 8 個時間片依序給誰？
== {''.join(order)}
---
增量：{inc}。照「每次挑最小」模擬：{' '.join(order)}；最後 vruntime 是 A {fr(v['A'])}、B {fr(v['B'])}、C {fr(v['C'])}。權重越大，vruntime 長得越慢，所以分到越多時間片；長期下來各行程拿到的 CPU 時間和權重成正比。
""")
    cnt+=1
def rank(M):
    M=[[F(x) for x in r] for r in M]; r=0; rows=len(M); cols=len(M[0])
    for c in range(cols):
        p=next((i for i in range(r,rows) if M[i][c]!=0),None)
        if p is None: continue
        M[r],M[p]=M[p],M[r]
        for i in range(rows):
            if i!=r and M[i][c]!=0:
                f=M[i][c]/M[r][c]; M[i]=[a-f*b for a,b in zip(M[i],M[r])]
        r+=1
    return r
if want('sub4'):
  cnt=0
  while cnt<n:
    m=random.choice([3,4]); nn=random.choice([3,4,5]); r=random.randint(1,min(m,nn)-1)
    Bm=[[random.randint(-2,2) for _ in range(r)] for _ in range(m)]; Cm=[[random.randint(-2,2) for _ in range(nn)] for _ in range(r)]
    A=[[sum(Bm[i][k]*Cm[k][j] for k in range(r)) for j in range(nn)] for i in range(m)]
    if any(all(x==0 for x in row) for row in A): continue
    if max(abs(x) for row in A for x in row)>9: continue
    rr=rank(A)
    if rr!=r: continue
    mat='\\left[\\begin{smallmatrix}'+'\\\\'.join('&'.join(map(str,row)) for row in A)+'\\end{smallmatrix}\\right]'
    out.append(f"""@q ls4-? | la-systems#4 | 2 | 計算
$A={mat}$（${m}\\times{nn}$）。$C(A)$、$N(A)$、$C(A^T)$、$N(A^T)$ 的維度各是？
== {rr},{nn-rr},{rr},{m-rr}
?? C(A),N(A),C(A^T),N(A^T)
---
列運算化簡後只剩 {rr} 個非零列，秩 $r={rr}$。行空間和列空間的維度都是 $r={rr}$；$N(A)\\subseteq\\mathbb R^{{{nn}}}$ 的維度 $n-r={nn-rr}$；$N(A^T)\\subseteq\\mathbb R^{{{m}}}$ 的維度 $m-r={m-rr}$。檢查：${rr}+{nn-rr}={nn}$、${rr}+{m-rr}={m}$。
""")
    cnt+=1
if want('bpr'):
  cnt=0
  while cnt<n:
    keys=sorted(random.sample(range(1,100),random.randint(16,22)))
    leaves=[]; i=0
    while i<len(keys):
        s=random.choice([2,3,3]); leaves.append(keys[i:i+s]); i+=s
    if len(leaves)<6 or len(leaves[-1])<2: continue
    a=random.choice(keys); b=random.choice(keys)
    if b<=a: continue
    first=next(i for i,l in enumerate(leaves) if l[-1]>=a)
    j=first; read=0; got=[]
    while j<len(leaves):
        read+=1; stop=False
        for k in leaves[j]:
            if k>b: stop=True; break
            if k>=a: got.append(k)
        if stop: break
        j+=1
    if read<2: continue
    h=3
    ls='｜'.join(' '.join(map(str,l)) for l in leaves)
    out.append(f"""@q bt3-? | ds-btree#3 | 2 | 計算
一棵 3 層的 B+ 樹（根、一層內部節點、葉子），葉子由左到右串起來，內容依序是：{ls}。查詢 ${a}\\le\\text{{key}}\\le{b}$：先從根走到第一個可能含 {a} 的葉子，再沿葉子往右讀，直到讀到某個大於 {b} 的 key 或串列結束為止。總共讀了幾個節點？找到幾筆？
== {2+read},{len(got)}
?? 節點數,筆數
---
從根往下經過 2 個節點（根、內部節點）到達含 {a} 的葉子，接著讀了 {read} 個葉子{'（最後一個葉子裡看到大於 '+str(b)+' 的 key 才停）' if stop else '（讀到最後一個葉子）'}，共 ${2}+{read}={2+read}$ 個節點；符合的 key：{'、'.join(map(str,got))}，共 {len(got)} 筆。範圍查詢只需找一次起點，之後沿葉子串列走，不用回到上層——這就是 B+ 樹把資料全放葉子並串起來的原因。
""")
    cnt+=1
print(''.join(out))

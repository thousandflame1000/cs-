import random, sys, math, itertools
from fractions import Fraction
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
# infix -> postfix + eval
if want('pf'):
  cnt=0
  while cnt<n:
    # random expression tree with ops + - * and small ints
    def gen(d):
        if d==0 or random.random()<0.3: return str(random.randint(1,9))
        op=random.choice('+-*'); return (op,gen(d-1),gen(d-1))
    e=gen(3)
    if isinstance(e,str): continue
    prec={'+':1,'-':1,'*':2}
    def infix(t,parent=None,right=False):
        if isinstance(t,str): return t
        op,a,b=t; s=infix(a,op,False)+' '+op+' '+infix(b,op,True)
        if parent and (prec[op]<prec[parent] or (prec[op]==prec[parent] and right)): s='( '+s+' )'
        return s
    def post(t): return t if isinstance(t,str) else post(t[1])+' '+post(t[2])+' '+t[0]
    def ev(t): return int(t) if isinstance(t,str) else eval(f'{ev(t[1])}{t[0]}{ev(t[2])}')
    s=infix(e); p=post(e); v=ev(e)
    if s.count(' ')<8 or '(' not in s: continue
    out.append(f"""@q bam2-? | ds-amortized#2 | 3 | 追蹤
中序式 `{s}` 轉成後序式是什麼？再用堆疊求值，結果是多少？
== {p},{v}
?? 後序式（空格隔開）,值
---
後序式：`{p}`。轉換時運算元直接輸出；運算子要先把堆疊裡優先權大於或等於它的運算子彈出（左結合），左括號直接進堆疊、右括號一路彈到左括號。求值：數字 push，遇到運算子 pop 兩個（先 pop 的是右運算元）算完再 push，最後剩下 {v}。
""")
    cnt+=1
# stack permutation
if want('sp'):
  cnt=0
  while cnt<n:
    N=5; perms=[]
    def feasible(p):
        st=[];nxt=1
        for x in p:
            while nxt<=x: st.append(nxt); nxt+=1
            if st and st[-1]==x: st.pop()
            else: return False
        return True
    allp=list(itertools.permutations(range(1,N+1)))
    good=[p for p in allp if feasible(p)]; bad=[p for p in allp if not feasible(p)]
    b=random.choice(bad); gs=random.sample(good,3)
    opts=[('x',b)]+[(' ',g) for g in gs]; random.shuffle(opts)
    # find a 312 pattern in b
    pat=None
    for i,j,k in itertools.combinations(range(N),3):
        if b[j]<b[k]<b[i]: pat=(b[i],b[j],b[k]); break
    out.append(f"""@q bam3-? | ds-amortized#3 | 2 | 反例
1～5 依序進堆疊（中間可以隨時 pop）。下列哪一個輸出順序**做不出來**？
{chr(10).join(f'[{m}] {" ".join(map(str,q))}' for m,q in opts)}
---
`{' '.join(map(str,b))}` 裡有 {pat[0]}、{pat[1]}、{pat[2]} 依序出現，是「大、小、中」的樣式：{pat[0]} 要出來時，比它小的 {pat[1]}、{pat[2]} 都已經在堆疊裡、{pat[2]} 壓在 {pat[1]} 上面，所以 {pat[1]} 不可能比 {pat[2]} 先出來。其他三個都可以邊 push 邊 pop 模擬出來。
""")
    cnt+=1
# Havel-Hakimi
if want('hh'):
  cnt=0
  while cnt<n:
    k=random.choice([6,7]); seq=sorted([random.randint(1,k-1) for _ in range(k)],reverse=True)
    if sum(seq)%2: continue
    s=seq[:]; ok=True; steps=[]
    while s and s[0]>0:
        d=s.pop(0)
        if d>len(s): ok=False; break
        for i in range(d): s[i]-=1
        if min(s)<0: ok=False; break
        s.sort(reverse=True); steps.append(' '.join(map(str,s)))
    out.append(f"""@q dg1-? | dm-graph#1 | 3 | 追蹤
度數序列 {', '.join(map(str,seq))}（{k} 個點）能不能是某個簡單圖的度數？這張圖有幾條邊？
[{'x' if ok else ' '}] 可以，有 {sum(seq)//2} 條邊
[{' ' if ok else 'x'}] 不行，雖然度數和是偶數
[ ] 不行，因為度數和是奇數
[ ] 可以，有 {sum(seq)} 條邊
---
度數和 {sum(seq)} 是偶數，邊數若存在就是 {sum(seq)//2}，但還要檢查能不能真的畫出簡單圖。Havel–Hakimi：拿掉最大的度數 $d$，把接下來最大的 $d$ 個各減 1，重新排序，重複：{' → '.join(steps) if steps else '（第一步就失敗）'}。{'最後全部變成 0，所以可以。' if ok else '途中出現負數或不夠扣，所以不行。'}
""")
    cnt+=1
# transitive closure size
if want('tc'):
  cnt=0
  while cnt<n:
    V=range(1,6); R=set()
    while len(R)<5:
        a,b=random.sample(list(V),2); R.add((a,b))
    reach={v:set() for v in V}
    for a,b in R: reach[a].add(b)
    changed=True
    while changed:
        changed=False
        for a in V:
            new=set(reach[a])
            for b in list(reach[a]): new|=reach[b]
            if new!=reach[a]: reach[a]=new; changed=True
    tot=sum(len(reach[v]) for v in V)
    if tot<=len(R)+1: continue
    rs=', '.join(f'({a},{b})' for a,b in sorted(R))
    out.append(f"""@q rl2-? | dm-relations#2 | 2 | 計算
$\\{{1,2,3,4,5\\}}$ 上 $R=\\{{{rs}\\}}$。$R$ 的遞移閉包共有幾對？
== {tot}
---
看每個點走一步以上能到哪：{'；'.join(f'{v}→'+('、'.join(map(str,sorted(reach[v]))) if reach[v] else '無') for v in V)}。共 {tot} 對（若有環，點也能走回自己，$(a,a)$ 也算）。
""")
    cnt+=1
# linear recurrence
if want('rec'):
  cnt=0
  while cnt<n:
    r1,r2=random.sample([-2,-1,2,3,4],2)
    c1=r1+r2; c2=-r1*r2
    a0=random.randint(0,3); a1=random.randint(1,5)
    seq=[a0,a1]
    for i in range(2,8): seq.append(c1*seq[-1]+c2*seq[-2])
    # coefficients
    A=Fraction(a1-r2*a0, r1-r2); B=Fraction(a0)-A
    if A.denominator!=1 or B.denominator!=1: continue
    sgn=lambda x: f'+{x}' if x>=0 else f'{x}'
    out.append(f"""@q rg2-? | dm-recur-gf#2 | 2 | 計算
$a_n={c1}a_{{n-1}}{sgn(c2)}a_{{n-2}}$，$a_0={a0}$、$a_1={a1}$。$a_6$ 是多少？
== {seq[6]}
---
特徵方程式 $r^2-({c1})r-({c2})=0$ 的根是 {r1}、{r2}，一般式 $a_n=A({r1})^n+B({r2})^n$。由初值解出 $A={A}$、$B={B}$。$a_6={A}\\cdot({r1})^6+({B})\\cdot({r2})^6={seq[6]}$。直接遞推也行：{', '.join(map(str,seq[:7]))}。
""")
    cnt+=1
# Stirling / surjections
if want('st'):
  cnt=0
  while cnt<n:
    N=random.choice([5,6]); k=random.choice([2,3,4])
    if k>=N: continue
    S=[[0]*(k+1) for _ in range(N+1)]; S[0][0]=1
    for i in range(1,N+1):
        for j in range(1,k+1): S[i][j]=j*S[i-1][j]+S[i-1][j-1]
    s=S[N][k]; sur=math.factorial(k)*s
    out.append(f"""@q cn4-? | dm-counting#4 | 3 | 計算
{N} 個不同的工作分給 {k} 位**不同**的人，每人至少一個，有幾種分法？如果 {k} 個人看成**一樣**（只在乎怎麼分組），有幾種？
== {sur},{s}
?? 人不同,人一樣
---
人一樣時是第二類 Stirling 數 $S({N},{k})$，可用 $S(n,k)=kS(n-1,k)+S(n-1,k-1)$ 遞推得 {s}。人不同時再把 {k} 組分給 {k} 個人，乘 ${k}!$：{sur}。也可以用排容：$\\sum_{{i=0}}^{{{k}}}(-1)^i\\binom{{{k}}}{{i}}({k}-i)^{{{N}}}={sur}$。
""")
    cnt+=1
# rank
if want('rk'):
  cnt=0
  while cnt<n:
    r=random.choice([1,2,2,3])
    B=[[random.randint(-2,2) for _ in range(4)] for _ in range(r)]
    C=[[random.randint(-2,2) for _ in range(r)] for _ in range(3)]
    M=[[sum(C[i][k]*B[k][j] for k in range(r)) for j in range(4)] for i in range(3)]
    import fractions
    # compute rank exactly
    A=[[Fraction(x) for x in row] for row in M]; rk=0; col=0
    rows=len(A)
    for c in range(4):
        piv=next((i for i in range(rk,rows) if A[i][c]!=0),None)
        if piv is None: continue
        A[rk],A[piv]=A[piv],A[rk]
        for i in range(rows):
            if i!=rk and A[i][c]!=0:
                f=A[i][c]/A[rk][c]; A[i]=[a-f*b for a,b in zip(A[i],A[rk])]
        rk+=1
    if rk!=r or any(all(x==0 for x in row) for row in M): continue
    mat='\\\\'.join('&'.join(map(str,row)) for row in M)
    out.append(f"""@q ls5-? | la-systems#5 | 2 | 計算
$A=\\left[\\begin{{smallmatrix}}{mat}\\end{{smallmatrix}}\\right]$ 的秩是多少？$N(A)$ 的維度是多少？
== {rk},{4-rk}
?? 秩,零空間維度
---
做列運算化成梯形，非零列（樞軸）有 {rk} 個，所以秩 {rk}。$A$ 有 4 行，由秩－零度定理 $\\dim N(A)=4-{rk}={4-rk}$。{'這三列其實都是同一列的倍數。' if rk==1 else ('有一列是其他兩列的線性組合。' if rk==2 else '三列線性獨立。')}
""")
    cnt+=1
print('\n'.join(out))

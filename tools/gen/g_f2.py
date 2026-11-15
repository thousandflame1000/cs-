import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
if want('arr'):
  cnt=0
  while cnt<n:
    R=random.randint(3,6); C=random.randint(4,8); B=random.choice([1000,2000,4096,5000,8000])
    i=random.randint(1,R-1); j=random.randint(1,C-1)
    ans=B+4*(i*C+j)
    out.append(f"""@q fa-? | f-c-array | 2 | 計算
`int a[{R}][{C}];`（每個 `int` 佔 4 bytes）從位址 {B} 開始，一列接著一列連續存放。`&a[{i}][{j}]` 是多少（十進位）？
== {ans}
---
`a[{i}][{j}]` 前面有 {i} 整列（每列 {C} 個）再加 {j} 個，共 ${i}\\times{C}+{j}={i*C+j}$ 個元素。位址＝${B}+4\\times{i*C+j}={ans}$。C 的二維陣列就是「一列一列接起來」的一維陣列，所以第二個維度的大小 {C} 一定要知道。
""")
    cnt+=1
if want('ptr'):
  cnt=0
  while cnt<n:
    a=random.sample(range(1,60),6); i=random.randint(1,2); j=random.randint(1,3-0)
    if i+j+1>5: continue
    k=i+j
    v1=a[k+1]-a[k]
    out.append(f"""@q fp-? | f-c-pointer | 2 | 追蹤
```
int a[] = {{{', '.join(map(str,a))}}};
int *p = a + {i};
p += {j};
int x = *(p + 1) - *p;
```
`x` 是多少？
== {v1}
---
`p` 先指向 `a[{i}]`，加 {j} 後指向 `a[{k}]`（指標加 1 是往後一個 `int`，不是一個 byte）。`*(p + 1)` 是 `a[{k+1}]`＝{a[k+1]}，`*p` 是 `a[{k}]`＝{a[k]}，相減得 {v1}。
""")
    cnt+=1
if want('gate'):
  cnt=0
  ops=[('AND',lambda x,y:x&y),('OR',lambda x,y:x|y),('XOR',lambda x,y:x^y)]
  seen=set()
  while cnt<n:
    o1,f1=random.choice(ops); o2,f2=random.choice(ops); o3,f3=random.choice(ops)
    na=random.choice([True,False]); nc=random.choice([True,False])
    key=(o1,o2,o3,na,nc)
    if key in seen or len({o1,o2,o3})<2: continue
    seen.add(key)
    sa='NOT A' if na else 'A'; sc='NOT C' if nc else 'C'
    expr=f'({sa} {o1} B) {o2} (B {o3} {sc})'
    rows=[]
    for A,Bv,Cv in itertools.product([0,1],repeat=3):
        a_=1-A if na else A; c_=1-Cv if nc else Cv
        y=f2(f1(a_,Bv),f3(Bv,c_)); rows.append((A,Bv,Cv,y))
    c1=sum(r[3] for r in rows)
    if c1 in (0,8): continue
    ones='、'.join(f'{r[0]}{r[1]}{r[2]}' for r in rows if r[3])
    out.append(f"""@q fg-? | f-gate | 3 | 計算
輸出 `Y = {expr}`。A、B、C 各為 0 或 1，共 8 種情形，其中有幾種讓 $Y=1$？
== {c1}
---
逐一代入（依 ABC 寫）：讓 $Y=1$ 的是 {ones}，共 {c1} 種。做法：先把 B 分成 0 和 1 兩種情形，每個括號都只剩一個變數，比較不容易算錯。
""")
    cnt+=1
if want('set'):
  cnt=0
  while cnt<n:
    U=list(range(1,16))
    A=sorted(random.sample(U,random.randint(5,7))); Bs=sorted(random.sample(U,random.randint(5,7)))
    I=sorted(set(A)&set(Bs)); Un=sorted(set(A)|set(Bs)); D=sorted(set(A)-set(Bs))
    if len(I)<2: continue
    st=lambda s:'\\{'+','.join(map(str,s))+'\\}'
    out.append(f"""@q fe-? | f-set | 2 | 計算
$A={st(A)}$、$B={st(Bs)}$。$A\\cup B$、$A\\cap B$、$A-B$ 各有幾個元素？
== {len(Un)},{len(I)},{len(D)}
?? A∪B,A∩B,A−B
---
共同的元素 $A\\cap B={st(I)}$，{len(I)} 個。$|A\\cup B|=|A|+|B|-|A\\cap B|={len(A)}+{len(Bs)}-{len(I)}={len(Un)}$（共同的會被數兩次，要扣掉一次）。$A-B={st(D)}$，$|A-B|=|A|-|A\\cap B|={len(D)}$。
""")
    cnt+=1
if want('func'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.choice([2,3]); k=random.choice([2,3,4,5]) if a==2 else random.choice([3,4,5,6])
    if (a,k) in seen: continue
    seen.add((a,k))
    N=1
    for m in range(1,500):
        if not a**m>m**k: N=m+1
    if N<4: continue
    out.append(f"""@q ff-? | f-func | 3 | 計算
找最小的正整數 $N$，使得**所有** $n\\ge N$ 都有 ${a}^n>n^{{{k}}}$。$N$ 是多少？
== {N}
---
${a}^{{{N-1}}}={a**(N-1)}\\le{N-1}^{{{k}}}={(N-1)**k}$，但 ${a}^{{{N}}}={a**N}>{N}^{{{k}}}={N**k}$，之後指數函數每次乘 {a}，多項式每次只乘 $(1+1/n)^{{{k}}}$（越來越接近 1），差距只會越拉越大。注意不能只找「第一個」成立的 $n$：前面小的 $n$ 可能先成立、後來又不成立。
""")
    cnt+=1
if want('bs'):
  cnt=0
  while cnt<n:
    L=random.randint(9,15); a=sorted(random.sample(range(1,100),L))
    if random.random()<0.6: t=random.choice(a)
    else:
        t=random.randint(1,99)
        if t in a: continue
    lo,hi=0,L-1; seq=[]; found=-1
    while lo<=hi:
        m=(lo+hi)//2; seq.append(a[m])
        if a[m]==t: found=m; break
        if a[m]<t: lo=m+1
        else: hi=m-1
    if len(seq)<3: continue
    res=f'找到，在第 {found} 格' if found>=0 else '找不到'
    out.append(f"""@q fq-? | f-bsearch | 2 | 追蹤
`a = {{{', '.join(map(str,a))}}}`（第 0～{L-1} 格），標準二分搜尋（`mid = (lo + hi) / 2`，`while (lo <= hi)`）找 {t}。依序和哪些元素比較過？
== {','.join(map(str,seq))}
---
{'；'.join(f'第 {x+1} 次看 {v}' for x,v in enumerate(seq))}。{res}。每次比較都把範圍砍掉一半（含 mid 本身），{L} 筆資料最多比較 $\\lfloor\\lg {L}\\rfloor+1={L.bit_length()}$ 次。
""")
    cnt+=1
if want('sq'):
  cnt=0
  while cnt<n:
    ops=[]; s=[]; q=[]; outs=[]; outq=[]; x=1
    for _ in range(9):
        if (s and random.random()<0.4):
            ops.append('拿出'); outs.append(s.pop()); outq.append(q.pop(0))
        else:
            ops.append(f'放入 {x}'); s.append(x); q.append(x); x+=1
    if len(outs)<3: continue
    out.append(f"""@q fi-? | f-list | 2 | 追蹤
同一串操作：{'、'.join(ops)}。分別用堆疊和佇列來做，拿出來的數字順序各是什麼？
== {' '.join(map(str,outs))},{' '.join(map(str,outq))}
?? 堆疊（空格隔開）,佇列（空格隔開）
---
堆疊每次拿最後放入的（後進先出）：{' '.join(map(str,outs))}，最後剩 {(' '.join(map(str,s))+'（底到頂）') if s else '空的'}。佇列每次拿最早放入的（先進先出）：{' '.join(map(str,outq))}，最後剩 {(' '.join(map(str,q))+'（前到後）') if q else '空的'}。
""")
    cnt+=1
if want('rec'):
  cnt=0; seen=set()
  while cnt<n:
    k=random.choice([2,3,4,5]); x=random.randint(60,500)
    if (k,x) in seen: continue
    seen.add((k,x))
    def g(v,steps):
        if v<k: steps.append(f'g({v})={v}'); return v
        r=g(v//k,steps)+v%k; steps.append(f'g({v})=g({v//k})+{v%k}={r}'); return r
    st=[]; ans=g(x,st)
    out.append(f"""@q fr-? | f-recursion | 2 | 追蹤
`int g(int n) {{ if (n < {k}) return n; return g(n / {k}) + n % {k}; }}`，`g({x})` 是多少？
== {ans}
---
{'；'.join(st)}。這個函式其實是把 n 寫成 {k} 進位後，各位數字的和：每層用 `n % {k}` 拿到最後一位，`n / {k}` 去掉最後一位。
""")
    cnt+=1
if want('vec'):
  cnt=0
  while cnt<n:
    A=[[random.randint(-3,4) for _ in range(3)] for _ in range(3)]; v=[random.randint(-2,3) for _ in range(3)]
    r=[sum(A[i][j]*v[j] for j in range(3)) for i in range(3)]
    if 0 in v: continue
    mat='\\left[\\begin{smallmatrix}'+'\\\\'.join('&'.join(map(str,row)) for row in A)+'\\end{smallmatrix}\\right]'
    exp='；'.join(f'第 {i+1} 列：'+'+'.join(f'({A[i][j]})({v[j]})' for j in range(3))+f'$={r[i]}$' for i in range(3)).replace('第','$第').replace('：','$：$',3)
    exp='；'.join(f'第 {i+1} 列 $'+'+'.join(f'({A[i][j]})({v[j]})' for j in range(3))+f'={r[i]}$' for i in range(3))
    out.append(f"""@q fv-? | f-vec | 2 | 計算
${mat}\\left[\\begin{{smallmatrix}}{v[0]}\\\\{v[1]}\\\\{v[2]}\\end{{smallmatrix}}\\right]$ 等於？（由上到下，逗號隔開）
== {','.join(map(str,r))}
---
每個分量是「矩陣那一列」和向量的內積：{exp}。也可以看成 ${v[0]}\\times$第 1 行 $+{v[1]}\\times$第 2 行 $+{v[2]}\\times$第 3 行。
""".replace('+-','-').replace('+(-','+(-'))
    cnt+=1
if want('urn'):
  cnt=0; seen=set()
  while cnt<n:
    r=random.randint(2,6); b=random.randint(2,6)
    if (r,b) in seen: continue
    seen.add((r,b)); N=r+b
    p=F(r*(r-1)+b*(b-1),N*(N-1))
    pf=BS+'frac{'+str(p.numerator)+'}{'+str(p.denominator)+'}'
    out.append(f"""@q fx-? | f-prob | 3 | 計算
袋中有 {r} 顆紅球、{b} 顆藍球。**不放回**地隨機抽兩顆，兩顆同色的機率是多少？（最簡分數）
== {fr(p)}
---
兩紅：$\\frac{{{r}}}{{{N}}}\\times\\frac{{{r-1}}}{{{N-1}}}$；兩藍：$\\frac{{{b}}}{{{N}}}\\times\\frac{{{b-1}}}{{{N-1}}}$。相加 $\\frac{{{r*(r-1)}+{b*(b-1)}}}{{{N*(N-1)}}}={pf}$。不放回時第二顆的機率要用「剩下的球」算；若放回，答案會變成 $\\frac{{{r*r}+{b*b}}}{{{N*N}}}$。
""")
    cnt+=1
print(''.join(out))

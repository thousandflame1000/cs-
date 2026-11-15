import random, sys, math, itertools
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
out=[]
# CRT
cnt=0
while cnt<n:
    m1,m2=random.sample([3,4,5,7,8,9,11,13],2)
    if math.gcd(m1,m2)!=1 or m1*m2>120: continue
    a=random.randrange(m1); b=random.randrange(m2)
    x=next(x for x in range(1,m1*m2+1) if x%m1==a and x%m2==b)
    out.append(f"""@q nt2-? | dm-nt-algebra#2 | 2 | 計算
求最小的正整數 $x$，使 $x\\equiv{a}\\pmod{{{m1}}}$ 且 $x\\equiv{b}\\pmod{{{m2}}}$。
== {x}
---
${m1}$ 和 ${m2}$ 互質，由中國剩餘定理，在 $1$ 到 ${m1*m2}$ 之間恰有一個解。可以列出 $x\\equiv{a}\\pmod{{{m1}}}$ 的數 {', '.join(str(a+m1*k if a+m1*k>0 else a+m1*(k+1)) for k in range(0,4))}…，找第一個除以 {m2} 餘 {b} 的：{x}。驗算：${x}={x//m1}\\times{m1}+{x%m1}$、${x}={x//m2}\\times{m2}+{x%m2}$。
""")
    cnt+=1
# inclusion-exclusion
cnt=0
while cnt<n:
    N=random.choice([100,120,150,200,300]); a,b,c=sorted(random.sample([2,3,5,7],3))
    cntv=sum(1 for x in range(1,N+1) if x%a==0 or x%b==0 or x%c==0)
    def f(d): return N//d
    out.append(f"""@q cn3-? | dm-counting#3 | 2 | 計算
1 到 {N} 之中，是 {a}、{b} 或 {c} 的倍數（至少一個）的整數有幾個？
== {cntv}
---
排容：$\\lfloor\\frac{{{N}}}{{{a}}}\\rfloor+\\lfloor\\frac{{{N}}}{{{b}}}\\rfloor+\\lfloor\\frac{{{N}}}{{{c}}}\\rfloor-\\lfloor\\frac{{{N}}}{{{a*b}}}\\rfloor-\\lfloor\\frac{{{N}}}{{{a*c}}}\\rfloor-\\lfloor\\frac{{{N}}}{{{b*c}}}\\rfloor+\\lfloor\\frac{{{N}}}{{{a*b*c}}}\\rfloor={f(a)}+{f(b)}+{f(c)}-{f(a*b)}-{f(a*c)}-{f(b*c)}+{f(a*b*c)}={cntv}$。三個數兩兩互質，所以「同時是 {a}、{b} 的倍數」就是 {a*b} 的倍數。
""")
    cnt+=1
# stars and bars with lower bounds
cnt=0
while cnt<n:
    k=random.choice([3,4]); lows=[random.randint(0,3) for _ in range(k)]; N=random.randint(sum(lows)+4,sum(lows)+9)
    r=N-sum(lows); ans=math.comb(r+k-1,k-1)
    xs=' + '.join(f'x_{i+1}' for i in range(k))
    cons='、'.join(f'$x_{i+1}\\ge{l}$' for i,l in enumerate(lows))
    out.append(f"""@q cn1-? | dm-counting#1 | 2 | 計算
${xs}={N}$，{cons}，有幾組整數解？
== {ans}
---
令 $y_i=x_i-(\\text{{下限}})$，變成 $y_1+\\cdots+y_{k}={N}-{sum(lows)}={r}$、$y_i\\ge0$。星與槓：{r} 顆星、{k-1} 根槓，$\\binom{{{r+k-1}}}{{{k-1}}}={ans}$。
""")
    cnt+=1
# det 3x3
def P(x): return str(x) if x>=0 else f'({x})'
cnt=0
while cnt<n:
    M=[[random.randint(-3,4) for _ in range(3)] for _ in range(3)]
    a,b,c=M[0]; d,e,f_=M[1]; g,h,i=M[2]
    m1=e*i-f_*h; m2=d*i-f_*g; m3=d*h-e*g
    det=a*m1-b*m2+c*m3
    if det==0 or abs(det)>60: continue
    mat='\\\\'.join('&'.join(map(str,r)) for r in M)
    out.append(f"""@q dt2-? | la-det#2 | 2 | 計算
$\\det\\left[\\begin{{smallmatrix}}{mat}\\end{{smallmatrix}}\\right]$ 是多少？
== {det}
---
沿第一列展開：${P(a)}\\cdot{P(m1)}-{P(b)}\\cdot{P(m2)}+{P(c)}\\cdot{P(m3)}={det}$，其中三個 $2\\times2$ 子行列式是 ${P(e)}\\cdot{P(i)}-{P(f_)}\\cdot{P(h)}={m1}$、${P(d)}\\cdot{P(i)}-{P(f_)}\\cdot{P(g)}={m2}$、${P(d)}\\cdot{P(h)}-{P(e)}\\cdot{P(g)}={m3}$。中間那一項要記得帶負號。
""")
    cnt+=1
# address translation
cnt=0
while cnt<n:
    ps=random.choice([1024,2048,4096]); pages=random.sample(range(0,16),4)
    frames=random.sample(range(0,32),4); pt=dict(zip(range(4),frames))
    p=random.randrange(4); off=random.randrange(ps); la=p*ps+off; pa=pt[p]*ps+off
    tab='、'.join(f'頁 {k}→frame {v}' for k,v in pt.items())
    out.append(f"""@q me3-? | os-memory#3 | {3 if ps==4096 else 2} | 計算
頁大小 {ps} bytes。頁表：{tab}。邏輯位址 {la}（十進位）轉換成實體位址是多少？
== {pa}
---
頁號＝$\\lfloor{la}/{ps}\\rfloor={p}$，位移＝${la}-{p}\\times{ps}={off}$。頁 {p} 在 frame {pt[p]}，實體位址＝${pt[p]}\\times{ps}+{off}={pa}$。頁大小是 2 的次方，所以硬體只要把位址的高位換掉，位移那幾位原封不動。
""")
    cnt+=1
# cache address split
cnt=0
while cnt<n:
    C=random.choice([16,32,64,128,256]); B=random.choice([16,32,64]); W=random.choice([1,2,4,8])
    sets=C*1024//(B*W)
    if sets<16: continue
    off=int(math.log2(B)); idx=int(math.log2(sets)); tag=32-off-idx
    kind='直接映射' if W==1 else f'{W}-way 組關聯'
    out.append(f"""@q ca1-? | co-cache#1 | {3 if W>=4 else 2} | 計算
32 位元位址、{C} KB 的 {kind} cache、區塊 {B} bytes。tag、index、offset 各幾個位元？
== {tag},{idx},{off}
?? tag,index,offset
---
offset：$\\lg{B}={off}$。組數＝${C}\\text{{ KB}}\\div({B}\\times{W})={sets}$，index＝$\\lg{sets}={idx}$。tag＝$32-{idx}-{off}={tag}$。關聯度每加倍，組數減半，index 少 1 位、tag 多 1 位。
""")
    cnt+=1
print('\n'.join(out))

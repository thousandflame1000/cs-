import random, sys, math, itertools, struct
from fractions import Fraction
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
# RM schedulability simulation
if want('rm'):
  cnt=0
  while cnt<n:
    k=random.choice([2,3]); tasks=sorted([(random.choice([4,5,6,8,10,12]),0) for _ in range(k)])
    tasks=[(T,random.randint(1,max(1,T//2))) for T,_ in tasks]
    if len(set(T for T,_ in tasks))<k: continue
    U=sum(Fraction(C,T) for T,C in tasks)
    if U>1: continue
    H=math.lcm(*[T for T,_ in tasks])
    rem=[0]*k; ok=True
    for t in range(H):
        for i,(T,C) in enumerate(tasks):
            if t%T==0:
                if rem[i]>0: ok=False
                rem[i]=C
        run=[i for i in range(k) if rem[i]>0]
        if run: rem[min(run,key=lambda i:tasks[i][0])]-=1
    if any(rem): ok=False
    bound=k*(2**(1/k)-1)
    if (float(U)<=bound): continue  # want interesting: U above bound
    ts='、'.join(f'(週期 {T}, 執行 {C})' for T,C in tasks)
    concl='每個工作都在期限內完成，所以能。' if ok else '有工作在期限到時還沒做完，所以不能（EDF 在 $U\\le1$ 時一定排得完）。'
    xo='x' if ok else ' '; xn=' ' if ok else 'x'
    ans='能' if ok else '不能'
    out.append(f"""@q sc3-? | os-sched#3 | 3 | 追蹤
週期性工作 {ts}，時間 0 同時釋放，期限等於週期。總使用率是多少？用 rate-monotonic 能不能讓每個工作都在期限內完成？
[{xo}] $U={U.numerator}/{U.denominator}\\approx{float(U):.3f}$，超過 RM 的保證上限 {bound:.3f}，但模擬一個超週期（{H}）後發現排得完
[{xn}] $U={U.numerator}/{U.denominator}\\approx{float(U):.3f}$，超過 RM 的保證上限 {bound:.3f}，模擬後發現有工作錯過期限
[ ] $U>1$，任何排法都不行
[ ] $U$ 低於保證上限，一定排得完
---
$U=\\sum C_i/T_i={'+'.join(f'{C}/{T}' for T,C in tasks)}\\approx{float(U):.3f}$。$n={k}$ 時 RM 的充分條件是 $U\\le{k}(2^{{1/{k}}}-1)\\approx{bound:.3f}$，這裡超過了，不能直接下結論，要模擬到超週期 {H}（所有週期的最小公倍數）：週期短的優先。結果{concl}
""")
    cnt+=1
# fits
if want('fit'):
  cnt=0
  while cnt<n:
    holes=random.sample(range(100,700,10),5); reqs=random.sample(range(80,500,10),4)
    def run(mode):
        h=holes[:]; placed=[]
        for r in reqs:
            c=[i for i in range(5) if h[i]>=r]
            if not c: placed.append(None); continue
            i=c[0] if mode=='f' else (min(c,key=lambda i:h[i]) if mode=='b' else max(c,key=lambda i:h[i]))
            h[i]-=r; placed.append(i)
        return placed
    rs={m:run(m) for m in 'fbw'}
    cnts={m:sum(p is not None for p in rs[m]) for m in 'fbw'}
    if len(set(cnts.values()))<2: continue
    def desc(m): return '、'.join(f'{r}→{"放不下" if p is None else "第"+str(p+1)+"個空洞"}' for r,p in zip(reqs,rs[m]))
    out.append(f"""@q me2-? | os-memory#2 | 3 | 追蹤
記憶體空洞依序 {'、'.join(map(str,holes))}（KB），依序來了 {'、'.join(map(str,reqs))} KB 的請求。first-fit、best-fit、worst-fit 各能放進幾個請求？
== {cnts['f']},{cnts['b']},{cnts['w']}
?? first-fit,best-fit,worst-fit
---
first-fit：{desc('f')}。best-fit：{desc('b')}。worst-fit：{desc('w')}。每放一個請求，那個空洞就縮小成剩下的大小，之後的請求看的是縮小後的空洞。
""")
    cnt+=1
# CPI
if want('cpi'):
  cnt=0
  while cnt<n:
    cl=[('算術',random.randint(1,2)),('load',random.randint(3,5)),('store',random.randint(2,4)),('分支',random.randint(2,3))]
    mix=random.choice([(50,20,10,20),(40,25,15,20),(45,30,10,15),(55,20,10,15)])
    N=random.choice([10**9,2*10**9,5*10**8]); f=random.choice([2,2.5,4])
    cpi=Fraction(sum(c*m for (_,c),m in zip(cl,mix)),100)
    t=N*cpi/Fraction(int(f*10),10)/10**9
    terms='+'.join(f'{m/100:g}'+chr(92)+f'times{c}' for (nm,c),m in zip(cl,mix))
    out.append(f"""@q pf1-? | co-perf#1 | 2 | 計算
程式有 ${N/1e9:g}\\times10^9$ 條指令，各類比例和 CPI：{'、'.join(f'{nm} {m}%（CPI {c}）' for (nm,c),m in zip(cl,mix))}。時脈 {f:g} GHz。平均 CPI 和 CPU 時間（秒）各是多少？
== {float(cpi):g},{float(t):g}
?? 平均 CPI,CPU 時間
---
平均 CPI＝各類 CPI 依比例加權：${terms}={float(cpi):g}$。CPU 時間＝指令數×CPI÷時脈＝${N/1e9:g}\\times10^9\\times{float(cpi):g}\\div({f:g}\\times10^9)={float(t):g}$ 秒。
""")
    cnt+=1
# two's complement add
if want('tc'):
  cnt=0
  while cnt<n:
    a=random.randint(-128,127); b=random.randint(-128,127); s=a+b
    ov=not(-128<=s<=127)
    if not ov and random.random()<0.5: continue
    enc=lambda x: format(x & 0xFF,'08b')
    r=(a+b)&0xFF; rv=r-256 if r>=128 else r
    out.append(f"""@q ar1-? | co-arith#1 | {3 if ov else 2} | 計算
8 位元二補數：`{enc(a)}` ＋ `{enc(b)}`。8 位元的結果是什麼？當成有號數，有沒有溢位？
== {format(r,'08b')},{'有' if ov else '沒有'}
?? 結果（8 位元）,溢位
---
`{enc(a)}`＝{a}、`{enc(b)}`＝{b}，真正的和是 {s}。8 位元只留低 8 位：`{format(r,'08b')}`，讀成有號數是 {rv}。{'和真正的和不同，超出 −128～127，溢位：兩個同號的數相加，結果卻變號。' if ov else '在 −128～127 之內，沒有溢位'+('（兩數異號相加不可能溢位）。' if (a<0)!=(b<0) else '。')}
""")
    cnt+=1
# float encode
if want('fl'):
  cnt=0
  while cnt<n:
    v=random.choice([1,-1])*random.choice([0.75,1.5,2.25,3.5,5.25,6.75,10.5,12.125,0.625,0.375,-0.0])
    if v==0: continue
    if any(o['v']==v for o in []): pass
    bits=struct.unpack('>I',struct.pack('>f',v))[0]
    sgn=bits>>31; ex=(bits>>23)&0xFF; man=bits&0x7FFFFF
    e=ex-127; m=abs(v)/2**e
    def b2(x):
        ip=int(x); fp=x-ip; s=format(ip,'b')
        if fp:
            s+='.'; 
            while fp: fp*=2; s+=str(int(fp)); fp-=int(fp)
        return s
    bm=b2(m)
    out.append(f"""@q ar4-? | co-arith#4 | 3 | 計算
把 ${v:g}$ 寫成 IEEE 754 單精度（32 位元），用十六進位表示是多少？
== {bits:08X}
== 0x{bits:08X}
---
${abs(v):g}$ 寫成二進位是 ${b2(abs(v))}_2={bm}_2\\times2^{{{e}}}$。符號 {sgn}；指數欄 ${e}+127={ex}$，即 `{ex:08b}`；尾數欄是 ${bm}_2$ 小數點後面的部分，補到 23 位：`{man:023b}`。合起來 `{sgn} {ex:08b} {man:023b}`，每 4 位一組換成十六進位得 {bits:08X}。
""")
    cnt+=1
# modexp
if want('me'):
  cnt=0
  while cnt<n:
    p=random.choice([7,11,13,17,19]); a=random.randint(2,p-2); e=random.randint(50,999)
    r=pow(a,e,p)
    out.append(f"""@q nt2-? | dm-nt-algebra#2 | {3 if p>=13 else 2} | 計算
${a}^{{{e}}}\\bmod{p}$ 是多少？
== {r}
---
{p} 是質數、${a}$ 不是 {p} 的倍數，由費馬小定理 ${a}^{{{p-1}}}\\equiv1\\pmod{{{p}}}$。${e}={e//(p-1)}\\times{p-1}+{e%(p-1)}$，所以 ${a}^{{{e}}}\\equiv{a}^{{{e%(p-1)}}}\\pmod{{{p}}}$，算出來是 {r}。
""")
    cnt+=1
print('\n'.join(out))

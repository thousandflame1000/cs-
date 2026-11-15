import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
# pipeline stalls
if want('stall'):
  cnt=0
  while cnt<n:
    regs=['$t0','$t1','$t2','$t3','$t4']
    prog=[]
    for i in range(5):
        kind=random.choice(['lw','add','add','sub'])
        d=random.choice(regs[:4])
        if kind=='lw':
            base=random.choice(['$s0','$s1']+[r for r in regs[:4] if r!=d]); prog.append(('lw',d,[base] if base.startswith('$t') else [], f'lw {d}, {4*i}({base})'))
        else:
            a=random.choice(regs[:4]+['$s0']); b=random.choice(regs[:4]+['$s1'])
            prog.append((kind,d,[x for x in (a,b) if x.startswith('$t')], f'{kind} {d}, {a}, {b}'))
    # simulate: issue cycle of ID stage; value available times
    def sim(fwd):
        ready={}  # reg -> earliest ID cycle at which value can be consumed (EX at ID+1)
        idc=1; stalls=0; prev_id=0
        for i,(k,d,srcs,txt) in enumerate(prog):
            t=max(prev_id+1, idc)
            need=t
            for s in srcs:
                if s in ready: need=max(need,ready[s])
            stalls+=need-(prev_id+1); prev_id=need
            # instruction i: ID at need, EX need+1, MEM need+2, WB need+3
            if fwd:
                ready[d]= need+ (2 if k=='lw' else 1)  # consumer ID cycle: ALU -> next instr ID can be need+1; lw -> need+2
            else:
                ready[d]= need+3  # write in first half of WB, read in second half of same cycle (ID)
        return stalls
    s1=sim(True); s0=sim(False)
    if s0==0 or s0==s1: continue
    code='\n'.join(p[3] for p in prog)
    out.append(f"""@q pl2-? | co-pipeline#2 | 3 | 追蹤
5 級管線（IF ID EX MEM WB；暫存器檔前半拍寫、後半拍讀）。下面這段程式，沒有 forwarding 和有完整 forwarding 時，各要停幾拍（插入幾個氣泡）？
```
{code}
```
== {s0},{s1}
?? 沒有 forwarding,有 forwarding
---
沒有 forwarding：結果要等寫回，消費者的 ID 最早和生產者的 WB 同一拍，所以相隔 1 條要停 2 拍、相隔 2 條停 1 拍。有 forwarding：ALU 結果下一條就能用；`lw` 的值要到 MEM 結束才有，緊接著使用要停 1 拍。逐條檢查真相依（後面讀前面寫的暫存器），共停 {s0} 拍和 {s1} 拍。
""")
    cnt+=1
# pipeline cycles
if want('cyc'):
  cnt=0
  while cnt<n:
    k=random.choice([4,5,6,8]); N=random.choice([100,200,500,1000]); st=random.choice([0,10,20,50])
    cyc=k+N-1+st; un=N*k
    out.append(f"""@q pl1-? | co-pipeline#1 | 2 | 計算
{k} 級管線執行 {N} 條指令，途中因為危障一共停了 {st} 拍。總共要幾拍？和不用管線（每條指令 {k} 拍做完才做下一條）相比快幾倍（四捨五入到小數第二位）？
== {cyc},{F(un,cyc).__float__():.2f}
?? 總拍數,加速比
---
第一條要 {k} 拍才出來，之後每拍完成一條：${k}+({N}-1)={k+N-1}$，再加停頓 {st}，共 {cyc} 拍。不用管線要 ${N}\\times{k}={un}$ 拍，加速比 ${un}/{cyc}\\approx{un/cyc:.2f}$。指令很多、停頓很少時，加速比接近級數 {k}。
""")
    cnt+=1
# power
if want('pw'):
  cnt=0
  while cnt<n:
    P=random.choice([40,60,80,100,120]); v=random.choice([0.8,0.85,0.9,1.1,1.2]); f=random.choice([0.5,0.8,0.9,1.2,1.5])
    if (v<1)!=(f<1): continue
    P2=P*v*v*f
    out.append(f"""@q pf4-? | co-perf#4 | 2 | 計算
處理器原本動態功耗 {P} W。電壓變成原來的 {v} 倍、頻率變成 {f} 倍（電容不變）。新的動態功耗是多少 W（四捨五入到小數第一位）？
== {P2:.1f}
---
$P\\propto CV^2f$：${P}\\times{v}^2\\times{f}={P}\\times{v*v:.4g}\\times{f}\\approx{P2:.1f}$ W。電壓是平方項，降壓省電的效果比降頻明顯；但電壓降低時能跑的最高頻率也跟著降，兩者通常一起調（DVFS）。
""")
    cnt+=1
# TLB EAT
if want('tlb'):
  cnt=0
  while cnt<n:
    t=random.choice([1,2,5,10,20]); m=random.choice([50,80,100]); h=random.choice([80,90,95,98,99]); lv=random.choice([1,2])
    hit=t+m; miss=t+(lv+1)*m
    e=F(h,100)*hit+F(100-h,100)*miss
    out.append(f"""@q vc1-? | co-vm-coherence#1 | 2 | 計算
查 TLB {t} ns、存取記憶體一次 {m} ns，頁表是{'單層' if lv==1 else '兩層'}（都在記憶體裡、沒有被 cache）。TLB 命中率 {h}%。不考慮缺頁，有效記憶體存取時間是多少 ns？
== {float(e):g}
---
命中：${t}+{m}={hit}$；沒命中：查 TLB、讀 {lv} 次頁表、再讀資料，${t}+{lv+1}\\times{m}={miss}$。平均 ${h/100:g}\\times{hit}+{(100-h)/100:g}\\times{miss}={float(e):g}$ ns。
""")
    cnt+=1
# working set
if want('ws'):
  cnt=0
  while cnt<n:
    refs=[random.randint(1,7) for _ in range(16)]
    D=random.choice([4,5,6]); t=random.randint(D,16)
    win=refs[t-D:t]; ws=sorted(set(win))
    out.append(f"""@q vm3-? | os-vm#3 | 2 | 計算
頁的參考串（時間 1 到 16）：{' '.join(map(str,refs))}。工作集視窗 $\\Delta={D}$。在時間 {t}（含第 {t} 次參考）時，工作集是哪些頁？有幾頁？
== {' '.join(map(str,ws))},{len(ws)}
?? 工作集（由小到大、空格隔開）,頁數
---
看最近 {D} 次參考，也就是第 {t-D+1} 到第 {t} 次：{' '.join(map(str,win))}。去掉重複得 {{{', '.join(map(str,ws))}}}，共 {len(ws)} 頁。所有行程工作集大小的總和超過 frame 數，就會 thrashing。
""")
    cnt+=1
# binomial heap
if want('bh'):
  cnt=0
  while cnt<n:
    a=random.randint(5,30); b=random.randint(5,30)
    def trees(x): return [k for k in range(6) if x>>k&1]
    out.append(f"""@q hp4-? | ds-heap#4 | 2 | 計算
一個有 {a} 個元素的 binomial heap 和一個有 {b} 個元素的 binomial heap 合併。合併前兩個 heap 各有幾棵樹？合併後有幾棵樹？
== {len(trees(a))},{len(trees(b))},{len(trees(a+b))}
?? 第一個,第二個,合併後
---
binomial heap 的樹對應元素個數的二進位：${a}={bin(a)[2:]}_2$ 有 $B_k$：{', '.join(f'$B_{k}$' for k in trees(a))}；${b}={bin(b)[2:]}_2$ 有 {', '.join(f'$B_{k}$' for k in trees(b))}。合併像二進位加法，${a}+{b}={a+b}={bin(a+b)[2:]}_2$，剩 {len(trees(a+b))} 棵：{', '.join(f'$B_{k}$' for k in trees(a+b))}。
""")
    cnt+=1
# Euler strokes
if want('eul'):
  cnt=0
  while cnt<n:
    k=random.choice([6,7,8]); deg=[random.randint(1,5) for _ in range(k)]
    if sum(deg)%2: continue
    odd=sum(d%2 for d in deg)
    strokes=max(1,odd//2)
    out.append(f"""@q dg2-? | dm-graph#2 | 2 | 計算
一張連通圖有 {k} 個點，度數依序 {', '.join(map(str,deg))}。要把每條邊恰好畫一次，最少要分幾筆？有沒有歐拉迴路？
== {strokes},{'有' if odd==0 else '沒有'}
?? 最少筆數,歐拉迴路
---
奇數度的點有 {odd} 個。連通圖中，奇度點 0 個就有歐拉迴路（一筆畫完回到起點）；有 $2m$ 個時至少要 $m$ 筆，而且 $m$ 筆一定夠（每一筆從一個奇度點走到另一個）。所以是 {strokes} 筆。
""")
    cnt+=1
# divide and conquer exact
if want('dc'):
  cnt=0
  while cnt<n:
    a=random.choice([2,3,4]); b=2; c=random.choice([1,2,3]); T1=random.choice([1,2]); k=random.choice([3,4])
    def T(m): return T1 if m==1 else a*T(m//2)+c*m
    N=2**k
    vals=[T(2**i) for i in range(k+1)]
    cs=(str(c)+BS+'cdot ') if c>1 else ''
    out.append(f"""@q rg4-? | dm-recur-gf#4 | 2 | 計算
$T(n)={a}T(n/2)+{c if c>1 else ''}n$，$T(1)={T1}$，$n$ 是 2 的次方。$T({N})$ 是多少？
== {vals[-1]}
---
直接往上算：{', '.join(f'$T({2**i})={vals[i]}$' for i in range(k+1))}。也可以令 $t_k=T(2^k)$，得到 $t_k={a}t_{{k-1}}+{cs}2^k$，再解線性遞迴。
""")
    cnt+=1
# projection
if want('proj'):
  cnt=0
  while cnt<n:
    a=[random.randint(-2,3) for _ in range(3)]; b=[random.randint(-3,4) for _ in range(3)]
    aa=sum(x*x for x in a); ab=sum(x*y for x,y in zip(a,b))
    if aa==0 or ab==0: continue
    c=F(ab,aa); p=[c*x for x in a]
    out.append(f"""@q or2-? | la-ortho#2 | 2 | 計算
把 $b=({','.join(map(str,b))})$ 投影到 $a=({','.join(map(str,a))})$ 的方向上，投影向量 $p$ 是？
== {','.join(fr(x) for x in p)}
?? p_1,p_2,p_3
---
$p=\\frac{{a\\cdot b}}{{a\\cdot a}}a=\\frac{{{ab}}}{{{aa}}}a$，得 $({', '.join(fr(x) for x in p)})$。檢查：$b-p$ 和 $a$ 的內積是 0。
""")
    cnt+=1
# PD test 3x3
if want('pd'):
  cnt=0
  while cnt<n:
    A=[[0]*3 for _ in range(3)]
    for i in range(3):
        A[i][i]=random.randint(1,5)
        for j in range(i+1,3): A[i][j]=A[j][i]=random.randint(-3,3)
    d1=A[0][0]; d2=A[0][0]*A[1][1]-A[0][1]**2
    d3=A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0])
    pd=d1>0 and d2>0 and d3>0
    if d2==0 or d3==0: continue
    mat=(BS+BS).join('&'.join(map(str,r)) for r in A)
    out.append(f"""@q sv2-? | la-sym-svd#2 | 3 | 計算
$A=\\left[\\begin{{smallmatrix}}{mat}\\end{{smallmatrix}}\\right]$ 的三個左上角主子式（$1\\times1$、$2\\times2$、$3\\times3$ 的行列式）各是多少？$A$ 是不是正定？
== {d1},{d2},{d3},{'是' if pd else '不是'}
?? 1×1,2×2,3×3,正定
---
$1\\times1$：{d1}。$2\\times2$：${A[0][0]}\\cdot{A[1][1]}-({A[0][1]})^2={d2}$。$3\\times3$：整個矩陣的行列式 {d3}。對稱矩陣正定 ⇔ 所有左上角主子式都大於 0，所以{'是正定。' if pd else '不是正定（有一個不大於 0）。'}
""")
    cnt+=1
print('\n'.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
if want('cbt'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.randint(20,200)
    if N in seen or (N+1)&N==0: continue
    seen.add(N)
    h=N.bit_length()-1; last=N-(2**h-1); leaves=(N+1)//2; deg1=1 if N%2==0 else 0
    out.append(f"""@q bst1-? | ds-bst#1 | 2 | 計算
一棵有 {N} 個節點的完全二元樹（只有最後一層可能沒滿，而且從左邊開始填）。樹高（根的深度 0）是多少？最後一層有幾個節點？葉子有幾個？
== {h},{last},{leaves}
?? 樹高,最後一層,葉子
---
前 {h} 層（深度 0～{h-1}）全滿共 $2^{{{h}}}-1={2**h-1}$ 個，剩下 {last} 個在深度 {h}，所以樹高 $\\lfloor\\lg {N}\\rfloor={h}$。用陣列（從 1 編號）存時，編號 $>\\lfloor {N}/2\\rfloor={N//2}$ 的都是葉子，共 $\\lceil {N}/2\\rceil={leaves}$ 個。{'只有一個節點恰好有一個孩子（第 '+str(N//2)+' 號）。' if deg1 else '沒有只有一個孩子的節點。'}
""")
    cnt+=1
if want('util'):
  cnt=0; seen=set()
  while cnt<n:
    k=random.choice([2,3]); T=[random.choice([4,5,6,8,10,12,15,20]) for _ in range(k)]
    C=[random.randint(1,max(1,t//3)) for t in T]
    key=(tuple(C),tuple(T))
    if key in seen or len(set(T))<k: continue
    seen.add(key)
    U=sum(F(c,t) for c,t in zip(C,T)); bound=k*(2**(1/k)-1)
    if U>1: continue
    rm_ok=U<=bound
    out.append(f"""@q sc3-? | os-sched#3 | 3 | 計算
週期性工作（執行時間, 週期）：{'、'.join(f'({c}, {t})' for c,t in zip(C,T))}。總使用率 $U$ 是多少？是否通過 Rate-monotonic 的充分條件 $U\\le n(2^{{1/n}}-1)$？EDF 能不能排得下？
== {fr(U)},{'通過' if rm_ok else '不通過'},{'能'}
?? U,RM 充分條件,EDF
---
$U={'+'.join(f'{c}/{t}' for c,t in zip(C,T))}={fr(U)}\\approx{float(U):.3f}$。$n={k}$ 的界是 ${k}(2^{{1/{k}}}-1)\\approx{bound:.3f}$，{'$U$ 在界內，RM 一定排得下' if rm_ok else '$U$ 超過這個界——但這只是充分條件，RM 仍可能排得下，要實際模擬才知道'}。EDF 只要 $U\\le1$ 就一定能排，所以能。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
BS=chr(92)
def mat(M): return BS+'left['+BS+'begin{smallmatrix}'+(BS+BS).join('&'.join(fr(F(x)) for x in r) for r in M)+BS+'end{smallmatrix}'+BS+'right]'
if want('hfun'):
  cnt=0
  while cnt<n:
    mode=random.choice(['mul','univ'])
    if mode=='mul':
        m=random.choice([8,16,32,100]); k=random.randint(10,200); A=F(618,1000)
        frac=(k*A)-((k*A).numerator//(k*A).denominator)
        h=int(m*frac)
        out.append(f"""@q hs1-? | ds-hash#1 | 2 | 計算
乘法法雜湊：$h(k)=\\lfloor m\\,(kA\\bmod1)\\rfloor$，取 $A=0.618$、$m={m}$。$h({k})$ 是多少？
== {h}
---
$kA={k}\\times0.618={float(k*A):g}$，取小數部分 ${float(frac):g}$，乘以 $m={m}$ 得 ${float(m*frac):g}$，取整數 {h}。乘法法對 $m$ 沒有特別要求（常取 2 的次方），重點在 $A$ 要選得「夠無理」，讓 key 的每一位都影響結果。
""")
    else:
        p=random.choice([17,19,23,29,31]); m=random.choice([5,6,7,8,10]); a=random.randint(1,p-1); b=random.randint(0,p-1); k=random.randint(10,99)
        h=((a*k+b)%p)%m
        out.append(f"""@q hs1-? | ds-hash#1 | 2 | 計算
全域雜湊族 $h_{{a,b}}(k)=((ak+b)\\bmod p)\\bmod m$，$p={p}$、$m={m}$。隨機抽到 $a={a}$、$b={b}$ 時，$h({k})$ 是多少？
== {h}
---
${a}\\times{k}+{b}={a*k+b}$，$\\bmod {p}$ 得 {(a*k+b)%p}，再 $\\bmod {m}$ 得 {h}。重點是 $a,b$ 在執行時才隨機挑：對任兩個不同的 key，碰撞機率 $\\le1/m$，對手無法事先設計一組專門撞同一格的資料。
""")
    cnt+=1
if want('indi'):
  cnt=0; seen=set()
  while cnt<n:
    mode=random.choice(['bday','inv','fixed','empty'])
    if mode=='bday':
        k=random.randint(20,40); d=365
        if (mode,k) in seen: continue
        seen.add((mode,k)); e=F(k*(k-1),2*d)
        out.append(f"""@q pb1-? | al-prob#1 | 2 | 計算
{k} 個人，生日各自獨立、均勻落在 365 天中。「同一天生日的兩人組」期望有幾組？（可用分數，或四捨五入到小數第二位）
== {fr(e)}
== {float(e):.2f}
---
對每一對 $(i,j)$ 設指示變數 $X_{{ij}}$（同天生日為 1），$E[X_{{ij}}]=1/365$。共有 $\\binom{{{k}}}{{2}}={k*(k-1)//2}$ 對，由期望值的線性：$E[X]={k*(k-1)//2}/365={fr(e)}\\approx{float(e):.2f}$。不需要知道各對之間是否獨立——線性性永遠成立。
""")
    elif mode=='inv':
        k=random.randint(6,20)
        if (mode,k) in seen: continue
        seen.add((mode,k)); e=F(k*(k-1),4)
        out.append(f"""@q pb1-? | al-prob#1 | 2 | 計算
把 1～{k} 隨機打亂（每種排列機率相同）。「$i<j$ 但 $a_i>a_j$」的位置對，期望有幾對？（可用分數）
== {fr(e)}
---
每一對位置 $(i,j)$ 設指示變數，兩個數誰大誰小各一半機率，$E=1/2$。共 $\\binom{{{k}}}{{2}}={k*(k-1)//2}$ 對，期望 ${k*(k-1)//2}\\times\\frac12={fr(e)}$。插入排序的交換次數就是逆序數，所以它的平均情況也是 $\\Theta(n^2)$。
""")
    elif mode=='fixed':
        k=random.randint(5,30)
        if (mode,k) in seen: continue
        seen.add((mode,k))
        out.append(f"""@q pb1-? | al-prob#1 | 2 | 陷阱
{k} 個人把帽子丟進箱子，再每人隨機拿一頂（每種分法機率相同）。拿回自己帽子的人，期望有幾個？
[x] 1
[ ] {fr(F(k,2))}
[ ] $1/{k}$
[ ] 0
---
第 $i$ 人拿到自己帽子的機率 $1/{k}$，設指示變數 $X_i$，$E[X]=\\sum E[X_i]={k}\\times\\frac1{{{k}}}=1$——和人數無關。各 $X_i$ 並不獨立，但期望值的線性性不需要獨立。
""")
    else:
        k=random.randint(4,12); b=random.randint(3,6)
        if (mode,k,b) in seen: continue
        seen.add((mode,k,b)); e=b*F(b-1,b)**k
        out.append(f"""@q pb1-? | al-prob#1 | 3 | 計算
把 {k} 顆球各自獨立、均勻地丟進 {b} 個箱子。沒有球的箱子，期望有幾個？（四捨五入到小數第二位）
== {float(e):.2f}
---
第 $j$ 個箱子是空的機率 $(1-\\frac1{{{b}}})^{{{k}}}$。對每個箱子設指示變數再相加：$E={b}\\times(\\frac{{{b-1}}}{{{b}}})^{{{k}}}\\approx{float(e):.2f}$。同樣的想法可以算雜湊表裡空格的期望數。
""")
    cnt+=1
if want('pig'):
  cnt=0; seen=set()
  ctx=[('撲克牌（4 種花色）',4,'張','同一種花色'),('人（12 個月份）',12,'人','同一個月出生'),('襪子（5 種顏色，每色很多雙的量）',5,'隻','同一種顏色'),('學生（成績分 A～E 五級）',5,'位','同一級')]
  while cnt<n:
    c=random.choice(ctx); k=random.randint(3,6)
    if (c[1],k) in seen: continue
    seen.add((c[1],k)); ans=c[1]*(k-1)+1
    out.append(f"""@q lg4-? | dm-logic#4 | 2 | 計算
至少要有幾{c[2]}{c[0].split('（')[0]}，才能**保證**其中有 {k} {c[2]}{c[3]}？（{c[0].split('（')[1].rstrip('）')}）
== {ans}
---
最壞情況是每一類都剛好 {k-1} {c[2]}：${c[1]}\\times{k-1}={c[1]*(k-1)}$ {c[2]}還湊不到 {k} {c[2]}同類。再多 1 {c[2]}，一定有某一類達到 {k}。廣義鴿籠：$N$ 個東西放進 $m$ 個箱子，至少有一箱 $\\ge\\lceil N/m\\rceil$；要 $\\lceil N/{c[1]}\\rceil\\ge{k}$，最小 $N={ans}$。
""")
    cnt+=1
if want('card'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.randint(2,4); b=random.randint(2,5)
    if (a,b) in seen: continue
    seen.add((a,b))
    fn=b**a; inj=math.perm(b,a) if a<=b else 0
    sur=sum((-1)**j*math.comb(b,j)*(b-j)**a for j in range(b+1))
    injtxt=('$|A|>|B|$，不可能，0 個' if a>b else '像都不同，'+'×'.join(str(b-i) for i in range(a))+'＝'+str(inj))
    surtxt='，$|A|<|B|$ 時不可能，0 個' if a<b else '，用排容 $'+BS+'sum_j(-1)^j'+BS+'binom{'+str(b)+'}{j}('+str(b)+'-j)^{'+str(a)+'}='+str(sur)+'$'
    out.append(f"""@q lg5-? | dm-logic#5 | 2 | 計算
$|A|={a}$、$|B|={b}$。從 $A$ 到 $B$ 的函數有幾個？其中一對一的有幾個？映成的有幾個？
== {fn},{inj},{sur}
?? 函數,一對一,映成
---
每個 $A$ 的元素各自挑一個像：${b}^{{{a}}}={fn}$。一對一：{injtxt}。映成：$B$ 每個都要被打到{surtxt}。
""")
    cnt+=1
if want('il1'):
  cnt=0
  while cnt<n:
    regs=['r1','r2','r3','r4','r5']
    ins=[(random.choice(regs),random.choice(regs),random.choice(regs)) for _ in range(4)]
    i,j=0,random.choice([2,3])
    di,s1i,s2i=ins[i]; dj,s1j,s2j=ins[j]
    raw=int(di in (s1j,s2j)); war=int(dj in (s1i,s2i)); waw=int(di==dj)
    if raw+war+waw<2: continue
    seq='；'.join(f'I{k+1}: `add {d}, {a}, {b}`' for k,(d,a,b) in enumerate(ins))
    out.append(f"""@q il1-? | co-ilp#1 | 2 | 計算
{seq}。只看 I{i+1} 和 I{j+1} 這一對（I{i+1} 在前），它們之間有沒有 RAW、WAR、WAW 相依？（有寫 1、沒有寫 0）
== {raw},{war},{waw}
?? RAW,WAR,WAW
---
I{i+1} 寫 {di}、讀 {s1i}、{s2i}；I{j+1} 寫 {dj}、讀 {s1j}、{s2j}。RAW：I{j+1} 讀了 I{i+1} 寫的 {di}？{'是' if raw else '否'}。WAR：I{j+1} 寫的 {dj} 是 I{i+1} 讀的嗎？{'是' if war else '否'}。WAW：兩個寫同一個暫存器？{'是' if waw else '否'}。只有 RAW 是真相依；WAR、WAW 是名稱相依，換個暫存器名字就消失。
""")
    cnt+=1
if want('ca5'):
  cnt=0; seen=set()
  while cnt<n:
    s=random.choice([1,2]); d=random.choice([12,18,30,40]); t_=random.choice([1,2]); w=random.choice([4,8]); bk=w
    key=(s,d,t_,w)
    if key in seen or (s,d,t_) in [(1,15,1),(1,20,1),(1,25,1),(1,10,1)]: continue
    seen.add(key)
    one=w*(s+d+t_); wide=s+d+t_; inter=s+d+w*t_
    out.append(f"""@q ca5-? | co-cache#5 | 2 | 計算
送位址 {s} 拍、DRAM 存取 {d} 拍、匯流排傳一個字 {t_} 拍，cache 區塊 {w} 個字。三種記憶體組織的 miss penalty 各是幾拍：(甲) 一個字寬、每個字都重新送位址存取；(乙) 記憶體和匯流排都加寬到 {w} 個字；(丙) {bk} 個 bank 交錯、匯流排一個字寬？
== {one},{wide},{inter}
?? 甲,乙,丙
---
甲：每個字都要 送位址＋存取＋傳送，${w}\\times({s}+{d}+{t_})={one}$。乙：一次送、一次存取、一次傳完整塊，${s}+{d}+{t_}={wide}$。丙：位址送一次，{bk} 個 bank 同時存取，再一個字一個字傳回：${s}+{d}+{w}\\times{t_}={inter}$。交錯幾乎有加寬的效果，卻不必加寬匯流排。
""")
    cnt+=1
if want('sv1'):
  cnt=0; seen=set()
  while cnt<n:
    l1,l2=random.sample([-2,-1,1,2,3,4,5,6],2)
    if (l1+l2)%2 or (l1,l2) in seen: continue
    seen.add((l1,l2))
    a=(l1+l2)//2; b=(l1-l2)//2
    if b==0: continue
    out.append(f"""@q sv1-? | la-sym-svd#1 | 2 | 計算
對稱矩陣 $A={mat([[a,b],[b,a]])}$。它的兩個特徵值（由大到小）是？對應較大特徵值的單位特徵向量（第一個分量取正）是？
[x] {max(l1,l2)}、{min(l1,l2)}；$\\frac1{{\\sqrt2}}(1,{1 if b>0 else -1})$
[ ] {max(l1,l2)}、{min(l1,l2)}；$\\frac1{{\\sqrt2}}(1,{-1 if b>0 else 1})$
[ ] {a}、{a}；$(1,0)$
[ ] {a+abs(b)+1}、{a-abs(b)-1}；$\\frac1{{\\sqrt2}}(1,1)$
---
這種「對角線相同」的對稱矩陣，$(1,1)$ 和 $(1,-1)$ 一定是特徵向量：$A(1,1)^T={a+b}(1,1)^T$、$A(1,-1)^T={a-b}(1,-1)^T$。特徵值 {a+b}、{a-b}，較大的是 {max(l1,l2)}，方向 $(1,{1 if b>0 else -1})$，正規化除以 $\\sqrt2$。兩個特徵向量互相垂直——實對稱矩陣一定能用正交矩陣對角化（譜定理）。
""")
    cnt+=1
if want('or1'):
  cnt=0
  while cnt<n:
    u=[random.randint(-3,4) for _ in range(3)]; v=[random.randint(-3,4) for _ in range(3)]
    j=random.randrange(3)
    if u[j]==0: continue
    rest=sum(u[t]*v[t] for t in range(3) if t!=j)
    if rest%u[j]: continue
    k=-rest//u[j]
    if k==0: continue
    vs=['k' if t==j else str(v[t]) for t in range(3)]
    dots='+'.join(f'({u[t]})({vs[t]})' for t in range(3))
    kco={1:'',-1:'-'}.get(u[j],str(u[j]))
    out.append(f"""@q or1-? | la-ortho#1 | 2 | 計算
$u=({u[0]},{u[1]},{u[2]})$、$v=({','.join(vs)})$。$k$ 等於多少時 $u$ 和 $v$ 垂直？
== {k}
---
垂直 ⇔ $u\\cdot v=0$：${dots}=0$，即 ${kco}k{'+' if rest>=0 else ''}{rest}=0$，$k={k}$。
""")
    cnt+=1
if want('dt1'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.choice([2,3,4]); dA=random.choice([-3,-2,2,3,4,5]); dB=random.choice([-2,2,3,-1])
    c=random.choice([2,3,-1,-2]); e=random.choice([2,3])
    key=(N,dA,dB,c,e)
    if key in seen: continue
    seen.add(key)
    val=F(c)**N*F(1,dA)*F(dB)**e
    cs=str(c) if c>0 else f'({c})'
    out.append(f"""@q dt1-? | la-det#1 | 3 | 計算
$A$、$B$ 都是 ${N}\\times{N}$，$\\det A={dA}$、$\\det B={dB}$。$\\det\\big({cs}A^{{-1}}(B^T)^{{{e}}}\\big)$ 是多少？（可用分數）
== {fr(val)}
---
三個性質：$\\det(cM)=c^n\\det M$（每一列都乘 $c$）、$\\det(A^{{-1}})=1/\\det A$、$\\det(B^T)=\\det B$，再加上乘法性。$({c})^{{{N}}}\\times\\frac1{{{dA}}}\\times({dB})^{{{e}}}={fr(val)}$。常見錯誤：把 $\\det(cA)$ 寫成 $c\\det A$，忘了是 $c^n$。
""")
    cnt+=1
if want('euler'):
  cnt=0; seenE=set()
  while cnt<n:
    V='abcdef'[:random.choice([5,6])]
    E=set()
    for _ in range(30):
        u,v=random.sample(V,2); e=tuple(sorted((u,v)))
        if e not in E: E.add(e)
        deg={x:sum(1 for ed in E if x in ed) for x in V}
        if len(E)>=len(V)+2 and all(deg[x]%2==0 and deg[x]>0 for x in V): break
    deg={x:sum(1 for ed in E if x in ed) for x in V}
    if not all(deg[x]%2==0 and deg[x]>0 for x in V): continue
    adj={x:sorted(y for ed in E for y in ed if x in ed and y!=x) for x in V}
    # connectivity
    seenv={'a'}; st=['a']
    while st:
        x=st.pop()
        for y in adj[x]:
            if y not in seenv: seenv.add(y); st.append(y)
    if len(seenv)<len(V): continue
    unused={ed:1 for ed in E}; stack=['a']; circ=[]
    while stack:
        v=stack[-1]
        nb=[y for y in adj[v] if unused.get(tuple(sorted((v,y))))]
        if nb:
            y=min(nb); unused[tuple(sorted((v,y)))]=0; stack.append(y)
        else: circ.append(stack.pop())
    circ=circ[::-1]
    if len(circ)!=len(E)+1 or tuple(sorted(E)) in seenE: continue
    seenE.add(tuple(sorted(E)))
    out.append(f"""@q gr7-? | ds-graph#7 | 3 | 追蹤
無向圖的邊：{'、'.join(f'{u}–{v}' for u,v in sorted(E))}。用 Hierholzer 演算法（堆疊版）：從 a 出發，堆疊頂端的點若還有沒走過的邊，就走到編號（字母）最小的鄰居並推入堆疊；沒有就把它彈出、接到答案後面。最後把答案反過來，得到的迴路是？（空格隔開）
== {' '.join(circ)}
---
每個點度數都是偶數且連通，所以有歐拉迴路。照規則模擬：先一路走到卡住（回到起點），彈出時再從途中還有剩邊的點「繞出去」補一圈。結果 {' '.join(circ)}，共 {len(E)} 條邊、每條剛好一次，時間 $O(E)$。
""")
    cnt+=1
if want('rtree'):
  cnt=0; seen=set()
  while cnt<n:
    a=random.choice([2,3,4,8]); b=random.choice([2,4]); c=random.choice([1,2]); k=random.randint(3,5)
    if (a,b,c,k) in seen or a==b**c: continue
    seen.add((a,b,c,k))
    N=b**k
    lv=lambda i:a**i*(N//b**i)**c
    leaves=a**k
    tot=sum(lv(i) for i in range(k))+leaves
    fstr='n' if c==1 else 'n^2'
    out.append(f"""@q rc3-? | al-recurrence#3 | 2 | 計算
$T(n)={a}T(n/{b})+{fstr}$，$T(1)=1$，$n={N}$。遞迴樹第 $i$ 層（根是第 0 層）的總成本是多少（以 $i$ 表示，代 $i=1$ 的值）？葉子有幾個？$T({N})$ 精確值是？
== {lv(1)},{leaves},{tot}
?? 第1層,葉子,T(n)
---
第 $i$ 層有 ${a}^i$ 個子問題、各大小 $n/{b}^i$，成本 ${a}^i(n/{b}^i)^{{{c}}}$；$i=1$ 時是 {lv(1)}。樹高 $\\log_{{{b}}}{N}={k}$，葉子 ${a}^{{{k}}}={leaves}$。全部相加：{'＋'.join(str(lv(i)) for i in range(k))}＋{leaves}＝{tot}。每層成本隨 $i$ {'變大，葉子主導' if a>b**c else '變小，根主導'}，對應 Master 定理的情況 {'1' if a>b**c else '3'}。
""")
    cnt+=1
if want('cvar'):
  cnt=0; seen=set()
  opts=[(2,'\\lg n','\\Theta(\\lg n\\lg\\lg n)','$S(m)=2S(m/2)+m$'),(1,'1','\\Theta(\\lg\\lg n)','$S(m)=S(m/2)+1$'),(2,'1','\\Theta(\\lg n)','$S(m)=2S(m/2)+1$'),(4,'\\lg n','\\Theta(\\lg^2 n)','$S(m)=4S(m/2)+m$'),(1,'\\lg n','\\Theta(\\lg n)','$S(m)=S(m/2)+m$'),(4,'\\lg^2 n','\\Theta(\\lg^2 n\\lg\\lg n)','$S(m)=4S(m/2)+m^2$')]
  wrong=['\\Theta(\\sqrt n)','\\Theta(n)','\\Theta(\\lg n)','\\Theta(\\lg\\lg n)','\\Theta(\\lg n\\lg\\lg n)','\\Theta(\\lg^2 n)']
  while cnt<n:
    o=random.choice(opts)
    if o in seen: continue
    seen.add(o)
    a,f,ans,S=o
    distract=[w for w in wrong if w!=ans]; random.shuffle(distract)
    out.append(f"""@q rc4-? | al-recurrence#4 | 3 | 計算
$T(n)={'' if a==1 else a}T(\\sqrt n)+{f}$。用變數變換求 $T(n)$ 的量級。
[x] ${ans}$
[ ] ${distract[0]}$
[ ] ${distract[1]}$
[ ] ${distract[2]}$
---
令 $m=\\lg n$（$n=2^m$），$\\sqrt n=2^{{m/2}}$。設 $S(m)=T(2^m)$，得 {S}。用 Master 定理解出 $S(m)$ 再把 $m=\\lg n$ 代回：$T(n)={ans}$。關鍵是開根號在指數上變成「除以 2」。
""")
    cnt+=1
if want('lb'):
  cnt=0
  for N in [8,9,10,11]:
    if cnt>=n: break
    f=math.factorial(N); h=math.ceil(math.log2(f))
    out.append(f"""@q srt2-? | ds-sort#2 | 2 | 計算
用比較排序排 {N} 個不同的數，最壞情況下至少要比較幾次？
== {h}
---
決策樹要能區分 ${N}!={f}$ 種輸入順序，所以至少 {f} 片葉子；高度 $h$ 的二元樹最多 $2^h$ 片葉子，$2^h\\ge{f}$ ⇒ $h\\ge\\lceil\\lg {f}\\rceil={h}$（$2^{{{h-1}}}={2**(h-1)}<{f}\\le2^{{{h}}}={2**h}$）。這是任何比較排序的下界，不是某個演算法的實際次數。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
BS=chr(92)
# 2-bit predictor
if want('bp'):
  cnt=0
  while cnt<n:
    s=''.join(random.choice('TTTN') for _ in range(12))
    st=3 if random.random()<0.5 else 1  # 0 SN,1 WN,2 WT,3 ST
    names=['強烈不跳','微弱不跳','微弱跳','強烈跳']
    init=st; wrong=0; tr=[]
    for c in s:
        pred='T' if st>=2 else 'N'
        ok=pred==c; wrong+= (not ok)
        tr.append(f'{c}{"" if ok else "✗"}')
        st=min(3,st+1) if c=='T' else max(0,st-1)
    one=0; last='T' if init>=2 else 'N'
    for c in s:
        one+= (last!=c); last=c
    if wrong==one: continue
    out.append(f"""@q pl3-? | co-pipeline#3 | 3 | 追蹤
某個分支依序的實際結果（T＝跳、N＝不跳）：{' '.join(s)}。2 位元飽和計數器一開始在「{names[init]}」。預測錯幾次？如果改用 1 位元預測器（一開始預測{'跳' if init>=2 else '不跳'}，每次記住上一次的結果），錯幾次？
== {wrong},{one}
?? 2 位元,1 位元
---
2 位元：狀態 0～3（0、1 預測不跳，2、3 預測跳），跳就加 1、不跳就減 1，到 0 或 3 就停住。逐次結果（✗ 是猜錯）：{' '.join(tr)}，共錯 {wrong} 次。1 位元只要結果和上一次不同就猜錯，共 {one} 次。2 位元要連錯兩次才會改變預測方向，偶爾出現一次的例外不會讓它馬上改口。
""")
    cnt+=1
# AMAT two-level
if want('amat'):
  cnt=0
  while cnt<n:
    h1=1; m1=random.choice([2,3,4,5,8,10]); h2=random.choice([8,10,12,15,20]); m2=random.choice([10,20,25,40,50]); mem=random.choice([100,150,200,300])
    am=Fraction(h1)+Fraction(m1,100)*(h2+Fraction(m2,100)*mem)
    g=Fraction(m1*m2,10000)
    out.append(f"""@q ca4-? | co-cache#4 | 2 | 計算
L1 命中 {h1} 拍、miss rate {m1}%；L2 命中 {h2} 拍、local miss rate {m2}%；主記憶體 {mem} 拍。AMAT 是幾拍？L2 的 global miss rate 是多少 %？
== {float(am):g},{float(g*100):g}
?? AMAT,global miss rate（%）
---
$\\text{{AMAT}}={h1}+{m1/100:g}\\times({h2}+{m2/100:g}\\times{mem})={h1}+{m1/100:g}\\times{float(h2+Fraction(m2,100)*mem):g}={float(am):g}$ 拍。global miss rate＝L1 miss rate × L2 local miss rate＝${m1}\\%\\times{m2}\\%={float(g*100):g}\\%$，也就是所有存取中真正走到主記憶體的比例。
""")
    cnt+=1
# Amdahl
if want('amd'):
  cnt=0
  while cnt<n:
    f=random.choice([40,50,60,70,75,80,90]); s=random.choice([2,4,5,8,10,20])
    S=Fraction(1)/(Fraction(100-f,100)+Fraction(f,100*s)); lim=Fraction(100,100-f)
    r2=lambda x: f'{float(x):.2f}'.rstrip('0').rstrip('.')
    Ss=r2(S); Ls=r2(lim)
    alt='' if lim.denominator==1 else f'{chr(10)}== {Ss},{lim.numerator}/{lim.denominator}'
    out.append(f"""@q pf3-? | co-perf#3 | 2 | 計算
程式有 {f}% 的時間花在某個部分，把這部分加速 {s} 倍，其他不變。整體加速比是多少（四捨五入到小數第二位）？這部分加速到無限快時，整體最多快幾倍？
== {Ss},{Ls}{alt}
?? 整體加速比,上限
---
$S=\\frac1{{(1-{f/100:g})+{f/100:g}/{s}}}=\\frac1{{{float(Fraction(100-f,100)+Fraction(f,100*s)):g}}}\\approx{float(S):.2f}$。上限是 $\\frac1{{1-{f/100:g}}}\\approx{float(lim):.2f}$：沒加速的 {100-f}% 決定了極限。
""")
    cnt+=1
# multi-level page table
if want('pt'):
  cnt=0
  while cnt<n:
    va=random.choice([32,32,39,48]); pg=random.choice([4096,8192,16384]); pte=random.choice([4,8])
    if (va,pg,pte)==(32,4096,4): continue
    off=int(math.log2(pg)); per=pg//pte; bpl=int(math.log2(per))
    vpn=va-off; levels=math.ceil(vpn/bpl)
    single=(2**vpn)*pte
    def sz(b):
        for u,nm in [(2**40,'TB'),(2**30,'GB'),(2**20,'MB'),(2**10,'KB')]:
            if b>=u: return f'{b//u} {nm}' if b%u==0 else f'{b/u:g} {nm}'
        return f'{b} bytes'
    out.append(f"""@q me4-? | os-memory#4 | 3 | 計算
{va} 位元虛擬位址、頁大小 {pg//1024} KB、每個頁表項 {pte} bytes。單層頁表每個行程要多大？如果每一層頁表剛好放進一頁，需要幾層？
== {sz(single)},{levels}
?? 單層頁表大小,層數
---
offset {off} 位，頁號 {vpn} 位。單層：$2^{{{vpn}}}$ 項 × {pte} bytes＝{sz(single)}。一頁能放 ${pg}/{pte}={per}=2^{{{bpl}}}$ 項，每層吃掉 {bpl} 位頁號，$\\lceil{vpn}/{bpl}\\rceil={levels}$ 層。層數越多，TLB miss 時要讀的頁表也越多。
""")
    cnt+=1
# RAID capacities
if want('raid'):
  cnt=0
  while cnt<n:
    k=random.choice([4,6,8,10,12]); sz=random.choice([2,4,8,12,16])
    if (k,sz) in [(6,2),(8,4),(12,16),(4,1),(5,2)]: continue
    out.append(f"""@q st2-? | os-storage#2 | 2 | 計算
{k} 顆 {sz} TB 的硬碟。RAID 0、RAID 1+0（兩兩鏡像再條帶）、RAID 5、RAID 6 的可用容量各是多少 TB？
== {k*sz},{k*sz//2},{(k-1)*sz},{(k-2)*sz}
?? RAID 0,RAID 1+0,RAID 5,RAID 6
---
RAID 0 全部拿來放資料：${k}\\times{sz}$。RAID 1+0 每份資料存兩份：一半。RAID 5 用一顆的容量放同位元：${k-1}\\times{sz}$。RAID 6 用兩顆：${k-2}\\times{sz}$。能保證承受的故障：0 顆、1 顆（同一對壞兩顆就不行）、1 顆、2 顆。
""")
    cnt+=1
# inode max size
if want('inode'):
  cnt=0
  while cnt<n:
    d=random.choice([10,12,15]); B=random.choice([1024,2048,4096]); p=random.choice([4,8])
    if p==4 and B in (1024,4096): continue
    per=B//p
    lv=random.choice([2,3])
    blocks=d+per+per**2+(per**3 if lv==3 else 0)
    total=blocks*B
    def sz(b):
        for u,nm in [(2**40,'TB'),(2**30,'GB'),(2**20,'MB'),(2**10,'KB')]:
            if b>=u: return f'{b/u:.4g} {nm}'
        return f'{b} bytes'
    out.append(f"""@q st3-? | os-storage#3 | {3 if lv==3 else 2} | 計算
inode 有 {d} 個直接指標、1 個單層間接{'、1 個雙層間接、1 個三層間接' if lv==3 else '、1 個雙層間接'}；區塊 {B//1024} KB、指標 {p} bytes。檔案最多有幾個資料區塊？
== {blocks}
---
每個間接區塊放 ${B}/{p}={per}$ 個指標。直接 {d}、單層 {per}、雙層 ${per}^2={per**2}${('、三層 $'+str(per)+'^3='+str(per**3)+'$') if lv==3 else ''}，共 {blocks} 塊，約 {sz(total)}。
""")
    cnt+=1
# rebuild tree from pre+in -> post
if want('tree'):
  cnt=0
  while cnt<n:
    keys=random.sample('ABCDEFGHIJ',7)
    # random tree via random BST insertion of random order on ranks
    order=random.sample(range(7),7); L={};R={}; root=order[0]
    for x in order[1:]:
        c=root
        while True:
            if x<c:
                if c in L: c=L[c]
                else: L[c]=x; break
            else:
                if c in R: c=R[c]
                else: R[c]=x; break
    lab={i:keys[i] for i in range(7)}
    def pre(x): return [] if x is None else [x]+pre(L.get(x))+pre(R.get(x))
    def ino(x): return [] if x is None else ino(L.get(x))+[x]+ino(R.get(x))
    def post(x): return [] if x is None else post(L.get(x))+post(R.get(x))+[x]
    P=''.join(lab[i] for i in pre(root)); I=''.join(lab[i] for i in ino(root)); Q=''.join(lab[i] for i in post(root))
    out.append(f"""@q bst1-? | ds-bst#1 | 3 | 追蹤
一棵二元樹（7 個節點、名字都不同）的前序是 {P}、中序是 {I}。後序是什麼？
== {Q}
---
前序第一個 {P[0]} 是根；在中序裡找到 {P[0]}，左邊 {I[:I.index(P[0])] or '（空）'} 是左子樹、右邊 {I[I.index(P[0])+1:] or '（空）'} 是右子樹。對左右子樹用同樣的方法遞迴（前序中根之後的前 {I.index(P[0])} 個屬於左子樹）。重建後依「左、右、根」輸出得 {Q}。前序＋中序（或後序＋中序）能唯一決定一棵樹，前序＋後序不行。
""")
    cnt+=1
print('\n'.join(out))

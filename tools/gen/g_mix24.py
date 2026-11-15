import random, sys, math
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
if want('rooms'):
  cnt=0
  while cnt<n:
    iv=[]
    for _ in range(random.randint(6,7)):
        s=random.randint(8,16); e=s+random.randint(1,4); iv.append((s,e))
    ev=sorted([(s,1) for s,e in iv]+[(e,-1) for s,e in iv])
    cur=best=0; at=None
    for t,d in ev:
        cur+=d
        if cur>best: best=cur; at=t
    if best<3: continue
    out.append(f"""@q gd2-? | al-greedy#2 | 2 | 計算
會議時段（開始, 結束）：{'、'.join(f'({s}, {e})' for s,e in iv)}，結束時刻和下一場開始時刻相同可以共用同一間。最少要幾間會議室才能全部排進去？
== {best}
---
把所有開始（+1）和結束（−1）照時間排序（同一時刻先算結束），一路累加，最大值就是答案：在 {at} 點同時有 {best} 場進行。貪婪做法：照開始時間排序，每場放進任何一間已空出來的房間，沒有才開新房間——開的房間數剛好等於最大重疊數，不可能更少。
""")
    cnt+=1
if want('prio'):
  cnt=0
  while cnt<n:
    N=4; arr=sorted(random.sample(range(0,8),N)); arr[0]=0
    bur=[random.randint(2,7) for _ in range(N)]; pr=random.sample(range(1,5),N)
    rem=bur[:]; t=0; fin={}; gantt=[]
    while len(fin)<N:
        av=[i for i in range(N) if arr[i]<=t and i not in fin]
        if not av: t+=1; continue
        i=min(av,key=lambda x:(pr[x],arr[x]))
        if gantt and gantt[-1][0]==i: gantt[-1][2]=t+1
        else: gantt.append([i,t,t+1])
        rem[i]-=1; t+=1
        if rem[i]==0: fin[i]=t
    wt=F(sum(fin[i]-arr[i]-bur[i] for i in range(N)),N)
    if len(gantt)<=N: continue
    out.append(f"""@q sc2-? | os-sched#2 | 3 | 計算
搶占式優先權排程（數字小＝優先權高）：{'、'.join(f'P{i+1}（到達 {arr[i]}、需要 {bur[i]}、優先權 {pr[i]}）' for i in range(N))}。平均等待時間是多少？（可用分數）
== {fr(wt)}
---
甘特圖：{' '.join(f'P{g[0]+1}({g[1]}–{g[2]})' for g in gantt)}。等待＝完成−到達−執行：{'、'.join(f'P{i+1} {fin[i]-arr[i]-bur[i]}' for i in range(N))}，平均 {fr(wt)}。優先權低的行程可能一直被插隊（飢餓），實務上用 aging 慢慢提高它的優先權。
""")
    cnt+=1
if want('cscan'):
  cnt=0
  while cnt<n:
    head=random.randint(40,150); req=random.sample(range(0,200),7)
    if not any(r<head for r in req) or not any(r>head for r in req): continue
    up=sorted(r for r in req if r>=head); dn=sorted(r for r in req if r<head)
    cs=(199-head)+199+(dn[-1] if dn else 0)
    cl=(up[-1]-head)+(up[-1]-dn[0])+(dn[-1]-dn[0])
    out.append(f"""@q st1-? | os-storage#1 | 3 | 計算
磁軌 0～199，磁頭在 {head}、正往大的方向移動。請求：{', '.join(map(str,req))}。C-SCAN（走到 199、跳回 0 再往上）和 C-LOOK（走到最大的請求、跳回最小的請求再往上）的總移動距離各是多少？（跳回去那一趟也算距離）
== {cs},{cl}
?? C-SCAN,C-LOOK
---
往上服務 {', '.join(map(str,up))}；C-SCAN 走到 199（{199-head}）、跳回 0（199）、再服務 {', '.join(map(str,dn))}（{dn[-1]}），共 {cs}。C-LOOK 只走到 {up[-1]}（{up[-1]-head}）、跳到 {dn[0]}（{up[-1]-dn[0]}）、再走到 {dn[-1]}（{dn[-1]-dn[0]}），共 {cl}。兩者都只單方向服務，讓每個請求的等待時間比較平均；LOOK 系列不走到盡頭，省下空跑。
""")
    cnt+=1
if want('clock'):
  cnt=0; seen=set()
  while cnt<n:
    ref=[random.randint(1,5) for _ in range(12)]
    if tuple(ref) in seen: continue
    seen.add(tuple(ref))
    k=3; fr_=[None]*k; use=[0]*k; ptr=0; f=0; log=[]
    for p in ref:
        if p in fr_: use[fr_.index(p)]=1; log.append(f'{p} 命中'); continue
        f+=1
        while fr_[ptr] is not None and use[ptr]==1: use[ptr]=0; ptr=(ptr+1)%k
        fr_[ptr]=p; use[ptr]=1; ptr=(ptr+1)%k
    fifo=[]; ff=0
    for p in ref:
        if p not in fifo:
            ff+=1
            if len(fifo)==k: fifo.pop(0)
            fifo.append(p)
    if f==ff: continue
    out.append(f"""@q vm2-? | os-vm#2 | 3 | 追蹤
3 個 frame，用 clock（second chance）頁替換：載入或用到某頁時把它的 use bit 設成 1；要換頁時指針從目前位置繞，遇到 use＝1 就清成 0 跳過，遇到 use＝0 就換掉它，換完指針前進一格。參考串 {' '.join(map(str,ref))}，一開始 frame 都是空的、指針在第 0 格。page fault 幾次？同一串用 FIFO 是幾次？
== {f},{ff}
?? clock,FIFO
---
照規則模擬，clock 共 {f} 次、FIFO 共 {ff} 次。clock 是 FIFO 加上「最近用過就給第二次機會」，近似 LRU 但只要一個位元；{'這串裡第二次機會讓常用的頁留下來，所以比 FIFO 少' if f<ff else '這串剛好讓第二次機會留錯頁，反而比 FIFO 多——近似演算法不保證每次都比較好'}。
""")
    cnt+=1
if want('buddy'):
  cnt=0
  while cnt<n:
    reqs=[random.choice([20,35,60,70,100,130,200,250,90]) for _ in range(4)]
    free={1024:[0]}; allocs=[]; ok=True
    for r in reqs:
        sz=1
        while sz<r: sz*=2
        cand=sorted(s for s in free if s>=sz and free[s])
        if not cand: ok=False; break
        s=cand[0]; addr=min(free[s]); free[s].remove(addr)
        while s>sz:
            s//=2; free.setdefault(s,[]).append(addr+s)
        allocs.append((r,sz,addr))
    if not ok: continue
    frag=sum(sz-r for r,sz,a in allocs)
    out.append(f"""@q vm4-? | os-vm#4 | 3 | 追蹤
Buddy system，一開始有一整塊 1024 KB（位址 0 起）。依序請求 {', '.join(f'{r} KB' for r in reqs)}：每次把需求向上取到 2 的次方，找最小夠用的空閒塊（同大小取位址最小的），太大就一直對半切，左半繼續切、右半放回空閒。各請求分到的起始位址（KB）依序是？總內部碎片是多少 KB？
== {','.join(str(a) for r,sz,a in allocs)},{frag}
?? 起始位址（逗號隔開）,內部碎片
---
{'；'.join(f'{r} KB→{sz} KB，位址 {a}' for r,sz,a in allocs)}。內部碎片＝{'＋'.join(str(sz-r) for r,sz,a in allocs)}＝{frag} KB。Buddy 的好處是合併快（夥伴的位址只差一個位元），代價是向上取到 2 的次方造成的內部碎片。
""")
    cnt+=1
print(''.join(out))

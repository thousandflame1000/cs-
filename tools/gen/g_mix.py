import random, sys, heapq, itertools
from fractions import Fraction
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
out=[]
# Banker
cnt=0
while cnt<n:
    P=4; R=3
    Max=[[random.randint(1,7) for _ in range(R)] for _ in range(P)]
    Alloc=[[random.randint(0,Max[i][j]) for j in range(R)] for i in range(P)]
    Avail=[random.randint(0,3) for _ in range(R)]
    Need=[[Max[i][j]-Alloc[i][j] for j in range(R)] for i in range(P)]
    work=Avail[:]; fin=[False]*P; seq=[]
    while True:
        prog=False
        for i in range(P):
            if not fin[i] and all(Need[i][j]<=work[j] for j in range(R)):
                work=[work[j]+Alloc[i][j] for j in range(R)]; fin[i]=True; seq.append(i); prog=True; break
        if not prog: break
    if not all(fin) or seq==list(range(P)): continue
    rows='；'.join(f'P{i}：Allocation ({",".join(map(str,Alloc[i]))})、Max ({",".join(map(str,Max[i]))})' for i in range(P))
    out.append(f"""@q dl3-? | os-deadlock#3 | 3 | 追蹤
3 種資源。{rows}。Available ({','.join(map(str,Avail))})。用 Banker 的安全性檢查，每次從 P0 開始找「Need 都不超過 Work」的第一個行程。得到的安全序列是？（例如 P1 P0 P2 P3）
== {' '.join(f'P{i}' for i in seq)}
== {''.join(f'P{i}' for i in seq)}
---
Need＝Max－Allocation：{'；'.join(f'P{i} ({",".join(map(str,Need[i]))})' for i in range(P))}。Work 從 ({','.join(map(str,Avail))}) 開始，每找到一個能做完的行程，就把它的 Allocation 加回 Work。依序 {' → '.join(f'P{i}' for i in seq)}，全部都能完成，所以是安全狀態。
""")
    cnt+=1
# Topological sort smallest label first
cnt=0
while cnt<n:
    V=list(range(1,8)); E=set()
    for _ in range(9):
        u,v=sorted(random.sample(V,2)); E.add((u,v))
    perm=V[:]; random.shuffle(perm); mp=dict(zip(V,perm))
    E2=sorted((mp[u],mp[v]) for u,v in E)
    indeg={v:0 for v in V}
    for u,v in E2: indeg[v]+=1
    h=[v for v in V if indeg[v]==0]; heapq.heapify(h); order=[]
    d=dict(indeg)
    while h:
        x=heapq.heappop(h); order.append(x)
        for u,v in E2:
            if u==x:
                d[v]-=1
                if d[v]==0: heapq.heappush(h,v)
    if len(order)<7: continue
    es='、'.join(f'{u}→{v}' for u,v in E2)
    out.append(f"""@q gr4-? | ds-graph#4 | 2 | 追蹤
有向無環圖 7 個點 1～7，邊：{es}。用 Kahn 演算法做拓撲排序，每次有好幾個入度為 0 的點時，先拿編號最小的。得到的順序是？（空格隔開）
== {' '.join(map(str,order))}
---
一開始入度為 0 的點：{', '.join(str(v) for v in V if indeg[v]==0)}。每拿出一個點，就把它的出邊刪掉、更新鄰居的入度，新變成 0 的加入候選。依「編號最小優先」得到 {' '.join(map(str,order))}。用一般佇列（不排序）也能得到合法的拓撲順序，只是不一定是這一個。
""")
    cnt+=1
# Activity selection
cnt=0
while cnt<n:
    acts=[]
    for i in range(8):
        s=random.randint(0,14); f=s+random.randint(1,5); acts.append((s,f))
    if len(set(f for s,f in acts))<8: continue
    acts=sorted(acts,key=lambda x:x[1])
    sel=[]; last=-1
    for s,f in acts:
        if s>=last: sel.append((s,f)); last=f
    # shortest-first greedy for comparison
    sh=[]; 
    for s,f in sorted(acts,key=lambda x:(x[1]-x[0],x[1])):
        if all(f<=a or s>=b for a,b in sh): sh.append((s,f))
    if len(sh)==len(sel): continue
    rnd=acts[:]; random.shuffle(rnd)
    out.append(f"""@q gd2-? | al-greedy#2 | 3 | 追蹤
8 個活動（開始, 結束）：{'、'.join(f'({s},{f})' for s,f in rnd)}。端點相接不算衝突。用「每次選最早結束、和已選的不衝突」的貪婪，最多能選幾個？如果改成「每次選最短的、和已選的不衝突」，會選到幾個？
== {len(sel)},{len(sh)}
?? 最早結束,最短優先
---
依結束時間排序後依序挑：{'、'.join(f'({s},{f})' for s,f in sel)}，共 {len(sel)} 個，這是最佳。最短優先挑到 {'、'.join(f'({s},{f})' for s,f in sorted(sh))}，只有 {len(sh)} 個：短的活動可能剛好橫跨兩個能並存的活動之間。
""")
    cnt+=1
# Huffman
cnt=0
while cnt<n:
    k=random.choice([5,6]); fr=sorted(random.sample(range(2,40),k),reverse=True)
    h=fr[:]; heapq.heapify(h); merges=[]
    while len(h)>1:
        a=heapq.heappop(h); b=heapq.heappop(h); merges.append(a+b); heapq.heappush(h,a+b)
    tot=sum(merges)
    # tie check: avoid equal values in heap at any time for unique trace
    if len(set(fr+merges))<len(fr)+len(merges): continue
    import math
    fixed=sum(fr)*math.ceil(math.log2(k))
    out.append(f"""@q gd3-? | al-greedy#3 | {3 if k==6 else 2} | 計算
{k} 種字元的出現次數：{'、'.join(f'{chr(97+i)} {f}' for i,f in enumerate(fr))}。Huffman 編碼後總共要幾個位元？固定長度編碼要幾個位元？
== {tot},{fixed}
?? Huffman,固定長度
---
每次合併最小的兩個：依序產生 {'、'.join(map(str,merges))}。總位元數＝所有合併產生的節點之和＝{'+'.join(map(str,merges))}＝{tot}（每個字元的次數乘上它的深度，加起來剛好等於這個和）。固定長度：{k} 種字元要 {math.ceil(math.log2(k))} 位元，共 {sum(fr)}×{math.ceil(math.log2(k))}＝{fixed}。
""")
    cnt+=1
print('\n'.join(out))

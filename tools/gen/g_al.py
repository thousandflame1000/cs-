import random, sys, heapq, itertools
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
out=[]
names='sabcde'
# Dijkstra
cnt=0
while cnt<n:
    V=list(names[:6]); E={}
    for u in V:
        for v in V:
            if u!=v and v!='s' and random.random()<0.35: E[(u,v)]=random.randint(1,9)
    # dijkstra
    d={v:float('inf') for v in V}; d['s']=0; done=[]; pq=[(0,'s')]
    while pq:
        du,u=heapq.heappop(pq)
        if u in done: continue
        done.append(u)
        for (a,b),w in E.items():
            if a==u and du+w<d[b]: d[b]=du+w; heapq.heappush(pq,(d[b],b))
    if any(d[v]==float('inf') for v in V): continue
    # require uniqueness of extraction order (no ties) for clean explanation
    vals=[d[v] for v in V]
    if len(set(vals))<len(vals): continue
    # require at least one update beyond first
    direct=sum(1 for v in V if ('s',v) in E and E[('s',v)]==d[v])
    if direct>=4: continue
    es='、'.join(f'{a}→{b} {w}' for (a,b),w in sorted(E.items()))
    out.append(f"""@q sp2-? | al-sp#2 | 3 | 追蹤
有向圖的邊（權重都是正的）：{es}。從 s 用 Dijkstra 求最短距離。a、b、c、d、e 的距離依序是？
== {','.join(str(d[v]) for v in 'abcde')}
?? a,b,c,d,e
---
每次取出距離最小、還沒確定的點，鬆弛它的出邊。取出順序：{' → '.join(f'{v}({d[v]})' for v in done)}。權重都非負，所以點一被取出，它的距離就不會再變小。
""")
    cnt+=1
# Kruskal
cnt=0
while cnt<n:
    V=list('abcdef'); ws=random.sample(range(1,20),9)
    edges=set()
    while len(edges)<9:
        u,v=sorted(random.sample(V,2)); edges.add((u,v))
    edges=sorted(edges); E=list(zip(edges,ws))
    par={v:v for v in V}
    def f(x):
        while par[x]!=x: x=par[x]
        return x
    take=[];skip=[]
    for (u,v),w in sorted(E,key=lambda x:x[1]):
        if f(u)!=f(v): par[f(u)]=f(v); take.append(((u,v),w))
        else: skip.append(((u,v),w))
    if len(take)!=5: continue
    tot=sum(w for _,w in take)
    es='、'.join(f'{u}–{v} {w}' for (u,v),w in E)
    out.append(f"""@q mf1-? | al-mst-flow#1 | 2 | 追蹤
無向圖 6 個點 a～f，邊和權重：{es}。最小生成樹的總權重是多少？
== {tot}
---
Kruskal：權重由小到大看，不形成環就加入。加入 {'、'.join(f'{u}–{v}({w})' for (u,v),w in take)}，共 5 條（6 個點）；{('跳過 ' + '、'.join(f'{u}–{v}({w})' for (u,v),w in skip if w<take[-1][1]) + '（兩端已連通）；') if any(w<take[-1][1] for _,w in skip) else ''}總權重 {tot}。邊權重互不相同，所以 MST 唯一。
""")
    cnt+=1
# LCS & edit distance
def lcs(x,y):
    m,n_=len(x),len(y); L=[[0]*(n_+1) for _ in range(m+1)]
    for i in range(m):
        for j in range(n_):
            L[i+1][j+1]=L[i][j]+1 if x[i]==y[j] else max(L[i][j+1],L[i+1][j])
    i,j=m,n_; s=''
    while i and j:
        if x[i-1]==y[j-1]: s=x[i-1]+s; i-=1; j-=1
        elif L[i-1][j]>=L[i][j-1]: i-=1
        else: j-=1
    return L[m][n_],s
def ed(x,y):
    D=[[0]*(len(y)+1) for _ in range(len(x)+1)]
    for i in range(len(x)+1): D[i][0]=i
    for j in range(len(y)+1): D[0][j]=j
    for i in range(1,len(x)+1):
        for j in range(1,len(y)+1):
            D[i][j]=min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(x[i-1]!=y[j-1]))
    return D[-1][-1]
cnt=0
while cnt<n:
    x=''.join(random.choice('ABCD') for _ in range(random.choice([6,7])))
    y=''.join(random.choice('ABCD') for _ in range(random.choice([6,7])))
    l,s=lcs(x,y); e=ed(x,y)
    if l<3: continue
    out.append(f"""@q dp2-? | al-dp#2 | 3 | 計算
$X=$ `{x}`、$Y=$ `{y}`。LCS 的長度、編輯距離（插入、刪除、替換各算 1）各是多少？
== {l},{e}
?? LCS 長度,編輯距離
---
LCS 表 $L[i][j]$：字元相同取左上 +1，否則取左、上較大者；最後一格 {l}，其中一個 LCS 是 `{s}`。編輯距離表 $D[i][j]=\\min(D[i-1][j]+1,\\ D[i][j-1]+1,\\ D[i-1][j-1]+[x_i\\ne y_j])$，第一列、第一行是 $0,1,2,\\dots$；最後一格 {e}。兩者有關係：只用插入和刪除時，距離是 ${len(x)}+{len(y)}-2\\times{l}={len(x)+len(y)-2*l}$；允許替換後可能更小。
""")
    cnt+=1
# 0/1 knapsack
cnt=0
while cnt<n:
    k=5; W=random.choice([10,11,12,13,15])
    items=[(random.randint(2,7),random.randint(3,20)) for _ in range(k)]
    best=(0,()); 
    for r in range(k+1):
        for c in itertools.combinations(range(k),r):
            w=sum(items[i][0] for i in c); v=sum(items[i][1] for i in c)
            if w<=W and v>best[0]: best=(v,c)
    # greedy by density
    order=sorted(range(k),key=lambda i:-items[i][1]/items[i][0]); g=0; cap=W; gi=[]
    for i in order:
        if items[i][0]<=cap: cap-=items[i][0]; g+=items[i][1]; gi.append(i)
    if g==best[0]: continue
    its='、'.join(f'{chr(65+i)}（重 {w}、價 {v}）' for i,(w,v) in enumerate(items))
    out.append(f"""@q gd4-? | al-greedy#4 | 3 | 計算
0/1 背包容量 {W}，物品 {its}。最大總價值是多少？「依價值／重量由大到小、放得下就拿」的貪婪得到多少？
== {best[0]},{g}
?? 最大總價值,貪婪
---
最佳：拿 {'、'.join(chr(65+i) for i in best[1])}，重量 {sum(items[i][0] for i in best[1])}、價值 {best[0]}（可用 DP $dp[i][w]=\\max(dp[i-1][w],\\ dp[i-1][w-w_i]+v_i)$ 算出）。貪婪依單位價值的順序 {'、'.join(chr(65+i) for i in order)}，拿到 {'、'.join(chr(65+i) for i in gi)}，價值 {g}。0/1 背包不能切開物品，貪婪不保證最佳。
""")
    cnt+=1
print('\n'.join(out))

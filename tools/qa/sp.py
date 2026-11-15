import heapq, itertools
INF=float('inf')
def dijkstra(V,E,s):
    G={v:[] for v in V}
    for u,v,w in E: G[u].append((v,w))
    d={v:INF for v in V}; d[s]=0; done=[]; S=set(); par={s:None}
    h=[(0,s)]
    while h:
        du,u=heapq.heappop(h)
        if u in S: continue
        S.add(u); done.append((u,du))
        for v,w in sorted(G[u]):
            if du+w<d[v]: d[v]=du+w; par[v]=u; heapq.heappush(h,(d[v],v))
    return d,done,par
def bellman(V,E,s,order=None):
    d={v:INF for v in V}; d[s]=0; rounds=[]
    E=order or E
    for i in range(len(V)-1):
        ch=False
        for u,v,w in E:
            if d[u]+w<d[v]: d[v]=d[u]+w; ch=True
        rounds.append(dict(d))
        if not ch: break
    neg=any(d[u]+w<d[v] for u,v,w in E)
    return d,rounds,neg
def floyd(V,E):
    idx={v:i for i,v in enumerate(V)}; n=len(V)
    D=[[0 if i==j else INF for j in range(n)] for i in range(n)]
    for u,v,w in E: D[idx[u]][idx[v]]=min(D[idx[u]][idx[v]],w)
    steps=[ [row[:] for row in D] ]
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if D[i][k]+D[k][j]<D[i][j]: D[i][j]=D[i][k]+D[k][j]
        steps.append([row[:] for row in D])
    return steps
def dag_sp(V,E,s,topo):
    d={v:INF for v in V}; d[s]=0
    G={v:[] for v in V}
    for u,v,w in E: G[u].append((v,w))
    for u in topo:
        for v,w in G[u]:
            if d[u]+w<d[v]: d[v]=d[u]+w
    return d
def dijkstra_strict(V,E,s):
    G={v:[] for v in V}
    for u,v,w in E: G[u].append((v,w))
    d={v:INF for v in V}; d[s]=0; S=[]; Q=set(V)
    while Q:
        u=min(Q,key=lambda x:(d[x],x)); Q.remove(u); S.append(u)
        for v,w in G[u]:
            if v in Q and d[u]+w<d[v]: d[v]=d[u]+w
    return d,S

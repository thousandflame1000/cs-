import heapq
from collections import deque
def kruskal(V,E):
    p={v:v for v in V}
    def f(x):
        while p[x]!=x: x=p[x]
        return x
    out=[]
    for w,u,v in sorted((w,u,v) for u,v,w in E):
        a,b=f(u),f(v)
        if a!=b: p[a]=b; out.append((u,v,w))
    return out
def prim(V,E,s):
    G={v:[] for v in V}
    for u,v,w in E: G[u].append((w,v)); G[v].append((w,u))
    seen={s}; h=[(w,s,v) for w,v in G[s]]; heapq.heapify(h); out=[]
    while h:
        w,u,v=heapq.heappop(h)
        if v in seen: continue
        seen.add(v); out.append((u,v,w))
        for w2,x in G[v]:
            if x not in seen: heapq.heappush(h,(w2,v,x))
    return out
def maxflow(V,E,s,t):
    cap={}
    for u,v,c in E: cap[(u,v)]=cap.get((u,v),0)+c; cap.setdefault((v,u),0)
    adj={v:set() for v in V}
    for (u,v) in cap: adj[u].add(v)
    flow=0; paths=[]
    while True:
        par={s:None}; q=deque([s])
        while q and t not in par:
            u=q.popleft()
            for v in sorted(adj[u]):
                if v not in par and cap[(u,v)]>0: par[v]=u; q.append(v)
        if t not in par: break
        b=float('inf'); v=t; path=[t]
        while par[v] is not None: b=min(b,cap[(par[v],v)]); v=par[v]; path.append(v)
        v=t
        while par[v] is not None: cap[(par[v],v)]-=b; cap[(v,par[v])]+=b; v=par[v]
        flow+=b; paths.append((''.join(reversed(path)),b))
    # min cut: reachable from s
    R={s}; q=deque([s])
    while q:
        u=q.popleft()
        for v in adj[u]:
            if v not in R and cap[(u,v)]>0: R.add(v); q.append(v)
    return flow,paths,R

from collections import deque, defaultdict
def mk(edges, directed=False, nodes=None):
    G=defaultdict(list); V=set(nodes or [])
    for u,v in edges:
        G[u].append(v); V|={u,v}
        if not directed: G[v].append(u)
    for u in G: G[u].sort()
    for v in V: G[v]
    return G, sorted(V)
def bfs(G,s):
    d={s:0}; par={s:None}; order=[s]; q=deque([s])
    while q:
        u=q.popleft()
        for v in G[u]:
            if v not in d: d[v]=d[u]+1; par[v]=u; order.append(v); q.append(v)
    return d,par,order
def dfs(G,V,directed=True,start_order=None):
    color={v:'W' for v in V}; d={}; f={}; t=[0]; cls={}; par={}
    def visit(u):
        color[u]='G'; t[0]+=1; d[u]=t[0]
        for v in G[u]:
            if not directed and par.get(u)==v and (u,v) not in cls and (v,u) in cls: continue
            if color[v]=='W': cls[(u,v)]='T'; par[v]=u; visit(v)
            elif color[v]=='G':
                if directed or (v,u) not in cls: cls[(u,v)]='B'
            else:
                if directed: cls[(u,v)]='F' if d[u]<d[v] else 'C'
        color[u]='B'; t[0]+=1; f[u]=t[0]
    for u in (start_order or V):
        if color[u]=='W': visit(u)
    return d,f,cls,par
def kahn(G,V):
    indeg={v:0 for v in V}
    for u in V:
        for v in G[u]: indeg[v]+=1
    import heapq
    h=[v for v in V if indeg[v]==0]; heapq.heapify(h); out=[]
    while h:
        u=heapq.heappop(h); out.append(u)
        for v in G[u]:
            indeg[v]-=1
            if indeg[v]==0: heapq.heappush(h,v)
    return out
def count_topo(G,V):
    import itertools
    pos=lambda p:{v:i for i,v in enumerate(p)}
    c=0
    for p in itertools.permutations(V):
        P=pos(p)
        if all(P[u]<P[v] for u in V for v in G[u]): c+=1
    return c
def kosaraju(G,V):
    d,f,_,_=dfs(G,V)
    GT={v:[] for v in V}
    for u in V:
        for v in G[u]: GT[v].append(u)
    for u in GT: GT[u].sort()
    order=sorted(V,key=lambda v:-f[v]); seen=set(); comps=[]
    for s in order:
        if s in seen: continue
        st=[s]; seen.add(s); comp=[]
        while st:
            u=st.pop(); comp.append(u)
            for v in GT[u]:
                if v not in seen: seen.add(v); st.append(v)
        comps.append(sorted(comp))
    return comps,f,order
def artic(G,V,root):
    d={}; low={}; par={root:None}; t=[0]; ap=set(); br=[]; children={}
    def go(u):
        t[0]+=1; d[u]=low[u]=t[0]; ch=0
        for v in G[u]:
            if v not in d:
                par[v]=u; ch+=1; go(v); low[u]=min(low[u],low[v])
                if par[u] is not None and low[v]>=d[u]: ap.add(u)
                if low[v]>d[u]: br.append((u,v))
            elif v!=par[u]: low[u]=min(low[u],d[v])
        children[u]=ch
        if par[u] is None and ch>=2: ap.add(u)
    go(root); return d,low,sorted(ap),br

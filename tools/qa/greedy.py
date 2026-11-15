import heapq, itertools
def actsel(acts):
    acts=sorted(acts,key=lambda x:(x[1],x[0])); out=[]; end=-1
    for s,f in acts:
        if s>=end: out.append((s,f)); end=f
    return out
def maxoverlap(acts):
    ev=[]
    for s,f in acts: ev+= [(s,1),(f,-1)]
    ev.sort(key=lambda x:(x[0],x[1])); c=m=0
    for _,d in ev: c+=d; m=max(m,c)
    return m
def huffman(freq):
    h=[(f,i,{c:''}) for i,(c,f) in enumerate(freq.items())]; heapq.heapify(h); cnt=len(h)
    merges=[]
    while len(h)>1:
        f1,_,a=heapq.heappop(h); f2,_,b=heapq.heappop(h)
        d={c:'0'+v for c,v in a.items()}; d.update({c:'1'+v for c,v in b.items()})
        merges.append(f1+f2); cnt+=1; heapq.heappush(h,(f1+f2,cnt,d))
    codes=h[0][2]; total=sum(freq[c]*len(codes[c]) for c in freq)
    return {c:len(v) for c,v in codes.items()}, total, merges
def fracknap(items,W):
    items=sorted(items,key=lambda x:-x[1]/x[0]); val=0
    for w,v in items:
        take=min(w,W); val+=v*take/w; W-=take
        if W==0: break
    return val
def greedy_coins(c,A):
    n=0
    for x in sorted(c,reverse=True): n+=A//x; A%=x
    return n
def opt_coins(c,A):
    INF=10**9; d=[0]+[INF]*A
    for a in range(1,A+1):
        for x in c:
            if x<=a: d[a]=min(d[a],d[a-x]+1)
    return d[A]

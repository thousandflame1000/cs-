def fcfs(P):  # P: list of (name, arrival, burst)
    t=0; res={}; seg=[]
    for n,a,b in sorted(P,key=lambda x:(x[1],x[0])):
        t=max(t,a); seg.append((n,t,t+b)); res[n]=(t+b-a, t+b-a-b, t-a); t+=b
    return res,seg
def sjf(P, preempt=False):
    t=0; rem={n:b for n,a,b in P}; arr={n:a for n,a,b in P}; bur=dict(rem); done={}; first={}; seg=[]
    while len(done)<len(P):
        ready=[n for n in rem if arr[n]<=t and n not in done]
        if not ready: t=min(arr[n] for n in rem if n not in done); continue
        n=min(ready,key=lambda x:(rem[x],arr[x],x))
        first.setdefault(n,t)
        if preempt:
            nxt=[arr[m] for m in rem if arr[m]>t and m not in done]
            run=min([rem[n]]+[x-t for x in nxt])
        else: run=rem[n]
        if seg and seg[-1][0]==n and seg[-1][2]==t: seg[-1]=(n,seg[-1][1],t+run)
        else: seg.append((n,t,t+run))
        t+=run; rem[n]-=run
        if rem[n]==0: done[n]=t
    return {n:(done[n]-arr[n], done[n]-arr[n]-bur[n], first[n]-arr[n]) for n in done}, seg
def rr(P,q):
    from collections import deque
    arr=sorted(P,key=lambda x:(x[1],x[0])); rem={n:b for n,a,b in P}; A={n:a for n,a,b in P}; B=dict(rem)
    t=0; Q=deque(); i=0; done={}; first={}; seg=[]
    def admit(upto):
        nonlocal i
        while i<len(arr) and arr[i][1]<=upto: Q.append(arr[i][0]); i+=1
    admit(0)
    while len(done)<len(P):
        if not Q: t=arr[i][1]; admit(t); continue
        n=Q.popleft(); first.setdefault(n,t); run=min(q,rem[n])
        seg.append((n,t,t+run)); t+=run; rem[n]-=run
        admit(t)
        if rem[n]: Q.append(n)
        else: done[n]=t
    return {n:(done[n]-A[n], done[n]-A[n]-B[n], first[n]-A[n]) for n in done}, seg
def prio(P, preempt=False):  # P: (name, arrival, burst, priority) smaller=higher
    t=0; rem={n:b for n,a,b,p in P}; arr={n:a for n,a,b,p in P}; pr={n:p for n,a,b,p in P}; bur=dict(rem); done={}; seg=[]
    while len(done)<len(P):
        ready=[n for n in rem if arr[n]<=t and n not in done]
        if not ready: t=min(arr[n] for n in rem if n not in done); continue
        n=min(ready,key=lambda x:(pr[x],arr[x],x))
        if preempt:
            nxt=[arr[m] for m in rem if arr[m]>t and m not in done]
            run=min([rem[n]]+[x-t for x in nxt])
        else: run=rem[n]
        seg.append((n,t,t+run)); t+=run; rem[n]-=run
        if rem[n]==0: done[n]=t
    return {n:(done[n]-arr[n], done[n]-arr[n]-bur[n]) for n in done}, seg
def avg(res,k): return sum(v[k] for v in res.values())/len(res)
def pr_fifo(ref,f):
    mem=[]; faults=0
    for p in ref:
        if p in mem: continue
        faults+=1
        if len(mem)==f: mem.pop(0)
        mem.append(p)
    return faults
def pr_lru(ref,f):
    mem=[]; faults=0
    for p in ref:
        if p in mem: mem.remove(p); mem.append(p); continue
        faults+=1
        if len(mem)==f: mem.pop(0)
        mem.append(p)
    return faults
def pr_opt(ref,f):
    mem=[]; faults=0
    for i,p in enumerate(ref):
        if p in mem: continue
        faults+=1
        if len(mem)<f: mem.append(p); continue
        fut=ref[i+1:]
        v=max(mem,key=lambda x:(fut.index(x) if x in fut else 10**9))
        mem[mem.index(v)]=p
    return faults
def pr_clock(ref,f):
    frames=[None]*f; use=[0]*f; hand=0; faults=0
    for p in ref:
        if p in frames: use[frames.index(p)]=1; continue
        faults+=1
        while True:
            if frames[hand] is None or use[hand]==0:
                frames[hand]=p; use[hand]=1; hand=(hand+1)%f; break
            use[hand]=0; hand=(hand+1)%f
    return faults
def disk(reqs,head,alg,lo=0,hi=199,direction='up'):
    r=list(reqs); pos=head; total=0; order=[]
    if alg=='FCFS':
        for x in r: total+=abs(x-pos); pos=x; order.append(x)
    elif alg=='SSTF':
        while r:
            x=min(r,key=lambda y:(abs(y-pos),y)); total+=abs(x-pos); pos=x; order.append(x); r.remove(x)
    elif alg in ('SCAN','LOOK','CSCAN','CLOOK'):
        up=sorted(x for x in r if x>=pos); down=sorted((x for x in r if x<pos),reverse=True)
        if direction=='up':
            seq=up
            if alg=='SCAN':
                order=up+down; end=hi if down else (up[-1] if up else pos)
                total=(end-pos)+((end-down[-1]) if down else 0)
                return total,order
            if alg=='LOOK':
                order=up+down; total=((up[-1]-pos) if up else 0)
                if down: total+=((up[-1] if up else pos)-down[-1])
                return total,order
            if alg=='CSCAN':
                d2=sorted(x for x in r if x<pos); order=up+d2
                total=(hi-pos)+(hi-lo)+((d2[-1]-lo) if d2 else 0)
                return total,order
            if alg=='CLOOK':
                d2=sorted(x for x in r if x<pos); order=up+d2
                total=((up[-1]-pos) if up else 0)+(((up[-1] if up else pos)-d2[0])+(d2[-1]-d2[0]) if d2 else 0)
                return total,order
    return total,order
def safe(avail,alloc,need):
    n=len(alloc); work=list(avail); fin=[False]*n; seq=[]
    while True:
        prog=False
        for i in range(n):
            if not fin[i] and all(need[i][j]<=work[j] for j in range(len(work))):
                work=[work[j]+alloc[i][j] for j in range(len(work))]; fin[i]=True; seq.append(i); prog=True
        if not prog: break
    return all(fin),seq
def fits(holes,reqs,mode):
    H=list(holes); out=[]; nxt=0
    for r in reqs:
        cand=[i for i,h in enumerate(H) if h>=r]
        if not cand: out.append(None); continue
        if mode=='first': i=cand[0]
        elif mode=='best': i=min(cand,key=lambda k:(H[k],k))
        elif mode=='worst': i=max(cand,key=lambda k:(H[k],-k))
        elif mode=='next':
            order=list(range(nxt,len(H)))+list(range(0,nxt)); i=next(k for k in order if H[k]>=r); nxt=i
        H[i]-=r; out.append(i)
    return out,H
def rt_sim(tasks, policy, H=None):
    # tasks: list of (name, period, exec); deadlines = period
    import math
    from functools import reduce
    if H is None: H=reduce(lambda a,b:a*b//math.gcd(a,b),[p for _,p,_ in tasks])
    jobs=[]; miss=[]; timeline=[]
    for t in range(H):
        for n,p,c in tasks:
            if t%p==0: jobs.append([n,t,t+p,c,p])
        jobs=[j for j in jobs if j[3]>0]
        for j in jobs:
            if j[2]<=t and j[3]>0: miss.append((j[0],j[2]))
        jobs=[j for j in jobs if j[2]>t]
        if jobs:
            if policy=='RM': j=min(jobs,key=lambda j:(j[4],j[1]))
            else: j=min(jobs,key=lambda j:(j[2],j[4]))
            j[3]-=1; timeline.append(j[0])
        else: timeline.append('-')
    for j in jobs:
        if j[3]>0: miss.append((j[0],j[2]))
    return miss, ''.join(timeline)

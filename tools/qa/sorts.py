def inversions(a): return sum(1 for i in range(len(a)) for j in range(i+1,len(a)) if a[i]>a[j])
def insertion_trace(a,key=lambda x:x):
    a=list(a); states=[]; comps=0; shifts=0
    for i in range(1,len(a)):
        x=a[i]; j=i-1
        while j>=0:
            comps+=1
            if key(a[j])>key(x): a[j+1]=a[j]; shifts+=1; j-=1
            else: break
        a[j+1]=x; states.append(list(a))
    return states,comps,shifts
def selection_trace(a,key=lambda x:x):
    a=list(a); states=[]; swaps=0
    for i in range(len(a)-1):
        m=i
        for j in range(i+1,len(a)):
            if key(a[j])<key(a[m]): m=j
        if m!=i: a[i],a[m]=a[m],a[i]; swaps+=1
        states.append(list(a))
    return states,swaps
def merge(L,R,cnt):
    out=[];i=j=0
    while i<len(L) and j<len(R):
        cnt[0]+=1
        if L[i]<=R[j]: out.append(L[i]); i+=1
        else: out.append(R[j]); j+=1
    return out+L[i:]+R[j:]
def bottom_up(a):
    runs=[[x] for x in a]; levels=[]
    cnt=[0]
    while len(runs)>1:
        nr=[]
        for k in range(0,len(runs),2):
            nr.append(merge(runs[k],runs[k+1],cnt) if k+1<len(runs) else runs[k])
        runs=nr; levels.append([list(r) for r in runs])
    return levels,cnt[0]
def heapsort_trace(a):
    from heap import sink
    a=[None]+list(a); n=len(a)-1; cnt=[0]
    for i in range(n//2,0,-1): sink(a,i,n,cnt)
    states=[a[1:]]
    for end in range(n,1,-1):
        a[1],a[end]=a[end],a[1]; sink(a,1,end-1,cnt); states.append(a[1:])
    return states
def bubble(a):
    a=list(a); sw=0; passes=0
    while True:
        ch=False; passes+=1
        for i in range(len(a)-1):
            if a[i]>a[i+1]: a[i],a[i+1]=a[i+1],a[i]; sw+=1; ch=True
        if not ch: break
    return sw,passes

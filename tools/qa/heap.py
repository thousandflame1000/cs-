import itertools
def sink(a,i,n,cnt):
    while True:
        l,r=2*i,2*i+1; m=i
        if l<=n and a[l]>a[m]: m=l
        if r<=n and a[r]>a[m]: m=r
        if m==i: return
        a[i],a[m]=a[m],a[i]; cnt[0]+=1; i=m
def build(arr):
    a=[None]+list(arr); n=len(arr); cnt=[0]
    for i in range(n//2,0,-1): sink(a,i,n,cnt)
    return a[1:],cnt[0]
def insert(arr,x):
    a=[None]+list(arr)+[x]; i=len(a)-1; c=0
    while i>1 and a[i//2]<a[i]: a[i],a[i//2]=a[i//2],a[i]; i//=2; c+=1
    return a[1:],c
def extract(arr):
    a=[None]+list(arr); n=len(arr); top=a[1]; a[1]=a[n]; a.pop(); n-=1; cnt=[0]
    if n: sink(a,1,n,cnt)
    return top,a[1:],cnt[0]
def isheap(arr):
    a=[None]+list(arr); n=len(arr)
    return all(a[i//2]>=a[i] for i in range(2,n+1))
def by_insert(seq):
    h=[];t=0
    for x in seq: h,c=insert(h,x); t+=c
    return h,t

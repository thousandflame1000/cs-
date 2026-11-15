from fractions import Fraction
import itertools, math
def lomuto(a,p,r,log=None):
    x=a[r]; i=p-1; cmp=0; sw=0
    for j in range(p,r):
        cmp+=1
        if a[j]<=x:
            i+=1
            if i!=j: a[i],a[j]=a[j],a[i]; sw+=1
    if i+1!=r: a[i+1],a[r]=a[r],a[i+1]; sw+=1
    return i+1,cmp,sw
def qsort(a,p=0,r=None,stats=None,depth=0):
    if r is None: r=len(a)-1; stats={'cmp':0,'depth':0,'calls':0}
    if p<r:
        stats['calls']+=1; stats['depth']=max(stats['depth'],depth+1)
        q,c,_=lomuto(a,p,r); stats['cmp']+=c
        qsort(a,p,q-1,stats,depth+1); qsort(a,q+1,r,stats,depth+1)
    return stats
def exp_cmp(n): return sum(Fraction(2,j-i+1) for i in range(1,n+1) for j in range(i+1,n+1))
def rand_exact(n):
    # exact expected comparisons of randomized quicksort by recursion
    from functools import lru_cache
    @lru_cache(None)
    def E(m):
        if m<=1: return Fraction(0)
        return (m-1)+Fraction(1,m)*sum(E(k)+E(m-1-k) for k in range(m))
    return E(n)

import math
def chain(keys,m):
    T=[[] for _ in range(m)]
    for k in keys: T[k%m].insert(0,k)
    return T
def oa_insert(T,k,probe,m):
    for i in range(m):
        j=probe(k,i)
        if T[j] is None or T[j]=='D': T[j]=k; return i+1,j
    return None
def oa_search(T,k,probe,m):
    for i in range(m):
        j=probe(k,i)
        if T[j] is None: return i+1,False
        if T[j]==k: return i+1,True
    return m,False
def build(keys,m,probe):
    T=[None]*m; probes=[]
    for k in keys: probes.append(oa_insert(T,k,probe,m))
    return T,probes

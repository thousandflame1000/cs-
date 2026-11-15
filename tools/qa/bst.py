import itertools
class N:
    __slots__=('k','l','r')
    def __init__(s,k): s.k=k; s.l=None; s.r=None
def ins(t,k):
    if t is None: return N(k)
    if k<t.k: t.l=ins(t.l,k)
    else: t.r=ins(t.r,k)
    return t
def build(seq):
    t=None
    for k in seq: t=ins(t,k)
    return t
def dele(t,k,pred=False):
    if t is None: return None
    if k<t.k: t.l=dele(t.l,k,pred); return t
    if k>t.k: t.r=dele(t.r,k,pred); return t
    if t.l is None: return t.r
    if t.r is None: return t.l
    if pred:
        m=t.l
        while m.r: m=m.r
        t.k=m.k; t.l=dele(t.l,m.k,pred)
    else:
        m=t.r
        while m.l: m=m.l
        t.k=m.k; t.r=dele(t.r,m.k,pred)
    return t
def pre(t): return [] if t is None else [t.k]+pre(t.l)+pre(t.r)
def ino(t): return [] if t is None else ino(t.l)+[t.k]+ino(t.r)
def h(t): return -1 if t is None else 1+max(h(t.l),h(t.r))
def show(t):
    if t is None: return ''
    if t.l is None and t.r is None: return str(t.k)
    return f"{t.k}({show(t.l)},{show(t.r)})"
def path(t,k):
    p=[]
    while t:
        p.append(t.k)
        if k==t.k: break
        t=t.l if k<t.k else t.r
    return p
def validpath(seq,target):
    lo,hi=float('-inf'),float('inf')
    for x in seq[:-1]:
        if not(lo<x<hi): return False
        if target<x: hi=x
        else: lo=x
    return lo<seq[-1]<hi

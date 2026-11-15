import itertools, random
class A:
    __slots__=('k','l','r','h')
    def __init__(s,k): s.k=k; s.l=s.r=None; s.h=0
def H(t): return -1 if t is None else t.h
def upd(t): t.h=1+max(H(t.l),H(t.r))
def bf(t): return H(t.l)-H(t.r)
LOG=[]
def rr(z):  # right rotate
    y=z.l; z.l=y.r; y.r=z; upd(z); upd(y); LOG.append(('R',z.k)); return y
def rl(z):
    y=z.r; z.r=y.l; y.l=z; upd(z); upd(y); LOG.append(('L',z.k)); return y
def fix(t):
    upd(t); b=bf(t)
    if b>1:
        if bf(t.l)<0: LOG.append(('type','LR',t.k)); t.l=rl(t.l)
        else: LOG.append(('type','LL',t.k))
        return rr(t)
    if b<-1:
        if bf(t.r)>0: LOG.append(('type','RL',t.k)); t.r=rr(t.r)
        else: LOG.append(('type','RR',t.k))
        return rl(t)
    return t
def ins(t,k):
    if t is None: return A(k)
    if k<t.k: t.l=ins(t.l,k)
    else: t.r=ins(t.r,k)
    return fix(t)
def dele(t,k):
    if t is None: return None
    if k<t.k: t.l=dele(t.l,k)
    elif k>t.k: t.r=dele(t.r,k)
    else:
        if t.l is None: return t.r
        if t.r is None: return t.l
        m=t.r
        while m.l: m=m.l
        t.k=m.k; t.r=dele(t.r,m.k)
    return fix(t)
def build(seq):
    t=None
    for k in seq: t=ins(t,k)
    return t
def show(t):
    if t is None: return ''
    if t.l is None and t.r is None: return str(t.k)
    return f"{t.k}({show(t.l)},{show(t.r)})"
def pre(t): return [] if t is None else [t.k]+pre(t.l)+pre(t.r)
def trace(seq):
    global LOG
    t=None; out=[]
    for k in seq:
        LOG=[]; t=ins(t,k); out.append((k,[x for x in LOG if x[0]=='type'],show(t)))
    return t,out

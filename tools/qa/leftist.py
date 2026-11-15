class L:
    __slots__=('k','l','r','s')
    def __init__(s,k,l=None,r=None): s.k=k; s.l=l; s.r=r; s.s=1
def S(t): return 0 if t is None else t.s
STEPS=[0]; SWAPS=[0]
def merge(a,b,skew=False):
    if a is None: return b
    if b is None: return a
    if b.k<a.k: a,b=b,a
    STEPS[0]+=1
    a.r=merge(a.r,b,skew)
    if skew:
        a.l,a.r=a.r,a.l; SWAPS[0]+=1
    else:
        if S(a.l)<S(a.r): a.l,a.r=a.r,a.l; SWAPS[0]+=1
        a.s=1+min(S(a.l),S(a.r))
    return a
def ins(t,k,skew=False): return merge(t,L(k),skew)
def build(seq,skew=False):
    t=None
    for k in seq: t=ins(t,k,skew)
    return t
def show(t):
    if t is None: return ''
    if t.l is None and t.r is None: return str(t.k)
    return f"{t.k}({show(t.l)},{show(t.r)})"
def pre(t): return [] if t is None else [t.k]+pre(t.l)+pre(t.r)
def h(t): return -1 if t is None else 1+max(h(t.l),h(t.r))
def parse(s):
    pos=[0]
    import re
    def p():
        if pos[0]>=len(s) or s[pos[0]] in ',)': return None
        m=re.match(r'\d+',s[pos[0]:]); pos[0]+=m.end(); n=L(int(m.group()))
        if pos[0]<len(s) and s[pos[0]]=='(':
            pos[0]+=1; n.l=p(); pos[0]+=1; n.r=p(); pos[0]+=1
        return n
    t=p(); fix(t); return t
def fix(t):
    if t is None: return 0
    a=fix(t.l); b=fix(t.r); t.s=1+min(a,b); return t.s
def leftist_ok(t):
    if t is None: return True
    return S(t.l)>=S(t.r) and leftist_ok(t.l) and leftist_ok(t.r)
def rpath(t):
    c=0
    while t: c+=1; t=t.r
    return c

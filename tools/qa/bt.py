import itertools, functools
def parse(s):
    s=s.replace(' ','')
    def p(i):
        if i>=len(s) or s[i] in ',)': return None,i
        lab=s[i]; i+=1; L=R=None
        if i<len(s) and s[i]=='(':
            L,i=p(i+1); assert s[i]==','; R,i=p(i+1); assert s[i]==')'; i+=1
        return (lab,L,R),i
    return p(0)[0]
def pre(t): return [] if t is None else [t[0]]+pre(t[1])+pre(t[2])
def ino(t): return [] if t is None else ino(t[1])+[t[0]]+ino(t[2])
def post(t): return [] if t is None else post(t[1])+post(t[2])+[t[0]]
def level(t):
    q=[t];o=[]
    while q:
        x=q.pop(0)
        if x: o.append(x[0]); q+= [x[1],x[2]]
    return o
def height(t): return -1 if t is None else 1+max(height(t[1]),height(t[2]))
def build_pi(P,I):
    if not P: return None
    r=P[0];k=I.index(r)
    return (r,build_pi(P[1:k+1],I[:k]),build_pi(P[k+1:],I[k+1:]))
def build_qi(Q,I):
    if not Q: return None
    r=Q[-1];k=I.index(r)
    return (r,build_qi(Q[:k],I[:k]),build_qi(Q[k:-1],I[k+1:]))
@functools.lru_cache(None)
def shapes(n):
    if n==0: return [None]
    out=[]
    for k in range(n):
        for L in shapes(k):
            for R in shapes(n-1-k): out.append(('*',L,R))
    return out
def label_pre(sh,labels):
    it=iter(labels)
    def f(t):
        if t is None: return None
        x=next(it); L=f(t[1]); R=f(t[2]); return (x,L,R)
    return f(sh)
def s(l): return ' '.join(l)
def show(t): 
    if t is None: return ''
    if t[1] is None and t[2] is None: return t[0]
    return f"{t[0]}({show(t[1])},{show(t[2])})"

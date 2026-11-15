import itertools
class R:
    __slots__=('k','c','l','r','p')
    def __init__(s,k,c='R'): s.k=k; s.c=c; s.l=s.r=s.p=None
class T:
    def __init__(s): s.root=None; s.rot=0; s.recolor_steps=0; s.log=[]
    def lrot(s,x):
        y=x.r; x.r=y.l
        if y.l: y.l.p=x
        y.p=x.p
        if not x.p: s.root=y
        elif x is x.p.l: x.p.l=y
        else: x.p.r=y
        y.l=x; x.p=y; s.rot+=1; s.log.append(('L',x.k))
    def rrot(s,x):
        y=x.l; x.l=y.r
        if y.r: y.r.p=x
        y.p=x.p
        if not x.p: s.root=y
        elif x is x.p.r: x.p.r=y
        else: x.p.l=y
        y.r=x; x.p=y; s.rot+=1; s.log.append(('R',x.k))
    def insert(s,k):
        z=R(k); y=None; x=s.root
        while x: y=x; x=x.l if k<x.k else x.r
        z.p=y
        if not y: s.root=z
        elif k<y.k: y.l=z
        else: y.r=z
        s.fix(z)
    def fix(s,z):
        C=lambda n: n.c if n else 'B'
        while z.p and z.p.c=='R':
            g=z.p.p
            if z.p is g.l:
                u=g.r
                if C(u)=='R': z.p.c='B'; u.c='B'; g.c='R'; z=g; s.log.append(('case1',))
                else:
                    if z is z.p.r: z=z.p; s.lrot(z)
                    z.p.c='B'; g.c='R'; s.rrot(g)
            else:
                u=g.l
                if C(u)=='R': z.p.c='B'; u.c='B'; g.c='R'; z=g; s.log.append(('case1',))
                else:
                    if z is z.p.l: z=z.p; s.rrot(z)
                    z.p.c='B'; g.c='R'; s.lrot(g)
        s.root.c='B'
def show(n):
    if n is None: return ''
    t=f"{n.k}{'黑' if n.c=='B' else '紅'}"
    if n.l is None and n.r is None: return t
    return f"{t}({show(n.l)},{show(n.r)})"
def build(seq):
    t=T()
    for k in seq: t.insert(k)
    return t
def valid(n):
    """returns bh (excluding node itself? we return blacks on path incl NIL, incl node) or None"""
    if n is None: return 1
    if n.c=='R':
        for ch in (n.l,n.r):
            if ch and ch.c=='R': return None
    a=valid(n.l); b=valid(n.r)
    if a is None or b is None or a!=b: return None
    return a+(1 if n.c=='B' else 0)
def parse(s):
    # format: 10黑(5紅,...)
    import re
    pos=[0]
    def p():
        if pos[0]>=len(s) or s[pos[0]] in ',)': return None
        m=re.match(r'(\d+)(黑|紅)',s[pos[0]:]); pos[0]+=m.end()
        n=R(int(m.group(1)),'B' if m.group(2)=='黑' else 'R')
        if pos[0]<len(s) and s[pos[0]]=='(':
            pos[0]+=1; n.l=p(); pos[0]+=1; n.r=p(); pos[0]+=1
        return n
    return p()
def ok(s):
    n=parse(s)
    if n.c!='B': return 'root red'
    v=valid(n); return v

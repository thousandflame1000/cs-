class S:
    __slots__=('k','l','r','p')
    def __init__(s,k): s.k=k; s.l=s.r=s.p=None
class ST:
    def __init__(s): s.root=None; s.rots=0
    def rot(s,x):
        p=x.p; g=p.p
        if x is p.l:
            p.l=x.r
            if x.r: x.r.p=p
            x.r=p
        else:
            p.r=x.l
            if x.l: x.l.p=p
            x.l=p
        p.p=x; x.p=g
        if g is None: s.root=x
        elif g.l is p: g.l=x
        else: g.r=x
        s.rots+=1
    def splay(s,x):
        steps=[]
        while x.p:
            p=x.p; g=p.p
            if g is None: s.rot(x); steps.append('zig')
            elif (x is p.l)==(p is g.l): s.rot(p); s.rot(x); steps.append('zig-zig')
            else: s.rot(x); s.rot(x); steps.append('zig-zag')
        return steps
    def insert_plain(s,k):  # BST insert without splaying
        z=S(k); y=None; x=s.root
        while x: y=x; x=x.l if k<x.k else x.r
        z.p=y
        if not y: s.root=z
        elif k<y.k: y.l=z
        else: y.r=z
        return z
    def find(s,k):
        x=s.root; last=None; d=0
        while x:
            last=x
            if k==x.k: break
            x=x.l if k<x.k else x.r; d+=1
        st=s.splay(last); return st,d
def show(n):
    if n is None: return ''
    if n.l is None and n.r is None: return str(n.k)
    return f"{n.k}({show(n.l)},{show(n.r)})"
def pre(n): return [] if n is None else [n.k]+pre(n.l)+pre(n.r)
def depth(n):
    return -1 if n is None else 1+max(depth(n.l),depth(n.r))

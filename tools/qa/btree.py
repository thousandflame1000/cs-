class Node:
    def __init__(s,leaf=True): s.keys=[]; s.ch=[]; s.leaf=leaf
class BT:
    def __init__(s,t): s.t=t; s.root=Node(); s.splits=0
    def split(s,x,i):
        t=s.t; y=x.ch[i]; z=Node(y.leaf)
        mid=y.keys[t-1]
        z.keys=y.keys[t:]; y.keys=y.keys[:t-1]
        if not y.leaf: z.ch=y.ch[t:]; y.ch=y.ch[:t]
        x.ch.insert(i+1,z); x.keys.insert(i,mid); s.splits+=1
    def insert(s,k):
        r=s.root
        if len(r.keys)==2*s.t-1:
            n=Node(False); n.ch=[r]; s.root=n; s.split(n,0); s._ins(n,k)
        else: s._ins(r,k)
    def _ins(s,x,k):
        if x.leaf:
            import bisect; bisect.insort(x.keys,k); return
        i=len(x.keys)
        while i>0 and k<x.keys[i-1]: i-=1
        if len(x.ch[i].keys)==2*s.t-1:
            s.split(x,i)
            if k>x.keys[i]: i+=1
        s._ins(x.ch[i],k)
    def show(s,x=None):
        x=x or s.root
        if x.leaf: return '['+','.join(map(str,x.keys))+']'
        return '['+','.join(map(str,x.keys))+']('+' '.join(s.show(c) for c in x.ch)+')'
    def height(s):
        h=0;x=s.root
        while not x.leaf: x=x.ch[0]; h+=1
        return h
    # CLRS delete
    def delete(s,k): s._del(s.root,k); 
    def _del(s,x,k):
        t=s.t
        if k in x.keys:
            i=x.keys.index(k)
            if x.leaf: x.keys.pop(i); s.log.append('case1'); return
            y,z=x.ch[i],x.ch[i+1]
            if len(y.keys)>=t:
                p=y
                while not p.leaf: p=p.ch[-1]
                pk=p.keys[-1]; x.keys[i]=pk; s.log.append('case2a'); s._del(y,pk)
            elif len(z.keys)>=t:
                q=z
                while not q.leaf: q=q.ch[0]
                sk=q.keys[0]; x.keys[i]=sk; s.log.append('case2b'); s._del(z,sk)
            else:
                y.keys+= [x.keys.pop(i)]+z.keys; y.ch+=z.ch; x.ch.pop(i+1); s.log.append('case2c')
                if x is s.root and not x.keys: s.root=y
                s._del(y,k)
        else:
            if x.leaf: return
            i=0
            while i<len(x.keys) and k>x.keys[i]: i+=1
            c=x.ch[i]
            if len(c.keys)==t-1:
                L=x.ch[i-1] if i>0 else None; R=x.ch[i+1] if i+1<len(x.ch) else None
                if L and len(L.keys)>=t:
                    c.keys.insert(0,x.keys[i-1]); x.keys[i-1]=L.keys.pop()
                    if not L.leaf: c.ch.insert(0,L.ch.pop())
                    s.log.append('case3a-left')
                elif R and len(R.keys)>=t:
                    c.keys.append(x.keys[i]); x.keys[i]=R.keys.pop(0)
                    if not R.leaf: c.ch.append(R.ch.pop(0))
                    s.log.append('case3a-right')
                else:
                    if R:
                        c.keys+= [x.keys.pop(i)]+R.keys; c.ch+=R.ch; x.ch.pop(i+1)
                    else:
                        L.keys+= [x.keys.pop(i-1)]+c.keys; L.ch+=c.ch; x.ch.pop(i); c=L
                    s.log.append('case3b')
                    if x is s.root and not x.keys: s.root=c
            s._del(c,k)

class UF:
    def __init__(s,items,rank=True,comp=False):
        s.p={x:x for x in items}; s.r={x:0 for x in items}; s.rank=rank; s.comp=comp; s.steps=0
    def find(s,x):
        path=[]
        while s.p[x]!=x: path.append(x); x=s.p[x]; s.steps+=1
        if s.comp:
            for y in path: s.p[y]=x
        return x
    def union(s,a,b):
        ra,rb=s.find(a),s.find(b)
        if ra==rb: return False
        if not s.rank: s.p[rb]=ra; return True   # second root under first
        if s.r[ra]<s.r[rb]: s.p[ra]=rb
        elif s.r[ra]>s.r[rb]: s.p[rb]=ra
        else: s.p[rb]=ra; s.r[ra]+=1
        return True
    def depth(s,x):
        d=0
        while s.p[x]!=x: x=s.p[x]; d+=1
        return d

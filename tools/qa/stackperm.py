from itertools import permutations
def ok(p):
    st=[];i=1
    for x in p:
        while i<=x: st.append(i); i+=1
        if st[-1]!=x: return False
        st.pop()
    return True
def ops(p):
    st=[];i=1;o=[]
    for x in p:
        while i<=x: st.append(i); o.append('S'); i+=1
        if not st or st[-1]!=x: return None
        st.pop(); o.append('X')
    return ''.join(o)
import sys
for n in range(1,8): print(n, sum(ok(p) for p in permutations(range(1,n+1))))
for s in sys.argv[1:]:
    p=tuple(int(c) for c in s); print(s, ok(p), ops(p))

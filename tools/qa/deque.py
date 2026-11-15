from itertools import permutations
def gen(n, ins_both, del_both):
    res=set()
    def rec(i, dq, out):
        if len(out)==n: res.add(tuple(out)); return
        if i<=n:
            rec(i+1, dq+[i], out)
            if ins_both: rec(i+1, [i]+dq, out)
        if dq:
            rec(i, dq[:-1], out+[dq[-1]])
            if del_both: rec(i, dq[1:], out+[dq[0]])
    rec(1, [], [])
    return res
n=4
inr=gen(n,False,True); outr=gen(n,True,False)
allp=set(permutations(range(1,n+1)))
print('input-restricted cannot:', sorted(''.join(map(str,p)) for p in allp-inr))
print('output-restricted cannot:', sorted(''.join(map(str,p)) for p in allp-outr))
print('both cannot:', sorted(''.join(map(str,p)) for p in allp-inr-outr))

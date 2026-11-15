from fractions import Fraction as Fr
import numpy as np, itertools
def M(rows): return [[Fr(x) for x in r] for r in rows]
def rref(A):
    A=[r[:] for r in M(A)]; m=len(A); n=len(A[0]); piv=[]; r=0
    for c in range(n):
        p=next((i for i in range(r,m) if A[i][c]!=0),None)
        if p is None: continue
        A[r],A[p]=A[p],A[r]; pv=A[r][c]; A[r]=[x/pv for x in A[r]]
        for i in range(m):
            if i!=r and A[i][c]!=0:
                f=A[i][c]; A[i]=[a-f*b for a,b in zip(A[i],A[r])]
        piv.append(c); r+=1
        if r==m: break
    return A,piv
def rank(A): return len(rref(A)[1])
def det(A):
    A=M(A); n=len(A); d=Fr(1)
    for c in range(n):
        p=next((i for i in range(c,n) if A[i][c]!=0),None)
        if p is None: return Fr(0)
        if p!=c: A[c],A[p]=A[p],A[c]; d=-d
        d*=A[c][c]
        for i in range(c+1,n):
            f=A[i][c]/A[c][c]; A[i]=[a-f*b for a,b in zip(A[i],A[c])]
    return d
def inv(A):
    n=len(A); aug=[list(r)+[1 if i==j else 0 for j in range(n)] for i,r in enumerate(A)]
    R,_=rref(aug); return [r[n:] for r in R]
def show(A): return [[str(x) for x in r] for r in A]
def eig(A): return np.round(np.linalg.eigvals(np.array(A,dtype=float)),6)
def mul(A,B): return [[sum(Fr(A[i][k])*Fr(B[k][j]) for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]

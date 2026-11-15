def lcs(a,b):
    n,m=len(a),len(b); C=[[0]*(m+1) for _ in range(n+1)]
    for i in range(1,n+1):
        for j in range(1,m+1):
            C[i][j]=C[i-1][j-1]+1 if a[i-1]==b[j-1] else max(C[i-1][j],C[i][j-1])
    # reconstruct (prefer up on tie like CLRS: if C[i-1][j]>=C[i][j-1] go up)
    i,j=n,m; out=[]
    while i and j:
        if a[i-1]==b[j-1]: out.append(a[i-1]); i-=1; j-=1
        elif C[i-1][j]>=C[i][j-1]: i-=1
        else: j-=1
    return C[n][m],''.join(reversed(out)),C
def edit(a,b):
    n,m=len(a),len(b); D=[[0]*(m+1) for _ in range(n+1)]
    for i in range(n+1): D[i][0]=i
    for j in range(m+1): D[0][j]=j
    for i in range(1,n+1):
        for j in range(1,m+1):
            D[i][j]=min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(a[i-1]!=b[j-1]))
    return D[n][m]
def knap(w,v,W):
    K=[0]*(W+1)
    for wi,vi in zip(w,v):
        for c in range(W,wi-1,-1): K[c]=max(K[c],K[c-wi]+vi)
    return K[W]
def unbounded(w,v,W):
    K=[0]*(W+1)
    for c in range(1,W+1):
        for wi,vi in zip(w,v):
            if wi<=c: K[c]=max(K[c],K[c-wi]+vi)
    return K[W]
def mcm(p):
    n=len(p)-1; M=[[0]*n for _ in range(n)]; S=[[0]*n for _ in range(n)]
    for L in range(2,n+1):
        for i in range(n-L+1):
            j=i+L-1; M[i][j]=10**18
            for k in range(i,j):
                c=M[i][k]+M[k+1][j]+p[i]*p[k+1]*p[j+1]
                if c<M[i][j]: M[i][j]=c; S[i][j]=k
    def par(i,j): return f'A{i+1}' if i==j else '('+par(i,S[i][j])+par(S[i][j]+1,j)+')'
    return M[0][n-1],par(0,n-1)
def lis(a):
    import bisect
    tails=[]; 
    for x in a:
        k=bisect.bisect_left(tails,x)
        if k==len(tails): tails.append(x)
        else: tails[k]=x
    L=[1]*len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[j]<a[i]: L[i]=max(L[i],L[j]+1)
    return len(tails),tails,L
def rodcut(p,n):
    r=[0]*(n+1)
    for j in range(1,n+1): r[j]=max(p[i-1]+r[j-i] for i in range(1,j+1))
    return r

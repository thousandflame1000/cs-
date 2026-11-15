import math
def sim(ops, size=1, grow=lambda s:2*s, shrink=None, shrink_to=lambda s:s//2):
    """ops: string of 'i'/'d'. returns (moves, puts, sizes trace, events)"""
    n=0; moves=0; puts=0; ev=[]
    for k,o in enumerate(ops,1):
        if o=='i':
            if n==size:
                moves+=n; ns=grow(size); ev.append((k,'grow',size,ns,n)); size=ns
            n+=1; puts+=1
        else:
            n-=1
            if shrink and size>1 and shrink(n,size):
                ns=shrink_to(size); moves+=n; ev.append((k,'shrink',size,ns,n)); size=ns
    return moves,puts,size,ev
if __name__=='__main__':
    for n in [9,10,17,33,100,1000]:
        m,p,s,e=sim('i'*n); print('double',n,'moves',m,'total',m+p,'size',s,'expands',len(e))
    m,p,s,e=sim('i'*20,size=4,grow=lambda s:s+4); print('+4 from 4, n=20',m,m+p,s,len(e))
    m,p,s,e=sim('i'*10,grow=lambda s:3*s); print('triple n=10',m,s,e)
    m,p,s,e=sim('i'*28,grow=lambda s:3*s); print('triple n=28',m,s)
    # half-shrink thrash: start 8 full? 
    ops='i'*9+'ddii'*3
    print('half', sim(ops, shrink=lambda n,s:n<s/2))
    print('quarter', sim(ops, shrink=lambda n,s:n<s/4))
    # insert 16 then delete 13
    print(sim('i'*16+'d'*13, shrink=lambda n,s:n<s/4))
    print(sim('i'*16+'d'*13, shrink=lambda n,s:n<s/2))

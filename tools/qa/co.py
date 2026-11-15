import struct, math
def tc(x,n): return format(x & ((1<<n)-1),'0%db'%n)
def from_tc(s): v=int(s,2); n=len(s); return v-(1<<n) if s[0]=='1' else v
def add_flags(a,b,n):
    ua=a&((1<<n)-1); ub=b&((1<<n)-1); s=(ua+ub)&((1<<n)-1); carry=(ua+ub)>>n
    sa=from_tc(tc(a,n)); sb=from_tc(tc(b,n)); ss=from_tc(tc(s,n))
    ovf=(sa>=0)==(sb>=0) and (ss>=0)!=(sa>=0)
    return tc(s,n), carry, ovf
def booth(m,r,n):
    A=0; Q=r&((1<<n)-1); Q_1=0; M=m&((1<<n)-1); steps=[]
    mask=(1<<n)-1
    for _ in range(n):
        pair=(Q&1,Q_1); op='nop'
        if pair==(1,0): A=(A-M)&mask; op='sub'
        elif pair==(0,1): A=(A+M)&mask; op='add'
        # arithmetic shift right A,Q,Q_1
        Q_1=Q&1; Q=((Q>>1)|((A&1)<<(n-1)))&mask; sign=A>>(n-1); A=((A>>1)|(sign<<(n-1)))&mask
        steps.append((op,tc(A,n),tc(Q,n),Q_1))
    res=(A<<n)|Q
    return from_tc(tc(res,2*n)), steps
def f32(x):
    b=struct.unpack('>I',struct.pack('>f',x))[0]; s=format(b,'032b')
    return s[0],s[1:9],s[9:],format(b,'08X')
def bits_to_f(h): return struct.unpack('>f',bytes.fromhex(h))[0]

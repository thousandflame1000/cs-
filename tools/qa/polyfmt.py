import re
def pf(a):
    s=''
    for j,c in enumerate(a):
        if c==0: continue
        mon='' if j==0 else ('x' if j==1 else f'x^{j}')
        if j==0: t=str(abs(c))
        else: t=('' if abs(c)==1 else str(abs(c)))+mon
        if not s: s=('-' if c<0 else '')+t
        else: s+=('+' if c>0 else '-')+t
    return s or '0'

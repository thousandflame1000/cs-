import sys
P={'+':1,'-':1,'*':2,'/':2,'%':2,'^':3}
def topost(s):
    out=[];st=[]
    for t in s.split():
        if t=='(':st.append(t)
        elif t==')':
            while st[-1]!='(':out.append(st.pop())
            st.pop()
        elif t in P:
            while st and st[-1]!='(' and (P[st[-1]]>P[t] or (P[st[-1]]==P[t] and t!='^')):out.append(st.pop())
            st.append(t)
        else:out.append(t)
    while st:out.append(st.pop())
    return ' '.join(out)
def evalpost(s):
    st=[]
    for t in s.split():
        if t in P:
            b=st.pop();a=st.pop();st.append({'+':a+b,'-':a-b,'*':a*b,'/':a//b,'%':a%b,'^':a**b}[t])
        else:st.append(int(t))
    return st[0]
for line in sys.stdin:
    line=line.strip()
    if not line:continue
    k,e=line.split(':',1)
    if k=='p':print(e,'=>',topost(e))
    else:print(e,'=>',evalpost(e))

def topre(s):
    # 反轉法：反轉、括號對調、右結合處理：用遞迴語法樹最穩
    toks=s.split(); pos=0
    def parse(minp):
        nonlocal pos
        t=toks[pos]; pos+=1
        if t=='(':
            node=parse(0); pos+=1
        else: node=t
        while pos<len(toks) and toks[pos] in P and P[toks[pos]]>=minp:
            op=toks[pos]; pos+=1
            rhs=parse(P[op] if op=='^' else P[op]+1)
            node=(op,node,rhs)
        return node
    tree=parse(0)
    pre=lambda n: n if isinstance(n,str) else n[0]+' '+pre(n[1])+' '+pre(n[2])
    return pre(tree)
def maxops(s):
    st=[];mx=0
    for t in s.split():
        if t=='(':st.append(t)
        elif t==')':
            while st[-1]!='(':st.pop()
            st.pop()
        elif t in P:
            while st and st[-1]!='(' and (P[st[-1]]>P[t] or (P[st[-1]]==P[t] and t!='^')):st.pop()
            st.append(t)
        mx=max(mx,len(st))
    return mx
def maxeval(s):
    st=0;mx=0
    for t in s.split():
        if t in P: st-=1
        else: st+=1
        mx=max(mx,st)
    return mx

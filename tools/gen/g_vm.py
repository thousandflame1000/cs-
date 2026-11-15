import random, sys
random.seed(int(sys.argv[1]) if len(sys.argv)>1 else 1)
def fifo(refs,k):
    fr=[];q=[];marks=[]
    for p in refs:
        if p in fr: marks.append(str(p)); continue
        marks.append(f'{p}*')
        if len(fr)<k: fr.append(p); q.append(p)
        else:
            v=q.pop(0); fr[fr.index(v)]=p; q.append(p)
    return marks, sum(m.endswith('*') for m in marks), fr
def lru(refs,k):
    fr=[];last={};marks=[]
    for i,p in enumerate(refs):
        if p in fr: marks.append(str(p)); last[p]=i; continue
        marks.append(f'{p}*')
        if len(fr)<k: fr.append(p)
        else:
            v=min(fr,key=lambda x:last[x]); fr[fr.index(v)]=p
        last[p]=i
    return marks, sum(m.endswith('*') for m in marks), fr
def opt(refs,k):
    fr=[];marks=[]
    for i,p in enumerate(refs):
        if p in fr: marks.append(str(p)); continue
        marks.append(f'{p}*')
        if len(fr)<k: fr.append(p)
        else:
            def nxt(x):
                for j in range(i+1,len(refs)):
                    if refs[j]==x: return j
                return 10**9
            v=max(fr,key=nxt); fr[fr.index(v)]=p
    return marks, sum(m.endswith('*') for m in marks), fr
out=[]
n=int(sys.argv[2]) if len(sys.argv)>2 else 4
seen=set()
while len(out)<n:
    k=random.choice([3,3,4])
    L=random.choice([12,13,14])
    P=random.choice([5,6])
    refs=[random.randint(1,P) for _ in range(L)]
    # avoid immediate repeats
    if any(refs[i]==refs[i+1] for i in range(L-1)): continue
    a=fifo(refs,k); b=lru(refs,k); c=opt(refs,k)
    if not (c[1]<b[1]<a[1] or c[1]<a[1]<b[1]): continue
    key=tuple(refs)
    if key in seen: continue
    seen.add(key)
    s=' '.join(map(str,refs))
    d=3 if L>=13 else 2
    out.append(f"""@q vm2-? | os-vm#2 | {d} | 追蹤
{k} 個 frame（一開始都空），參考串 {s}。FIFO、LRU、OPT 各缺頁幾次？
== {a[1]},{b[1]},{c[1]}
?? FIFO,LRU,OPT
---
標 * 的是缺頁（前 {k} 次載入也算）。FIFO：{' '.join(a[0])}，共 {a[1]} 次。LRU：{' '.join(b[0])}，共 {b[1]} 次。OPT：{' '.join(c[0])}，共 {c[1]} 次。OPT 每次換掉「下次用到最晚（或再也不用）」的頁，是任何演算法的下限；LRU 用過去近似未來。
""")
print('\n'.join(out))

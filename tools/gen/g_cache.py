import random, sys
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
def sim(seq,sets,ways):
    S=[[] for _ in range(sets)]; res=[]
    for b in seq:
        s=S[b%sets]
        if b in s: s.remove(b); s.append(b); res.append('H')
        else:
            res.append('M')
            if len(s)==ways: s.pop(0)
            s.append(b)
    return res
outs=[]
while len(outs)<n:
    L=10; seq=[random.choice(range(0,13)) for _ in range(L)]
    if len(set(seq))>6 or len(set(seq))<4: continue
    a=sim(seq,4,1); b=sim(seq,2,2); c=sim(seq,1,4)
    ha,hb,hc=a.count('H'),b.count('H'),c.count('H')
    if len({ha,hb,hc})<2: continue
    s='、'.join(map(str,seq))
    def tr(r): return ' '.join(f'{x}{y}' for x,y in zip(seq,r))
    outs.append(f"""@q ca3-? | co-cache#3 | 3 | 追蹤
cache 共 4 個區塊，一開始是空的。區塊位址依序：{s}。直接映射（位址 mod 4）、2-way 組關聯（2 組，位址 mod 2，組內 LRU）、全關聯（LRU）各命中幾次？
== {ha},{hb},{hc}
?? 直接映射,2-way,全關聯
---
H＝命中、M＝失誤。直接映射：{tr(a)}，命中 {ha} 次。2-way：{tr(b)}，命中 {hb} 次。全關聯：{tr(c)}，命中 {hc} 次。關聯度越高，「對到同一格而互踢」的衝突失誤越少，但不保證每個序列都命中更多。
""")
print('\n'.join(outs))

import random, sys
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
def srtf(ps):
    t=0; rem={p:b for p,(a,b) in ps.items()}; done={}; gantt=[]
    while len(done)<len(ps):
        ready=[p for p in ps if ps[p][0]<=t and p not in done]
        if not ready:
            t+=1; gantt.append('-'); continue
        p=min(ready,key=lambda x:(rem[x],ps[x][0],x))
        gantt.append(p); rem[p]-=1; t+=1
        if rem[p]==0: done[p]=t
    return gantt,done
def rr(ps,q):
    t=0; rem={p:b for p,(a,b) in ps.items()}; done={}; gantt=[]; queue=[]; arrived=set()
    order=sorted(ps,key=lambda x:(ps[x][0],x))
    def admit(upto):
        for p in order:
            if p not in arrived and ps[p][0]<=upto: queue.append(p); arrived.add(p)
    admit(0)
    while len(done)<len(ps):
        if not queue:
            t+=1; gantt.append('-'); admit(t); continue
        p=queue.pop(0); run=min(q,rem[p])
        for _ in range(run): gantt.append(p); t+=1; admit(t)
        rem[p]-=run
        if rem[p]==0: done[p]=t
        else: queue.append(p)
    return gantt,done
def compress(g):
    out=[];start=0
    for i in range(1,len(g)+1):
        if i==len(g) or g[i]!=g[start]:
            out.append(f'{g[start]}({start}–{i})'); start=i
    return '、'.join(out)
from fractions import Fraction
outs=[]
while len(outs)<n:
    k=4
    arr=sorted(random.sample(range(0,7),k)); arr[0]=0
    ps={f'P{i+1}':(arr[i],random.randint(2,8)) for i in range(k)}
    g1,d1=srtf(ps); g2,d2=rr(ps,2)
    w1={p:d1[p]-ps[p][0]-ps[p][1] for p in ps}; w2={p:d2[p]-ps[p][0]-ps[p][1] for p in ps}
    a1=Fraction(sum(w1.values()),k); a2=Fraction(sum(w2.values()),k)
    if a1==a2 or '-' in g1 or '-' in g2: continue
    def fmt(x): return str(x) if x.denominator==1 else (f'{float(x):g}')
    if a1.denominator not in (1,2,4) or a2.denominator not in (1,2,4): continue
    fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
    alt='' if (a1.denominator==1 and a2.denominator==1) else f'\n== {fr(a1)},{fr(a2)}'
    tab='、'.join(f'{p}（到達 {a}、需要 {b}）' for p,(a,b) in ps.items())
    outs.append(f"""@q sc2-? | os-sched#2 | 3 | 追蹤
{tab}。分別用 SRTF（剩餘時間一樣時先到的優先）和 RR（時間片 2；同一時刻新到的行程排在剛被換下的行程前面），平均等待時間各是多少？
== {fmt(a1)},{fmt(a2)}{alt}
?? SRTF,RR
---
SRTF 甘特圖：{compress(g1)}；各等待 {'、'.join(f'{p} {w1[p]}' for p in ps)}，平均 {fmt(a1)}。RR：{compress(g2)}；各等待 {'、'.join(f'{p} {w2[p]}' for p in ps)}，平均 {fmt(a2)}。等待時間＝完成時間－到達時間－執行時間。
""")
print('\n'.join(outs))

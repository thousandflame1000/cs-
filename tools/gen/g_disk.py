import random, sys
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
def sstf(h,req):
    r=req[:]; order=[]; tot=0
    while r:
        ds=sorted(r,key=lambda x:abs(x-h))
        if len(ds)>1 and abs(ds[0]-h)==abs(ds[1]-h): return None
        x=ds[0]; tot+=abs(x-h); h=x; order.append(x); r.remove(x)
    return order,tot
def scan(h,req,up,look,top=199):
    hi=sorted([x for x in req if x>=h]); lo=sorted([x for x in req if x<h],reverse=True)
    if up:
        order=hi+lo
        end = (hi[-1] if hi else h) if look else top
        tot=(end-h) + ((end-lo[-1]) if lo else 0)
        if not lo and not look: tot=end-h
    else:
        lo2=sorted([x for x in req if x<=h],reverse=True); hi2=sorted([x for x in req if x>h])
        order=lo2+hi2
        end=(lo2[-1] if lo2 else h) if look else 0
        tot=(h-end)+((hi2[-1]-end) if hi2 else 0)
    return order,tot
out=[];
while len(out)<n:
    h=random.randint(40,160); k=random.choice([6,7])
    req=random.sample(range(0,200),k)
    if h in req: continue
    s=sstf(h,req)
    if not s: continue
    up=random.choice([True,False])
    sc=scan(h,req,up,False); lk=scan(h,req,up,True)
    if len({s[1],sc[1],lk[1]})<3: continue
    dirw='往磁軌號碼大的方向' if up else '往磁軌號碼小的方向'
    d=3 if k==7 else 2
    out.append(f"""@q st1-? | os-storage#1 | {d} | 追蹤
磁軌 0–199，磁頭在 {h}、正{dirw}移動。請求佇列（依到達順序）：{'、'.join(map(str,req))}。SSTF、SCAN（一路走到盡頭才回頭）、LOOK（走到最遠的請求就回頭）的磁頭總移動量各是多少？
== {s[1]},{sc[1]},{lk[1]}
?? SSTF,SCAN,LOOK
---
SSTF 每次挑最近的：{h} → {' → '.join(map(str,s[0]))}，共 {s[1]}。SCAN：{h} → {' → '.join(map(str,sc[0][:len([x for x in sc[0] if (x>=h if up else x<=h)])]+[199 if up else 0]+sc[0][len([x for x in sc[0] if (x>=h if up else x<=h)]):]))}，共 {sc[1]}。LOOK 順序相同但不走到盡頭：{h} → {' → '.join(map(str,lk[0]))}，共 {lk[1]}。SSTF 總移動量常比較小，但可能讓遠處的請求一直等；SCAN／LOOK 比較公平。
""")
print('\n'.join(out))

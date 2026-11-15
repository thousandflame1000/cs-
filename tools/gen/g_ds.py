import random, sys, heapq
random.seed(int(sys.argv[1])); n=int(sys.argv[2])
out=[]
# build max-heap
def build(a):
    a=a[:]; N=len(a); steps=[]
    def sift(i):
        while True:
            l,r=2*i+1,2*i+2; m=i
            if l<N and a[l]>a[m]: m=l
            if r<N and a[r]>a[m]: m=r
            if m==i: return
            a[i],a[m]=a[m],a[i]; i=m
    for i in range(N//2-1,-1,-1):
        before=a[i]; sift(i); steps.append(f'第 {i+1} 格（{before}）')
    return a,steps
for _ in range(n):
    arr=random.sample(range(1,60),random.choice([8,9,10]))
    res,st=build(arr)
    out.append(f"""@q hp1-? | ds-heap#1 | 3 | 追蹤
陣列（從第 1 格開始）{', '.join(map(str,arr))}。用 Build-Max-Heap（從最後一個非葉節點往前，對每個節點往下調整）建成 max-heap 後，陣列依序是？（用逗號隔開）
== {','.join(map(str,res))}
---
共 {len(arr)} 個元素，最後一個非葉節點是第 $\\lfloor{len(arr)}/2\\rfloor={len(arr)//2}$ 格，依序處理 {'、'.join(st)}：每次和較大的孩子比，比孩子小就交換並繼續往下。結果 {', '.join(map(str,res))}。檢查：每個第 $i$ 格都不小於第 $2i$、$2i+1$ 格。
""")
# linear probing
for _ in range(n):
    m=11; keys=random.sample(range(10,100),7)
    T=[None]*m; probes=[]
    for k in keys:
        h=k%m; i=0
        while T[(h+i)%m] is not None: i+=1
        T[(h+i)%m]=k; probes.append(f'{k}→{(h+i)%m}' + (f'（探測 {i+1} 次）' if i else ''))
    if sum('探測' in p for p in probes)<2: continue
    target=random.choice(keys)
    out.append(f"""@q hs3-? | ds-hash#3 | 2 | 追蹤
表長 $m=11$（格子 0～10），$h(k)=k\\bmod11$，線性探測。依序插入 {', '.join(map(str,keys))}。最後 {target} 在第幾格？
== {T.index(target)}
---
依序：{'；'.join(probes)}。最後的表：{'、'.join(f'{i}:{v}' for i,v in enumerate(T) if v is not None)}。衝突時往下一格找，連在一起的格子越長，之後插入越容易撞上（primary clustering）。
""")
# BST insert -> preorder and height
def bst(keys):
    root=None; L={}; R={}
    for k in keys:
        if root is None: root=k; continue
        c=root
        while True:
            if k<c:
                if c in L: c=L[c]
                else: L[c]=k; break
            else:
                if c in R: c=R[c]
                else: R[c]=k; break
    pre=[]
    def p(x,d):
        if x is None: return -1
        pre.append(x); return max(d, p(L.get(x),d+1), p(R.get(x),d+1))
    h=p(root,0)
    return pre,h
for _ in range(n):
    keys=random.sample(range(1,50),8)
    pre,h=bst(keys)
    out.append(f"""@q bst2-? | ds-bst#2 | 2 | 追蹤
依序把 {', '.join(map(str,keys))} 插入一棵空的 BST（不做平衡）。前序走訪的結果是？樹高（根的深度 0）是多少？
== {' '.join(map(str,pre))},{h}
?? 前序（空格隔開）,樹高
---
第一個 {keys[0]} 是根，之後每個鍵從根往下比，小的往左、大的往右，走到空位放下。前序（根、左、右）：{' '.join(map(str,pre))}；最深的節點在深度 {h}。插入順序不同，樹的形狀就不同。
""")
# Lomuto partition
for _ in range(n):
    a=random.sample(range(1,40),8)
    x=a[-1]; i=-1; b=a[:]
    for j in range(len(b)-1):
        if b[j]<=x: i+=1; b[i],b[j]=b[j],b[i]
    b[i+1],b[-1]=b[-1],b[i+1]
    out.append(f"""@q srt3-? | ds-sort#3 | 2 | 追蹤
陣列 {', '.join(map(str,a))}，用 Lomuto partition（最後一個 {x} 當 pivot，$i$ 從 $-1$ 開始，掃到 $\\le$ pivot 的就 $i$ 加 1 並交換 $a[i]$、$a[j]$，最後把 pivot 換到 $i+1$）。partition 之後陣列是？（逗號隔開）
== {','.join(map(str,b))}
---
比 {x} 小或相等的有 {sum(1 for v in a[:-1] if v<=x)} 個，它們依原本出現的順序被換到前面；pivot 最後落在第 {i+2} 個位置（從 1 數），左邊都 $\\le{x}$、右邊都 $>{x}$。結果 {', '.join(map(str,b))}。注意右半部的順序被打亂了，這也是 quicksort 不穩定的原因。
""")
print('\n'.join(out))

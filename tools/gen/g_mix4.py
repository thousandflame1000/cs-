import random, sys, math, itertools, bisect
from fractions import Fraction
from collections import deque
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
BS=chr(92)
def frac(x): return str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
# solve 3x3
if want('sol'):
  cnt=0
  while cnt<n:
    x=[random.randint(-3,4) for _ in range(3)]
    A=[[random.randint(-2,3) for _ in range(3)] for _ in range(3)]
    det=A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0])
    if det==0: continue
    b=[sum(A[i][j]*x[j] for j in range(3)) for i in range(3)]
    def term(c,v,first):
        if c==0: return ''
        s=('' if first else ('+' if c>0 else '-')) if not (first and c<0) else '-'
        a=abs(c); return f'{s}{"" if a==1 else a}{v}'
    eqs=[]
    for i in range(3):
        s=''; first=True
        for c,v in zip(A[i],'xyz'):
            tt=term(c,v,first)
            if tt: s+=tt; first=False
        if not s: s='0'
        eqs.append(f'${s}={b[i]}$')
    out.append(f"""@q ls1-? | la-systems#1 | 3 | 計算
解聯立方程式：{'、'.join(eqs)}。$(x,y,z)$ 是？
== {x[0]},{x[1]},{x[2]}
?? x,y,z
---
係數矩陣的行列式是 {det}（不為 0），所以有唯一解。用高斯消去法化成上三角再往回代，得 $(x,y,z)=({x[0]},{x[1]},{x[2]})$。驗算：代回三條式子，左邊依序是 {b[0]}、{b[1]}、{b[2]}。
""")
    cnt+=1
# eigen 2x2 integer
if want('eig'):
  cnt=0
  while cnt<n:
    l1,l2=random.sample(range(-3,7),2)
    P=[[random.randint(-2,2) for _ in range(2)] for _ in range(2)]
    d=P[0][0]*P[1][1]-P[0][1]*P[1][0]
    if abs(d)!=1: continue
    Pi=[[P[1][1]*d,-P[0][1]*d],[-P[1][0]*d,P[0][0]*d]]
    D=[[l1,0],[0,l2]]
    M=[[sum(P[i][k]*D[k][k]*Pi[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    if M[0][1]==0 or M[1][0]==0: continue
    tr=M[0][0]+M[1][1]; dt=M[0][0]*M[1][1]-M[0][1]*M[1][0]
    lo,hi=sorted([l1,l2])
    mat=f'{M[0][0]}&{M[0][1]}{BS}{BS}{M[1][0]}&{M[1][1]}'
    out.append(f"""@q ei1-? | la-eigen#1 | 2 | 計算
$A=\\left[\\begin{{smallmatrix}}{mat}\\end{{smallmatrix}}\\right]$ 的兩個特徵值（由小到大）是？
== {lo},{hi}
?? 較小,較大
---
特徵多項式 $\\lambda^2-(\\operatorname{{tr}}A)\\lambda+\\det A=\\lambda^2-({tr})\\lambda+({dt})$。兩根的和是跡 {tr}、積是行列式 {dt}，所以是 {lo} 和 {hi}。可以檢查：$A-({lo})I$ 的行列式是 0。
""")
    cnt+=1
# BFS distances
if want('bfs'):
  cnt=0
  while cnt<n:
    V='sabcdef'; E=set()
    while len(E)<9:
        u,v=sorted(random.sample(V,2)); E.add((u,v))
    adj={v:[] for v in V}
    for u,v in E: adj[u].append(v); adj[v].append(u)
    for v in V: adj[v].sort()
    dist={'s':0}; q=deque(['s']); order=[]
    while q:
        u=q.popleft(); order.append(u)
        for w in adj[u]:
            if w not in dist: dist[w]=dist[u]+1; q.append(w)
    if len(dist)<7 or max(dist.values())<3: continue
    es='、'.join(f'{u}–{v}' for u,v in sorted(E))
    out.append(f"""@q gr2-? | ds-graph#2 | 2 | 追蹤
無向圖的邊：{es}。從 s 做 BFS，a～f 到 s 的最短邊數依序是？
== {','.join(str(dist[v]) for v in 'abcdef')}
?? a,b,c,d,e,f
---
一層一層往外：第 0 層 s；{'；'.join(f"第 {k} 層 "+'、'.join(v for v in V if dist[v]==k) for k in range(1,max(dist.values())+1))}。BFS 第一次發現某個點時給的距離就是最短邊數。
""")
    cnt+=1
# LSD radix first pass
if want('rad'):
  cnt=0
  while cnt<n:
    a=random.sample(range(100,999),7)
    if len(set(x%10 for x in a))>5: continue
    p1=sorted(a,key=lambda x:x%10); p2=sorted(p1,key=lambda x:(x//10)%10)
    out.append(f"""@q srt4-? | ds-sort#4 | 2 | 追蹤
LSD 基數排序（每一輪用穩定的排序，依十進位某一位排）處理 {', '.join(map(str,a))}。第一輪（依個位數）和第二輪（依十位數）之後的序列各是？（逗號隔開）
== {' '.join(map(str,p1))},{' '.join(map(str,p2))}
?? 第一輪（空格隔開）,第二輪（空格隔開）
---
第一輪依個位：{' '.join(map(str,p1))}，個位相同的保持原本的先後。第二輪依十位：{' '.join(map(str,p2))}，十位相同時保持第一輪的順序，所以後兩位已經排好。第三輪依百位後就全部排好。每一輪必須穩定，否則前一輪排好的順序會被打亂。
""")
    cnt+=1
# inversions
if want('inv'):
  cnt=0
  while cnt<n:
    a=random.sample(range(1,10),7)
    inv=sum(1 for i in range(7) for j in range(i+1,7) if a[i]>a[j])
    pairs=[(a[i],a[j]) for i in range(7) for j in range(i+1,7) if a[i]>a[j]]
    out.append(f"""@q dc4-? | al-dc#4 | 2 | 計算
序列 {', '.join(map(str,a))} 有幾個逆序對（$i<j$ 但 $a_i>a_j$）？
== {inv}
---
對每個數，數它後面有幾個比它小的：{'、'.join(f'{a[i]}:{sum(1 for j in range(i+1,7) if a[j]<a[i])}' for i in range(7))}，加起來 {inv}。這也正是插入排序（或氣泡排序）要做的交換次數；合併排序可以在 $O(n\\lg n)$ 時間內數出來。
""")
    cnt+=1
# LIS
if want('lis'):
  cnt=0
  while cnt<n:
    a=random.sample(range(1,30),9)
    L=[1]*9
    for i in range(9):
        for j in range(i):
            if a[j]<a[i]: L[i]=max(L[i],L[j]+1)
    out.append(f"""@q dp5-? | al-dp#5 | 2 | 計算
序列 {', '.join(map(str,a))} 的最長（嚴格）遞增子序列長度是多少？
== {max(L)}
---
$L[i]$＝以第 $i$ 個數結尾的最長遞增子序列長度：{' '.join(map(str,L))}。答案取最大值 {max(L)}。也可以用 tail 陣列，每來一個數就用二分搜尋找位置取代，$O(n\\lg n)$。
""")
    cnt+=1
# matrix chain
if want('mc'):
  cnt=0
  while cnt<n:
    p=[random.choice([2,3,4,5,6,10,15,20]) for _ in range(5)]
    N=4; m=[[0]*N for _ in range(N)]; s=[[0]*N for _ in range(N)]
    for L in range(2,N+1):
        for i in range(N-L+1):
            j=i+L-1; m[i][j]=10**9
            for k in range(i,j):
                c=m[i][k]+m[k+1][j]+p[i]*p[k+1]*p[j+1]
                if c<m[i][j]: m[i][j]=c; s[i][j]=k
    def paren(i,j):
        if i==j: return f'M_{i+1}'
        return '('+paren(i,s[i][j])+paren(s[i][j]+1,j)+')'
    dims='、'.join(f'$M_{i+1}$ 是 ${p[i]}\\times{p[i+1]}$' for i in range(4))
    out.append(f"""@q dp2-? | al-dp#2 | 3 | 計算
{dims}。算 $M_1M_2M_3M_4$ 最少要做幾次純量乘法？
== {m[0][3]}
---
$m[i][j]=\\min_k(m[i][k]+m[k+1][j]+p_{{i-1}}p_kp_j)$。兩個一組：$m_{{12}}={m[0][1]}$、$m_{{23}}={m[1][2]}$、$m_{{34}}={m[2][3]}$；三個一組：$m_{{13}}={m[0][2]}$、$m_{{24}}={m[1][3]}$；全部：{m[0][3]}，最佳括法 ${paren(0,3)}$。
""")
    cnt+=1
print('\n'.join(out))

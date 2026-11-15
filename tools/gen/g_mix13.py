import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
BS=chr(92)
if want('race'):
  cnt=0; seen=set()
  while cnt<n:
    v0=random.randint(2,9); a=random.randint(1,5); b=random.choice([2,3])
    kind=random.choice(['add','mul'])
    ops2=('加',b) if kind=='add' else ('乘',b)
    steps=['讀','算','寫']
    pos=sorted(random.sample(range(6),3)); seq=[]; i1=i2=0
    for k in range(6):
        if k in pos: seq.append(('T1',steps[i1])); i1+=1
        else: seq.append(('T2',steps[i2])); i2+=1
    key=(tuple(seq),kind)
    if key in seen: continue
    seen.add(key)
    x=v0; r={}
    f1=lambda t:t+a; f2=(lambda t:t+b) if kind=='add' else (lambda t:t*b)
    trace=[]
    for t,s in seq:
        if s=='讀': r[t]=x; trace.append(f'{t} 讀到 {x}')
        elif s=='算': r[t]=f1(r[t]) if t=='T1' else f2(r[t]); trace.append(f'{t} 算出 {r[t]}')
        else: x=r[t]; trace.append(f'{t} 寫入 → x＝{x}')
    s12=f2(f1(v0)); s21=f1(f2(v0))
    if x in (s12,s21) and random.random()<0.6: continue
    T2desc=f'x = x + {b}' if kind=='add' else f'x = x * {b}'
    order='、'.join(f'{t}{s}' for t,s in seq)
    out.append(f"""@q sy1-? | os-sync#1 | 2 | 追蹤
共享變數 x 初值 {v0}。T1 執行 `x = x + {a}`、T2 執行 `{T2desc}`，各自拆成三步：讀 x 到自己的暫存器、在暫存器裡算、寫回 x。實際交錯順序：{order}。最後 x 是多少？
== {x}
---
{'；'.join(trace)}。如果兩個執行緒不交錯，結果應該是 {s12}（先 T1 後 T2）或 {s21}（先 T2 後 T1）{'；這次的交錯剛好得到其中之一，但換個順序就可能出錯' if x in (s12,s21) else '；這次得到 '+str(x)+'，是「後寫的人蓋掉先寫的人」造成的競爭條件'}。把讀－算－寫包在臨界區裡（例如加鎖），就只會出現序列化的結果。
""")
    cnt+=1
if want('st5'):
  cnt=0
  while cnt<n:
    st={'A':'就緒','B':'就緒','C':'就緒'}; ev=[]
    for _ in range(random.randint(8,10)):
        run=[p for p in st if st[p]=='執行']; rdy=[p for p in st if st[p]=='就緒']; wt=[p for p in st if st[p]=='等待']
        choices=[]
        if not run and rdy: choices.append('sched')
        if run: choices+= ['io','tq','tq','exit']
        if wt: choices+=['done','done']
        if not choices: break
        c=random.choice(choices)
        if c=='sched': p=random.choice(rdy); st[p]='執行'; ev.append(f'排程器選 {p} 執行')
        elif c=='io': p=run[0]; st[p]='等待'; ev.append(f'{p} 要求讀檔')
        elif c=='tq': p=run[0]; st[p]='就緒'; ev.append(f'{p} 的時間片用完')
        elif c=='exit': p=run[0]; st[p]='結束'; ev.append(f'{p} 執行完畢')
        elif c=='done': p=random.choice(wt); st[p]='就緒'; ev.append(f'{p} 的讀檔完成')
    if len(ev)<7 or len(set(st.values()))<2: continue
    out.append(f"""@q pr1-? | os-process#1 | 2 | 追蹤
單核心。行程 A、B、C 一開始都在「就緒」。依序發生：{'、'.join(ev)}。最後 A、B、C 各在哪個狀態？（就緒／執行／等待／結束）
== {st['A']},{st['B']},{st['C']}
?? A,B,C
---
規則：只有「就緒」的能被排程器選去「執行」；執行中的行程發出 I/O 要求就進「等待」，時間片用完回「就緒」，做完進「結束」；等待的事件完成後回到「就緒」（不是直接回到執行）。照順序套用，最後 A {st['A']}、B {st['B']}、C {st['C']}。
""")
    cnt+=1
if want('dfs'):
  cnt=0
  while cnt<n:
    V='abcdef'[:random.choice([5,6])]; E=set()
    while len(E)<len(V)+2:
        u,v=random.sample(V,2); E.add((u,v))
    adj={u:sorted(v for x,v in E if x==u) for u in V}
    d={};f={};t=[0]; par={}
    def dfs(u):
        t[0]+=1; d[u]=t[0]
        for v in adj[u]:
            if v not in d: par[v]=u; dfs(v)
        t[0]+=1; f[u]=t[0]
    for u in V:
        if u not in d: dfs(u)
    cls={'樹邊':0,'後向邊':0,'前向邊':0,'交叉邊':0}; lab=[]
    for u,v in sorted(E):
        if par.get(v)==u and d[v]>d[u]: c='樹邊'
        elif d[v]<=d[u] and f[u]<=f[v]: c='後向邊'
        elif d[u]<d[v] and f[v]<f[u]: c='前向邊'
        else: c='交叉邊'
        cls[c]+=1; lab.append(f'{u}→{v} {c}')
    if cls['交叉邊']==0 and cls['前向邊']==0: continue
    es='、'.join(f'{u}→{v}' for u,v in sorted(E))
    times='、'.join(f'{u} {d[u]}/{f[u]}' for u in V)
    out.append(f"""@q gr3-? | ds-graph#3 | 3 | 追蹤
有向圖的邊：{es}。從 a 開始做 DFS，鄰居和重新出發的起點都照字母順序。樹邊、後向邊、前向邊、交叉邊各有幾條？
== {cls['樹邊']},{cls['後向邊']},{cls['前向邊']},{cls['交叉邊']}
?? 樹邊,後向邊,前向邊,交叉邊
---
發現／完成時間：{times}。分類：{'；'.join(lab)}。判斷法：$u\\to v$ 時，$v$ 還沒被發現→樹邊；$v$ 是 $u$ 的祖先（還沒完成）→後向邊；$v$ 是 $u$ 的子孫但不是直接由這條邊發現→前向邊；其他（$v$ 早就完成、在別的分支）→交叉邊。有後向邊⇔有環。
""")
    cnt+=1
if want('nt4'):
  cnt=0; seen=set()
  while cnt<n:
    N=random.choice([7,11,13,17,9,15,14,20])
    a=random.randint(2,N-2)
    if math.gcd(a,N)!=1 or (N,a) in seen: continue
    seen.add((N,a))
    pw=[]; v=1; k=0
    while True:
        v=v*a%N; k+=1; pw.append(v)
        if v==1: break
    phi=sum(1 for x in range(1,N) if math.gcd(x,N)==1)
    gen=(k==phi)
    dd=3 if N>=13 and k>=6 else 2
    out.append(f"""@q nt4-? | dm-nt-algebra#4 | {dd} | 計算
在群 $\\mathbb Z_{{{N}}}^*$（與 {N} 互質的數，乘法 $\\bmod {N}$）中，元素 {a} 的階（最小的 $k\\ge1$ 使 ${a}^k\\equiv1$）是多少？它能不能生成整個群？
== {k},{'能' if gen else '不能'}
?? 階,能否生成
---
依序算 ${a}^1,{a}^2,\\dots \\bmod {N}$：{', '.join(map(str,pw))}，第 {k} 次回到 1，階是 {k}。群的大小 $\\varphi({N})={phi}$，{'階等於群的大小，所以 '+str(a)+' 是生成元' if gen else '階小於群的大小，所以只生成一個大小 '+str(k)+' 的子群'}。由 Lagrange 定理，階一定整除 {phi}。
""")
    cnt+=1
if want('quant'):
  cnt=0; seen=set()
  preds=[('x+y 是偶數',lambda x,y:(x+y)%2==0),('x<y',lambda x,y:x<y),('x\\le y',lambda x,y:x<=y),('x\\ne y',lambda x,y:x!=y),('xy\\ge {k}',None),('x+y={k1}',None)]
  forms=[('\\forall x\\,\\exists y',lambda P,D:all(any(P(x,y) for y in D) for x in D)),
         ('\\exists y\\,\\forall x',lambda P,D:any(all(P(x,y) for x in D) for y in D)),
         ('\\exists x\\,\\forall y',lambda P,D:any(all(P(x,y) for y in D) for x in D)),
         ('\\forall y\\,\\exists x',lambda P,D:all(any(P(x,y) for x in D) for y in D))]
  while cnt<n:
    k=random.randint(3,5); D=range(1,k+1)
    i=random.randrange(len(preds)); name,P=preds[i]
    if i==4: kk=random.randint(k,2*k); name=f'xy\\ge {kk}'; P=lambda x,y,kk=kk:x*y>=kk
    if i==5: kk=random.randint(3,k+1); name=f'x+y={kk}'; P=lambda x,y,kk=kk:x+y==kk
    f1,f2=random.sample(range(4),2)
    v1=forms[f1][1](P,D); v2=forms[f2][1](P,D)
    key=(name,k,f1,f2)
    if key in seen or v1==v2 and random.random()<0.5: continue
    seen.add(key)
    tf=lambda b:'真' if b else '假'
    def wit(fi,v):
        if fi==0:
            if v: return '每個 x 都找得到 y：'+'、'.join(f'x={x} 取 y={next(y for y in D if P(x,y))}' for x in D)
            x=next(x for x in D if not any(P(x,y) for y in D)); return f'x={x} 時沒有任何 y 使它成立'
        if fi==1:
            if v: y=next(y for y in D if all(P(x,y) for x in D)); return f'y={y} 對所有 x 都成立'
            return '每個 y 都被某個 x 打破：'+'、'.join(f'y={y} 時 x={next(x for x in D if not P(x,y))} 不成立' for y in D)
        if fi==2:
            if v: x=next(x for x in D if all(P(x,y) for y in D)); return f'x={x} 對所有 y 都成立'
            return '每個 x 都被某個 y 打破：'+'、'.join(f'x={x} 時 y={next(y for y in D if not P(x,y))} 不成立' for x in D)
        if fi==3:
            if v: return '每個 y 都找得到 x：'+'、'.join(f'y={y} 取 x={next(x for x in D if P(x,y))}' for y in D)
            y=next(y for y in D if not any(P(x,y) for x in D)); return f'y={y} 時沒有任何 x 使它成立'
    w1=wit(f1,v1); w2=wit(f2,v2)
    out.append(f"""@q lg2-? | dm-logic#2 | 3 | 計算
論域是 $\\{{1,\\dots,{k}\\}}$，$P(x,y)$：${name}$。判斷 (甲) ${forms[f1][0]}\\,P(x,y)$、(乙) ${forms[f2][0]}\\,P(x,y)$ 的真假。
== {tf(v1)},{tf(v2)}
?? 甲,乙
---
$\\forall x\\,\\exists y$：每個 $x$ 都能各自找一個 $y$（$y$ 可以隨 $x$ 改變）；$\\exists y\\,\\forall x$：要有**同一個** $y$ 對所有 $x$ 都成立，比較強。(甲) {tf(v1)}：{w1}。(乙) {tf(v2)}：{w2}。量詞的順序和變數的角色一換，意思就不同，判斷時先想「誰先挑、誰後挑」。
""")
    cnt+=1
print(''.join(out))

import random, sys, math, itertools
from fractions import Fraction as F
random.seed(int(sys.argv[1])); n=int(sys.argv[2]); which=sys.argv[3].split(',') if len(sys.argv)>3 else None
out=[]
def want(k): return which is None or k in which
fr=lambda x: str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
if want('bin'):
  cnt=0
  while cnt<n:
    x=random.randint(100,999)
    b=bin(x)[2:]; h=hex(x)[2:].upper()
    groups=[b[::-1][i:i+4][::-1] for i in range(0,len(b),4)][::-1]
    BS=chr(92)
    ver='+'.join((f'{int(c,16)}'+(BS+'times16^'+str(len(h)-1-i) if len(h)-1-i>0 else '')) for i,c in enumerate(h))
    out.append(f"""@q fb-? | f-binary | 2 | 計算
十進位 {x} 寫成二進位和十六進位各是？
== {b},{h}
?? 二進位,十六進位
---
一直除以 2 取餘數（由下往上讀）得 {b}。十六進位：從右邊每 4 位一組 {' '.join(groups)}，每組換成 0～F：{h}。驗算：${ver}={x}$。
""")
    cnt+=1
if want('tw'):
  cnt=0
  while cnt<n:
    x=random.randint(-127,-1)
    b=format(x&0xFF,'08b'); pos=format(-x,'08b')
    inv=''.join('1' if c=='0' else '0' for c in pos)
    out.append(f"""@q ft-? | f-twos | 2 | 計算
{x} 的 8 位元二補數表示是什麼？
== {b}
---
先寫 ${-x}$：`{pos}`；每位反過來得 `{inv}`；再加 1 得 `{b}`。驗算：把 `{b}` 當成無號數是 {int(b,2)}，減掉 256 正好是 {x}。
""")
    cnt+=1
if want('md'):
  cnt=0
  while cnt<n:
    a=random.randint(10,99); b=random.randint(10,99); m=random.choice([7,9,11,13])
    out.append(f"""@q fm-? | f-mod | 2 | 計算
不用算出 ${a}\\times{b}$，求 $({a}\\times{b})\\bmod{m}$。
== {a*b%m}
---
先各自取餘數：${a}\\bmod{m}={a%m}$、${b}\\bmod{m}={b%m}$。$({a}\\times{b})\\bmod{m}=({a%m}\\times{b%m})\\bmod{m}={(a%m)*(b%m)}\\bmod{m}={a*b%m}$。乘法和加法都可以先取餘數再算，數字就不會變大。
""")
    cnt+=1
if want('lg'):
  cnt=0
  while cnt<n:
    x=random.randint(50,5000)
    k=x.bit_length()-1
    out.append(f"""@q fl-? | f-log | 2 | 計算
$\\lfloor\\lg {x}\\rfloor$ 是多少？（$\\lg$ 是以 2 為底）
== {k}
---
$2^{{{k}}}={2**k}\\le{x}<2^{{{k+1}}}={2**(k+1)}$，所以 $\\lg {x}$ 介於 {k} 和 {k+1} 之間，取整數部分 {k}。也就是 {x} 一直除以 2（捨去小數）要 {k} 次才會變成 1。
""")
    cnt+=1
if want('sm'):
  cnt=0
  while cnt<n:
    a=random.randint(1,9); d=random.randint(2,7); N=random.randint(10,30)
    last=a+(N-1)*d; S=N*(a+last)//2
    out.append(f"""@q fs-? | f-sum | 2 | 計算
${a}+{a+d}+{a+2*d}+\\cdots+{last}$（每項加 {d}）的總和是多少？
== {S}
---
這是等差級數：項數 $\\frac{{{last}-{a}}}{{{d}}}+1={N}$，總和＝$\\frac{{(\\text{{首項}}+\\text{{末項}})\\times\\text{{項數}}}}2=\\frac{{({a}+{last})\\times{N}}}2={S}$。
""")
    cnt+=1
if want('loop'):
  cnt=0
  while cnt<n:
    N=random.randint(10,40); s=random.choice([1,2,3]); m=random.choice([2,3])
    kind=random.choice(['nest','mul'])
    if kind=='nest':
        c=sum(1 for i in range(0,N,s) for j in range(i,N))
        code=f'for (int i = 0; i < {N}; i += {s})\n    for (int j = i; j < {N}; j++) x++;'
        exp=f'外層 $i$＝0、{s}、{2*s}…（小於 {N}），每次內層跑 ${N}-i$ 次，加起來 {c}。'
    else:
        c=0; i=1
        while i<N: c+=1; i*=m
        code=f'for (int i = 1; i < {N}; i *= {m}) x++;'
        exp=f'$i$＝1、{m}、{m*m}…，小於 {N} 的有 {c} 個，所以跑 {c} 次（大約 $\\log_{m}{N}$）。'
    out.append(f"""@q fo-? | f-bigo | 2 | 追蹤
下面這段執行完，`x++` 執行了幾次（`x` 從 0 開始）？
```c
{code}
```
== {c}
---
{exp}
""")
    cnt+=1
if want('dice'):
  cnt=0
  while cnt<n:
    s_=random.choice([3,4,5,8,9,10,11])
    ways=sum(1 for a in range(1,7) for b in range(1,7) if a+b==s_)
    p=F(ways,36)
    lst='、'.join(f'({a},{s_-a})' for a in range(1,7) if 1<=s_-a<=6)
    out.append(f"""@q fx-? | f-prob | 1 | 計算
丟兩顆公平的骰子，點數和是 {s_} 的機率是多少？（寫最簡分數）
== {fr(p)}
---
共 36 種等可能的結果。和為 {s_} 的有 {ways} 種：{lst}。機率 $\\frac{{{ways}}}{{36}}=\\frac{{{p.numerator}}}{{{p.denominator}}}$。
""")
    cnt+=1
print('\n'.join(o for o in out if o))

import re,glob,io,sys
R=re.compile(r'\$(zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|k[01]|gp|sp|fp|ra)\b')
fix='--fix' in sys.argv; tot=0
for f in [x for x in sorted(glob.glob('content/**/*.md',recursive=True)+glob.glob('content/quiz/*.txt')) if not x.endswith('b-la1.txt')]:  # 線代的 $k0.5^k$ 是數學不是暫存器
    lines=io.open(f,encoding='utf-8').read().split('\n'); fence=False; ch=0
    for i,l in enumerate(lines):
        if l.strip().startswith('```'): fence=not fence; continue
        if fence: continue
        parts=re.split(r'(`[^`\n]*`)',l)
        new=[]
        for p in parts:
            if p.startswith('`') and p.endswith('`') and len(p)>1: new.append(p); continue
            if R.search(p):
                tot+=1
                if not fix: print(f'{f}:{i+1}: {l.strip()[:120]}')
                # 暫存器包成行內程式碼：`$t0`
                p=R.sub(lambda m:'`'+m.group(0)+'`',p); ch+=1
            new.append(p)
        lines[i]=''.join(new)
    if fix and ch: io.open(f,'w',encoding='utf-8',newline='').write('\n'.join(lines)); print('fixed',f,ch)
print('lines with bare MIPS registers:',tot)

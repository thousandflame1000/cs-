import re,glob,os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 專案根目錄
os.chdir(ROOT)
tot=0
for f in glob.glob('content/quiz/b-*.txt'):
    t=open(f).read(); parts=re.split(r'\n(?=@q )',t); ch=False
    for i,b in enumerate(parts):
        if '\n?? ' in b: continue
        lines=b.split('\n')
        ans=[l for l in lines if l.startswith('== ')]
        if not ans: continue
        a=ans[0][3:]
        if ' ' in a and ',' not in a and re.fullmatch(r'[A-Za-z0-9 ]+',a) and len(a.split())>=3:
            alt='== '+','.join(a.split())
            if alt in lines: continue
            idx=lines.index(ans[0]); lines.insert(idx+1,alt); parts[i]='\n'.join(lines); ch=True; tot+=1
    if ch: open(f,'w').write('\n'.join(parts))
print('altfix',tot)

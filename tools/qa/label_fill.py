import re,io,glob,sys
fix='--fix' in sys.argv
def splitTop(s):
    out=[];d=0;m=False;cur=''
    for c in s:
        if c=='$': m=not m
        if not m:
            if c in '([{（': d+=1
            elif c in ')]}）': d=max(0,d-1)
        if c in ',，' and not m and not d: out.append(cur); cur=''
        else: cur+=c
    out.append(cur); return [x.strip() for x in out]
done=un=0; unl=[]
for f in sorted(glob.glob('content/quiz/*.txt')):
    txt=io.open(f,encoding='utf-8').read(); blocks=re.split(r'(?m)^(?=@q )',txt); ch=False
    for bi,b in enumerate(blocks):
        if not b.startswith('@q '): continue
        head,_,rest=b.partition('\n'); body,sep,expl=rest.partition('\n---\n')
        lines=body.split('\n')
        if any(l.startswith('[') for l in lines) or any(l.startswith('?? ') for l in lines): continue
        fills=[l[3:] for l in lines if l.startswith('== ')]
        if not fills: continue
        n=len(splitTop(fills[0].replace('、',',').replace('；',',')))
        if n<2: continue
        stem='\n'.join(l for l in lines if not l.startswith('== ')).strip()
        last=re.split(r'(?<=[。！])',stem.replace('\n',' '))
        last=[x for x in last if x.strip()][-1]
        maths=re.findall(r'\$[^$]+\$',last)
        if len(maths)==n and re.search(r'(和|與|及|、|，|,)',last):
            lab=','.join(maths); done+=1
            if fix:
                i=max(i for i,l in enumerate(lines) if l.startswith('== '))
                lines.insert(i+1,'?? '+lab); blocks[bi]=head+'\n'+'\n'.join(lines)+sep+expl; ch=True
        else:
            un+=1; unl.append(f"{head.split('|')[0][3:].strip()} | {fills[0][:30]} | {stem[:70]}")
    if fix and ch: io.open(f,'w',encoding='utf-8',newline='').write(''.join(blocks))
print('auto-labelled',done,'not auto',un)
if '-v' in sys.argv: print('\n'.join(unl))

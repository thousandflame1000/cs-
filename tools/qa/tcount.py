import re,glob,os,subprocess,sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 專案根目錄
B=''.join(open(f).read() for f in glob.glob((ROOT+'/content/quiz/b-*.txt')))
qs=[q for q in re.split(r'(?m)^(?=@q )',B) if q.startswith('@q')]
def key(s): return re.sub(r'[\d$\-\s,，、]','',s)[:10]
idx={}
for q in qs:
    L=q.split('\n'); kp=L[0].split('|')[1].strip(); idx.setdefault((kp,key(L[1])),0); idx[(kp,key(L[1]))]+=1
for g in sys.argv[1:]:
    src=open(g).read()
    tmpl=re.findall(r"if want\('(\w+)'\)",src)
    for t in tmpl:
        r=subprocess.run(['python3',g,'77','1',t],capture_output=True,text=True).stdout
        ps=[p for p in re.split(r'(?m)^(?=@q )',r) if p.startswith('@q')]
        if not ps: print(g,t,'NOOUT'); continue
        L=ps[0].split('\n'); kp=L[0].split('|')[1].strip()
        print(g[:-3],t,kp,idx.get((kp,key(L[1])),0))

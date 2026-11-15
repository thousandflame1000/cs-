import re,glob,sys,difflib,os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 專案根目錄
root=(ROOT+'/content/quiz')
def parse(t):
    out=[]
    for b in re.split(r'\n(?=@q )',t):
        m=re.match(r'@q (\S+) \| (\S+) \| (\d) \| (\S+)\n(.*)',b)
        if m: out.append((m.group(1),m.group(2),m.group(5)))
    return out
def norm(s):
    s=re.sub(r'^(克漏字|短文|學術字彙|拆字猜義)[：:]','',s)
    s=re.sub(r'[\s`$\\{}]','',s)
    return s.lower()
old=[]
for f in glob.glob(root+'/b-*.txt'):
    old+=parse(open(f).read())
new=parse(open(sys.argv[1]).read())
th=float(sys.argv[2]) if len(sys.argv)>2 else 0.6
for q in new:
    a=norm(q[2]); best=(0,None)
    for o in old:
        if o[2]==q[2]: continue
        b=norm(o[2])
        sm=difflib.SequenceMatcher(None,a,b)
        if sm.real_quick_ratio()<th or sm.quick_ratio()<th: continue
        r=sm.ratio()
        if r>best[0]: best=(r,o)
    if best[0]>=th: print(round(best[0],2), q[1], q[2][:50], '||', best[1][0], best[1][2][:50])
# second pass: shared math/code fragments within same subject
def frags(s):
    ms=s.split('$')[1::2]
    fs=[m for m in ms if len(m)>=7 and m not in ('\\mathbb R^3','\\mathbb R^2','\\mathbb R^n')]
    fs+=re.findall(r'`([^`]{8,})`',s)+re.findall(r'「([^」]{14,})」',s)
    return set(f.strip() for f in fs)
idx={}
for o in old:
    for fr in frags(o[2]): idx.setdefault((o[1][:2],fr),[]).append(o)
for q in new:
    hits=[]
    for fr in frags(q[2]):
        for o in idx.get((q[1][:2],fr),[]):
            if o[2]!=q[2]: hits.append((fr,o[0]))
    if hits: print('FRAG', q[1], q[2][:40], '||', hits[:3])

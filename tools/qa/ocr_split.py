import re,sys,os
W=int(os.environ.get('W','220'))
START=re.compile(r'(?m)^\s*(?:(?:Problem|Question|Q)\s*)?(\d{1,2})?\s*[\.\)．、:]?\s*[\(\[]\s*(\d{1,2})\s*(?:points?|pts?\.?|%|分)\s*[\)\]]',re.I)
def flags(s):
    l=s.lower(); f=[]
    if re.search(r'multiple.choice|true or false|true/false|\bt/f\b|select all|which of the following',l): f.append('選')
    if re.search(r'\bprove\b|\bproof\b|show that|disprove|counterexample|justify',l): f.append('證')
    if re.search(r'design|devise|give an? (?:efficient |linear|polynomial|o\()|(?:write|give|describe|propose|derive) (?:an? |the )?(?:efficient |optimal )?(?:algorithm|pseudo)|pseudocode|pseudo-code',l): f.append('設')
    if re.search(r'compute|calculate|how many|what is the|find |determine|evaluate|draw|show the|fill|what are the values|trace',l): f.append('算')
    if re.search(r'explain|why|describe|compare|discuss|briefly|what are the (?:advantage|difference)',l): f.append('釋')
    return ''.join(f) or '?'
for f in sys.argv[1:]:
    t=open(f).read(); t=re.sub(r'=== PAGE.*\n','\n',t)
    ms=list(START.finditer(t))
    # keep only top-level: drop matches immediately preceded (same line) by (a)/(b)
    tops=[]
    for m in ms:
        line_start=t.rfind('\n',0,m.start())+1
        pre=t[line_start:m.start()+8]
        if re.match(r'\s*\(?[a-h]\)',pre): continue
        tops.append(m)
    print('##',os.path.basename(f),'n=',len(tops),'sum=',sum(int(m.group(2)) for m in tops))
    for i,m in enumerate(tops):
        e=tops[i+1].start() if i+1<len(tops) else len(t)
        seg=t[m.start():e]
        print(f'Q{i+1} [{m.group(2)}] <{flags(seg)}> '+re.sub(r'\s+',' ',seg)[:W])

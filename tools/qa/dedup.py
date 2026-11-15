import re,glob,os,sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 專案根目錄
B=''.join(open(f).read() for f in glob.glob((ROOT+'/content/quiz/*.txt')))
ex=set(q.split('\n')[1].strip() for q in re.split(r'(?m)^(?=@q )',B) if q.startswith('@q'))
fn=sys.argv[1]; drop=set(sys.argv[2:])
t=open(fn).read()
parts=[p for p in re.split(r'(?m)^(?=@q )',t) if p.strip()]
seen=set(); keep=[]
for p in parts:
    kp=p.split('|')[1].strip(); st=p.split('\n')[1].strip()
    if kp in drop or st in ex or st in seen: continue
    seen.add(st); keep.append(p)
t=''.join(keep).replace("逆序對（$i<j$ 但 $a_i>a_j$）的期望個數是多少？","「$i<j$ 但 $a_i>a_j$」的位置對，期望有幾對？")
open(fn,'w').write(t); print(len(keep))

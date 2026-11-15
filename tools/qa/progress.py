import io,re,subprocess,collections,glob
import os; root=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'))
out=subprocess.run(['python3','tools/qlint.py'],cwd=root,capture_output=True,text=True).stdout
rows=re.findall(r'^  (\S+)：(\d+) 題',out,re.M)
total=sum(int(n) for _,n in rows)
fixed=0
for f in glob.glob(root+'/content/quiz/*.txt'):
    fixed+=len(re.findall(r'^@q ',io.open(f,encoding='utf-8').read(),re.M))
p=root+'/content/題庫規劃.md'; s=io.open(p,encoding='utf-8').read()
note={}
for m in re.finditer(r'^\| (\S+#\d+) \| \d+ \| (.*) \|$',s,re.M): note[m.group(1)]=m.group(2)
files=collections.defaultdict(set)
for f in glob.glob(root+'/content/quiz/b-*.txt'):
    for m in re.finditer(r'^@q [^|]+\|\s*(\S+)',io.open(f,encoding='utf-8').read(),re.M): files[m.group(1)].add(f.split('/')[-1])
lines=['| 知識點 | 新增 | 備註 |','|---|---|---|']
for kp,n in rows:
    lines.append(f'| {kp} | {n} | {note.get(kp, "、".join(sorted(files[kp]))+"（答案用程式驗過）")} |')
lines.append(f'| **合計** | **{total}** | 固定題 1,135 → {fixed:,}（目標 10,000） |')
s=re.sub(r'\| 知識點 \| 新增 \| 備註 \|\n(?:\|.*\|\n)+','\n'.join(lines)+'\n',s,count=1)
io.open(p,'w',encoding='utf-8').write(s)
print(total,fixed)

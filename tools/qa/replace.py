"""就地改寫既有題目（保留題號、不刪題）。改寫成台大風格時用這支，不要用 add.py（add.py 只會新增）。
草稿格式跟 b 檔一樣，只是 @q 後面寫「既有題號」：
    @q bst3-27 | ds-bst#3 | 3 | 情境
    Which of the following statements about AVL trees are correct? Select all that apply.
    [x] ...
    [ ] ...
    ---
    詳解（中文可以）
用法：python3 tools/qa/replace.py 草稿.txt        → 預檢：題號存在、知識點沒變、H4 預檢、整個題庫 qlint 模擬
      python3 tools/qa/replace.py 草稿.txt go     → 預檢全過才寫回 content/quiz/*.txt；舊版本備份到 tools/revise/backup/
規則：知識點不能換（換了會打亂各知識點的難度／形式比例）；難度、形式可以改，qlint 會把關比例。"""
import sys, os, re, io, glob, shutil, subprocess, tempfile, datetime
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
Q = os.path.join(R, 'content', 'quiz')
HEAD = re.compile(r'^@q (\S+)\s*\|\s*(\S+)\s*\|\s*([123])\s*\|\s*(\S+)\s*$')
draft_path = sys.argv[1]; go = len(sys.argv) > 2 and sys.argv[2] == 'go'
draft = io.open(draft_path, encoding='utf-8').read().replace('\r\n', '\n')
blocks = [b for b in re.split(r'^(?=@q )', draft, flags=re.M) if b.startswith('@q ')]
files = {f: io.open(f, encoding='utf-8').read().replace('\r\n', '\n') for f in sorted(glob.glob(Q + '/*.txt'))}

def find(qid):
    """回傳 (檔名, 起點, 終點)：從 @q 那行到下一個 @q（或檔尾）之前，不含結尾空行"""
    hits = []
    for f, s in files.items():
        for m in re.finditer(r'^@q ' + re.escape(qid) + r'\s*\|.*$', s, re.M):
            nx = re.compile(r'^@q ', re.M).search(s, m.end())
            end = nx.start() if nx else len(s)
            while end > m.start() and s[end - 1] == '\n': end -= 1
            hits.append((f, m.start(), end))
    return hits

err, plan = [], []
for b in blocks:
    b = b.rstrip('\n')
    first = b.split('\n', 1)[0]; m = HEAD.match(first)
    if not m: err.append('題頭格式不對：' + first); continue
    qid, kp = m.group(1), m.group(2)
    if qid.endswith('-?'): err.append(f'{qid}：改寫要用既有題號；新增題目請用 add.py'); continue
    hits = find(qid)
    if len(hits) != 1: err.append(f'{qid}：在題庫找到 {len(hits)} 處（要剛好 1 處）'); continue
    f, a, z = hits[0]; old = files[f][a:z]
    okp = HEAD.match(old.split('\n', 1)[0])
    if not okp or okp.group(2) != kp: err.append(f'{qid}：知識點不能換（原本 {okp.group(2) if okp else "?"}，草稿 {kp}）'); continue
    if old.strip() == b.strip(): err.append(f'{qid}：草稿跟原題一模一樣'); continue
    plan.append((qid, f, a, z, old, b))
if len({p[0] for p in plan}) != len(plan): err.append('草稿裡同一題出現兩次')
if err: print('\n'.join(err)); sys.exit(1)

# 套用（同一檔從後面往前換，位置才不會跑掉）
new = dict(files)
for qid, f, a, z, old, b in sorted(plan, key=lambda p: (p[1], -p[2])):
    new[f] = new[f][:a] + b + new[f][z:]

# 預檢 1：H4（題幹＋選項只能用祖先知識點教過的術語）
tmp = tempfile.mkdtemp(prefix='replace-')
io.open(tmp + '/draft.txt', 'w', encoding='utf-8').write('\n\n'.join(p[5] for p in plan) + '\n')
h = subprocess.run([sys.executable, os.path.join(R, 'tools', 'qa', 'h4pre.py'), tmp + '/draft.txt'], cwd=R, capture_output=True, text=True)
print(h.stdout.strip()[-1500:], h.stderr.strip()[-800:])
okh = 'H4 預檢違規 0' in h.stdout
# 預檢 2：整個題庫 qlint 模擬（難度、形式、是非比例，重複題幹，以上皆是…）
S = tmp + '/sim'; os.makedirs(S + '/tools'); os.makedirs(S + '/content/quiz')
shutil.copy(os.path.join(R, 'tools', 'qlint.py'), S + '/tools/')
for f, s in new.items(): io.open(S + '/content/quiz/' + os.path.basename(f), 'w', encoding='utf-8', newline='').write(s)
r = subprocess.run([sys.executable, S + '/tools/qlint.py'], capture_output=True, text=True).stdout
kps = {p[5].split('|')[1].strip() for p in plan}
print('\n'.join(l for l in r.split('\n') if any(l.strip().startswith(k + '：') for k in kps) or '違規' in l or l.startswith('  ·')))
okq = '違規： 0' in r
shutil.rmtree(tmp, ignore_errors=True)
print('改寫', len(plan), '題：', ' '.join(p[0] for p in plan))
if not go: print('（預檢而已；加 go 才寫回）' if okh and okq else '（有違規，先修草稿）'); sys.exit(0 if okh and okq else 1)
if not (okh and okq): print('沒寫回（有違規）'); sys.exit(1)
bk = os.path.join(R, 'tools', 'revise', 'backup'); os.makedirs(bk, exist_ok=True)
ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
io.open(os.path.join(bk, ts + '.txt'), 'w', encoding='utf-8').write(''.join(f'# {os.path.basename(p[1])}\n{p[4]}\n\n' for p in plan))
for f in {p[1] for p in plan}: io.open(f, 'w', encoding='utf-8', newline='').write(new[f])
io.open(os.path.join(R, 'tools', 'revise', 'done.txt'), 'a', encoding='utf-8').write(''.join(f'{ts} {p[0]}\n' for p in plan))
print('已寫回；舊版本在 tools/revise/backup/' + ts + '.txt；題號記到 tools/revise/done.txt')

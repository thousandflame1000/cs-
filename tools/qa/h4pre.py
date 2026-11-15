"""寫新題前先查 H4（題幹＋選項不能用祖先知識點沒教過的術語）。
用法：python3 tools/qa/h4pre.py draft.txt        （draft 用 b 檔同樣的 @q 格式）
      python3 tools/qa/h4pre.py --kp dm-graph#3    （列出這個知識點「不能用」的術語，依擁有者分組）"""
import sys, os, re, io, collections
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..'))
import curriculum as cu
G = cu.load(); pi, cyc, anc, ch, need = cu.topo(G); T = G['terms']
def allowed(k): return anc.get(k, set()) | {k}
if sys.argv[1] == '--kp':
    k = sys.argv[2]; al = allowed(k); by = collections.defaultdict(list)
    for node, ts in G['tmap'].items():
        if node.startswith('_') or node in al: continue
        by[node] += ts
    pos = {x: i for i, x in enumerate(pi)}
    for node in sorted(by, key=lambda n: pos.get(n, 9999)):
        if pos.get(node, 9999) < pos[k] + 40: print(f'{node}: {"、".join(by[node])}')
    sys.exit()
txt = io.open(sys.argv[1], encoding='utf-8').read().replace('\r\n', '\n'); bad = 0
for blk in re.split(r'^@q ', txt, flags=re.M)[1:]:
    head, _, rest = blk.partition('\n'); f = [x.strip() for x in head.split('|')]
    body = rest.partition('\n---\n')[0]
    opts = re.findall(r'^\[(?: |x|X)\] (.*)$', body, re.M)
    stem = '\n'.join(l for l in body.split('\n') if not re.match(r'^(\[( |x|X)\] |== |\?\? )', l))
    req = T.match(stem + '\n' + '\n'.join(opts)); al = allowed(f[1])
    b = [t for t, ds in req if not (ds & al)]
    if b: bad += 1; print(f'{f[0]} → {f[1]}：{"、".join(b)}')
print('H4 預檢違規', bad)

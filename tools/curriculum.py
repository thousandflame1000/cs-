# -*- coding: utf-8 -*-
"""知識點圖（課程規格 content/課程規格.md 的資料層）

- 節點 K：地基節點（graph.json foundation）＋ 每章每個 `## ` 小節（id：章id#第幾節）
- 邊 E：同章上一節（一律）＋ graph.json 的 pre（跨章先修）；第 1 節沒寫 pre 就是根（H2 會抓出來）
- π：優先序 Kahn 拓撲排序；鍵值 =（需要時刻, 本身章序, 節序）
      需要時刻 need(k) = k 與所有後代中最早的章序 → 地基「剛好在要用之前」才學
- 術語索引：content/terms.json（節點 → 它教的術語），比對時取最長字串、英文整字比對
- req(q)：題幹＋選項中出現的術語 → 每個術語的「定義節點集合」（任一個學過就算會）
- KP 內容：content/kp/*.md（格式見課程規格）
"""
import os, re, io, json, sys, math, heapq
from collections import defaultdict, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build  # noqa: E402

C = lambda *p: os.path.join(ROOT, *p)
INF = 10 ** 6


def J(*p):
    return json.load(io.open(C(*p), encoding='utf-8'))


# ======================= KP 內容 =======================
TYPES = {'選擇': 'mc', '填空': 'fill', '寫': 'write', '排序': 'order', '判斷': 'mc'}


def split_bar(s):
    """在第一個「數學式外面」的 | 切開。$|A\\times B|$ 這種絕對值／集合大小裡的 | 不算分隔線（2026-11-10 學生回報例題被切爛）。"""
    i, inm = 0, False
    while i < len(s):
        c = s[i]
        if c == '\\':
            i += 2; continue
        if c == '$':
            inm = not inm
        elif c == '|' and not inm:
            return s[:i], s[i + 1:]
        i += 1
    return s, ''


def parse_kp_body(body):
    """回傳 (items, examples)。items：md／mc／fill／write／order／video／lab；examples：[{q, steps:[{w,hint,sol}], ans}]"""
    items, examples = [], []
    md, cur, ex, last = [], None, None, None  # last：目前接續中的欄位

    def flush_md():
        t = '\n'.join(md).strip()
        if t:
            items.append({'t': 'md', 'text': t})
        md.clear()

    def close_cur():
        nonlocal cur
        if cur:
            for k in ('stem', 'hint', 'why'):
                if k in cur:
                    cur[k] = cur[k].strip()
            items.append(cur)
        cur = None

    lines = body.split('\n')
    infig = False
    for raw in lines:
        line = raw.rstrip()
        st = line.strip()
        if st.startswith('```'):
            infig = not infig
        if not infig and st.startswith('?? '):
            close_cur(); flush_md(); ex = None
            typ, _, stem = st[3:].partition('|')
            t = TYPES.get(typ.strip(), 'mc')
            cur = {'t': t, 'stem': stem.strip(), 'opts': [], 'ans': [], 'hint': '', 'why': ''}
            if t == 'order':
                cur['items'] = []
            last = 'stem'
            continue
        if not infig and st.startswith('@例題'):
            close_cur(); flush_md()
            ex = {'q': st[3:].strip(), 'steps': [], 'ans': ''}
            examples.append(ex); last = 'q'
            continue
        if not infig and ex is not None and (st.startswith('@步') or st.startswith('@寫')):
            hint, sol = split_bar(st[2:])
            ex['steps'].append({'w': st.startswith('@寫'), 'hint': hint.strip(), 'sol': sol.strip()}); last = 'step'
            continue
        if not infig and ex is not None and st.startswith('@答'):
            ex['ans'] = st[2:].strip(); last = 'ans'
            continue
        if not infig and st.startswith('@影片'):
            close_cur(); flush_md(); ex = None
            m = re.match(r'@影片\s+(\S+)(?:\s+(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?))?', st)
            if m:
                items.append({'t': 'video', 'clip': m.group(1), 'a': float(m.group(2) or 0), 'b': float(m.group(3)) if m.group(3) else None})
            continue
        if not infig and st.startswith('@玩'):
            close_cur(); flush_md(); ex = None
            items.append({'t': 'lab', 'id': st[2:].strip()})
            continue
        if ex is not None:
            if not st:
                if last == 'ans':
                    ex = None
                elif last == 'q':
                    ex['q'] += '\n'
                elif last == 'step' and ex['steps']:
                    ex['steps'][-1]['sol'] += '\n'
                continue
            if last == 'q':
                ex['q'] += '\n' + line
            elif last == 'step' and ex['steps']:
                ex['steps'][-1]['sol'] += '\n' + line
            elif last == 'ans':
                ex['ans'] += '\n' + line
            continue
        if cur is not None:
            m = re.match(r'^\[( |x|X)\]\s*(.*)$', st)
            if m and cur['t'] == 'mc':
                if m.group(1).lower() == 'x':
                    cur['ans'].append(len(cur['opts']))
                cur['opts'].append(m.group(2)); last = 'opt'; continue
            if st.startswith('== '):
                cur['ans'].append(st[3:].strip()); last = 'ans'; continue
            if st.startswith('!! '):
                cur['hint'] += st[3:] + '\n'; last = 'hint'; continue
            if st.startswith('>> '):
                cur['why'] += st[3:] + '\n'; last = 'why'; continue
            if cur['t'] == 'order' and st.startswith('- '):
                cur['items'].append(st[2:].strip()); last = 'item'; continue
            if not st:
                if last == 'stem':
                    cur['stem'] += '\n'; continue
                close_cur(); continue
            if last == 'stem':
                cur['stem'] += '\n' + line; continue
            if last in ('hint', 'why'):
                cur[last] += line + '\n'; continue
            close_cur()
        md.append(line)
    close_cur(); flush_md()
    for e in examples:
        e['q'] = e['q'].strip(); e['ans'] = e['ans'].strip()
        for s in e['steps']:
            s['sol'] = s['sol'].strip()
    return items, examples


def parse_kp():
    out = OrderedDict()
    d = C('content', 'kp')
    if not os.path.isdir(d):
        return out
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.md'):
            continue
        txt = io.open(os.path.join(d, fn), encoding='utf-8').read().replace('\r\n', '\n')
        parts = re.split(r'^=== *(\S+) *$', txt, flags=re.M)
        for i in range(1, len(parts), 2):
            kid, block = parts[i], parts[i + 1]
            head, sep, body = block.partition('\n---\n')
            if not sep:
                head, body = '', block
            meta = dict(re.findall(r'^([A-Za-z_]+):\s*(.*)$', head, flags=re.M))
            items, examples = parse_kp_body(body)
            out[kid] = dict(id=kid, title=meta.get('title', '').strip(), mins=int(meta.get('mins') or 0), goal=meta.get('goal', '').strip(),
                            items=items, examples=examples, file=fn)
    return out


# ======================= 術語比對 =======================
class Terms:
    def __init__(self, tmap):
        self.defs = defaultdict(set)    # (敏感?, key) → 節點
        pieces = []
        for node, ts in tmap.items():
            if node.startswith('_') and node != '_mask':
                continue
            for t in ts:
                if node == '_mask':      # 只吃掉字串、不算術語
                    self.defs.setdefault((bool(re.search(r'[A-Z]', t)), t if re.search(r'[A-Z]', t) else t.lower()), set())
                    continue
                sens = t.startswith('\\') or bool(re.search(r'[A-Z]', t))
                key = t if sens else t.lower()
                self.defs[(sens, key)].add(node)
        seen = set()
        for (sens, key) in sorted(self.defs, key=lambda x: -len(x[1])):
            if (sens, key) in seen:
                continue
            seen.add((sens, key))
            p = re.escape(key)
            if re.match(r'[A-Za-z0-9]', key):
                p = r'(?<![A-Za-z0-9])' + p
            if re.search(r'[A-Za-z0-9]$', key):
                p = p + (r'(?![A-Za-z])' if key.startswith('\\') else r'(?![A-Za-z0-9])')
            pieces.append(p if sens else '(?i:' + p + ')')
        self.rx = re.compile('|'.join(pieces))

    def match(self, text):
        """回傳 [(術語, frozenset(定義節點))]，同一術語只算一次"""
        out, got = [], set()
        for m in self.rx.finditer(text or ''):
            s = m.group(0)
            ds = self.defs.get((True, s))
            if ds is None:
                ds = self.defs.get((False, s.lower()))
            if not ds:
                continue
            k = s.lower()
            if k in got:
                continue
            got.add(k)
            out.append((s, frozenset(ds)))
        return out


def bigrams(t):
    t = re.sub(r'\$[^$]*\$', ' ', t or '')
    out = set()
    for seg in re.findall(r'[一-鿿]+', t):
        out.update(seg[i:i + 2] for i in range(len(seg) - 1))
    out.update(w.lower() for w in re.findall(r'[A-Za-z]{3,}', t))
    return out


def read_chars(md):
    """純閱讀字數（H7）：去掉 fig 區塊、markdown 記號；LaTeX 指令算 1 字"""
    t = re.sub(r'```.*?```', '', md or '', flags=re.S)
    t = re.sub(r'\\[A-Za-z]+', 'x', t)
    t = re.sub(r'[\s$*#>`{}_^|\-]', '', t)
    return len(t)


# ======================= 影片字幕 =======================
def video_captions():
    """clip id → {'dur', 'lines':[(start,end,text)]}；字幕來自 影片/工程/NN-*/film/timing.js"""
    base = C('影片', '工程')
    out = {}
    try:
        sh = io.open(os.path.join(base, '_lib', 'music_only.sh'), encoding='utf-8').read()
        ids = re.search(r'IDS=\(([^)]*)\)', sh).group(1).split()
    except Exception:
        return out
    for d in sorted(os.listdir(base)):
        m = re.match(r'^(\d\d)-', d)
        if not m:
            continue
        nn = int(m.group(1))
        if nn >= len(ids):
            continue
        tj = os.path.join(base, d, 'film', 'timing.js')
        if not os.path.exists(tj):
            continue
        s = io.open(tj, encoding='utf-8').read()
        s = s[s.index('{'):s.rindex('}') + 1]
        try:
            T = json.loads(s)
        except Exception:
            continue
        lines = [(x.get('start', 0), x.get('end', 0), re.sub(r'[\[\]]', '', x.get('text', ''))) for x in T.get('lines', [])]
        out[ids[nn]] = {'dur': T.get('total', 0), 'lines': lines, 'dir': d}
    return out


# ======================= 圖 =======================
def load():
    lessons = build.parse_lessons()
    lids = {l['id'] for l in lessons}
    quiz, qerrs = build.parse_quiz(lids)
    g = J('content', 'graph.json')
    nodes = OrderedDict()
    for i, f in enumerate(g['foundation']):
        nodes[f['id']] = dict(id=f['id'], kind='f', ch=None, subject=f['subject'], title=f['title'], mins=f.get('mins', 30), text='', idx=i, nsec=0)
    for l in lessons:
        secs = re.split(r'^## ', l['body'], flags=re.M)[1:]
        for i, s in enumerate(secs, 1):
            title, _, text = s.partition('\n')
            nodes[f"{l['id']}#{i}"] = dict(id=f"{l['id']}#{i}", kind='s', ch=l['id'], subject=l['subject'], title=re.sub(r'^\d+\.\s*', '', title).strip(),
                                          text=text.strip(), idx=i, nsec=len(secs), chtitle=l['title'], chmins=l['mins'])
    errs = []
    pre = OrderedDict()
    fpre = {f['id']: f.get('pre', []) for f in g['foundation']}
    for k, n in nodes.items():
        if n['kind'] == 'f':
            pre[k] = list(fpre[k])
        else:   # 同章上一節一律是先修（章內照順序上）；graph.json 只寫額外的跨章先修
            pre[k] = ([f"{n['ch']}#{n['idx'] - 1}"] if n['idx'] > 1 else []) + [p for p in g['pre'].get(k, []) if p != f"{n['ch']}#{n['idx'] - 1}"]
    for k in g['pre']:
        if k not in nodes:
            errs.append(f'graph.json pre 有不存在的節點 {k}')
    for k, ps in pre.items():
        for p in ps:
            if p not in nodes:
                errs.append(f'{k} 的先修 {p} 不存在')
        pre[k] = [p for p in ps if p in nodes]
    rank = {c: i for i, c in enumerate(g['chapter_order'])}
    for l in lessons:
        if l['id'] not in rank:
            errs.append(f'chapter_order 少了 {l["id"]}')
            rank[l['id']] = len(rank)
    return dict(lessons=lessons, quiz=quiz, qerrs=qerrs, g=g, nodes=nodes, pre=pre, rank=rank, errs=errs,
                kp=parse_kp(), terms=Terms(J('content', 'terms.json')), tmap=J('content', 'terms.json'),
                vmap={k: v for k, v in J('content', 'vmap.json').items() if not k.startswith('_')})


def topo(G):
    """回傳 (π, 是否有環, 環上的點)。優先序 Kahn。"""
    nodes, pre, rank = G['nodes'], G['pre'], G['rank']
    ch = defaultdict(list)
    indeg = {k: 0 for k in nodes}
    for k, ps in pre.items():
        for p in ps:
            ch[p].append(k); indeg[k] += 1
    # 先跑一次普通 Kahn 得到反向順序，算 need
    q = [k for k in nodes if indeg[k] == 0]; deg = dict(indeg); order = []
    while q:
        k = q.pop(); order.append(k)
        for c in ch[k]:
            deg[c] -= 1
            if deg[c] == 0:
                q.append(c)
    cyc = [k for k in nodes if deg[k] > 0]
    own = {k: (rank[n['ch']] if n['kind'] == 's' else INF) for k, n in nodes.items()}
    need = dict(own)
    for k in reversed(order):
        for c in ch[k]:
            need[k] = min(need[k], need[c])
    key = lambda k: (need[k], own[k] if own[k] < INF else need[k], 0 if nodes[k]['kind'] == 'f' else 1, nodes[k]['idx'])
    deg = dict(indeg)
    h = [(key(k), k) for k in nodes if deg[k] == 0]
    heapq.heapify(h); pi = []
    while h:
        _, k = heapq.heappop(h); pi.append(k)
        for c in ch[k]:
            deg[c] -= 1
            if deg[c] == 0:
                heapq.heappush(h, (key(c), c))
    anc = {}
    for k in pi:
        a = set()
        for p in pre[k]:
            a |= anc.get(p, set()); a.add(p)
        anc[k] = a
    return pi, cyc, anc, ch, need


def q_text(q):
    return (q.get('stem') or '') + '\n' + '\n'.join(q.get('opts') or [])


def assign(G, pi, anc):
    """每題指派主知識點。回傳 {qid: 資訊}"""
    nodes, terms = G['nodes'], G['terms']
    pos = {k: i for i, k in enumerate(pi)}
    bi = {k: bigrams(n['title'] * 2 + '\n' + n['text']) for k, n in nodes.items()}
    sec_of = defaultdict(list)
    for k, n in nodes.items():
        if n['kind'] == 's':
            sec_of[n['ch']].append(k)
    res = OrderedDict()
    for q in G['quiz']:
        req = terms.match(q_text(q))
        qb = bigrams(q_text(q) + '\n' + (q.get('expl') or ''))

        def ok(k):
            al = anc.get(k, set()) | {k}
            return all(ds & al for _, ds in req)

        def bad_terms(k):
            al = anc.get(k, set()) | {k}
            return [t for t, ds in req if not (ds & al)]

        def sim(k):
            direct = sum(1 for _, ds in req if k in ds)
            b = bi[k]
            jac = len(qb & b) / math.sqrt(len(qb) * len(b) + 1) if qb and b else 0
            return direct + 5 * jac

        cands = sec_of[q['ch']]
        base = max(cands, key=lambda k: (sim(k), -pos.get(k, 0))) if cands else None
        info = dict(ch=q['ch'], base=base, req=sorted({t for t, _ in req}), explicit=bool(q.get('kp')), diff=q.get('diff', 2))
        if q.get('kp'):
            k = q['kp']
            info.update(kp=k, ok=(k in nodes and ok(k)), bad=bad_terms(k) if k in nodes else ['節點不存在'])
        elif base and ok(base):
            info.update(kp=base, ok=True, bad=[])
        else:
            good = [k for k in cands if ok(k)]
            if not good:
                good = [k for k in pi if ok(k)]
            if good:
                k = max(good, key=lambda k: (sim(k), -pos[k]))
                info.update(kp=k, ok=True, bad=[], moved=True)
            else:
                info.update(kp=base, ok=False, bad=bad_terms(base) if base else [])
        info['base_ok'] = bool(base and ok(base))
        info['base_bad'] = bad_terms(base) if base else []
        res[q['id']] = info
    return res


def vref(v):
    """'ds-sort#2@0-43.6' → ('ds-sort#2', 0.0, 43.6)；沒寫範圍 → (kp, 0, None)"""
    k, _, r = v.partition('@')
    if r:
        a, _, b = r.partition('-')
        return k, float(a or 0), float(b) if b else None
    return k, 0.0, None


def plan_days(pi, mins, daily):
    days, cur, t = [], [], 0
    for k in pi:
        m = mins[k]
        if cur and t + m > daily:
            days.append(cur); cur, t = [], 0
        cur.append(k); t += m
    if cur:
        days.append(cur)
    return days


def kp_mins(G, k):
    kp = G['kp'].get(k)
    if kp and kp['mins']:
        return kp['mins']
    n = G['nodes'][k]
    if n['kind'] == 'f':
        return n['mins']
    return max(5, round(n['chmins'] / max(1, n['nsec'])))


def curriculum():
    """給 build.py：網站要用的知識點資料（DATA.kp）"""
    G = load()
    pi, cyc, anc, ch, need = topo(G)
    qa = assign(G, pi, anc)
    nodes = G['nodes']
    out_nodes = OrderedDict()
    for k in pi:
        n = nodes[k]
        kp = G['kp'].get(k)
        out_nodes[k] = dict(id=k, kind=n['kind'], ch=n['ch'], subject=n['subject'], idx=n['idx'],
                            title=(kp['title'] if kp and kp['title'] else n['title']), pre=G['pre'][k], mins=kp_mins(G, k),
                            items=kp['items'] if kp else None, examples=kp['examples'] if kp else None, goal=kp['goal'] if kp else '',
                            notes=n['text'] if n['kind'] == 's' else '')
    vid = defaultdict(list)
    for clip, v in G['vmap'].items():
        k, a, b = vref(v)
        vid[k].append(dict(clip=clip, a=a, b=b))
    return dict(order=pi, nodes=out_nodes, qmap={qid: i['kp'] for qid, i in qa.items()}, qreq={qid: i['req'] for qid, i in qa.items()}, vmap=G['vmap'], vids=dict(vid))

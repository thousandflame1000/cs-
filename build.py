# -*- coding: utf-8 -*-
"""把 content/ 裡的教材、題庫、計畫編譯成 web/js/data.js，並輸出單檔版 dist/資工所衝刺站.html
用法：python build.py
教材格式（content/lessons/*.md）：
  === 章節id
  title: 標題
  mins: 120
  summary: 一句話摘要
  feynman: 費曼關卡題目（markdown）
  rubric: 關鍵點1 | 關鍵點2 | ...
  ---
  正文 markdown……
題庫格式（content/quiz/*.txt）：
  @q 題號 | 章節id | 難度1-3
  題幹（markdown，可多行）
  [x] 正確選項      （多個 [x] 就是複選）
  [ ] 錯誤選項
  == 填充答案（可多行，表示多種可接受寫法）
  ?? 填答格式提示
  ---
  詳解（markdown）；沒有選項也沒有 == 的題目視為申論／證明題，詳解即參考解答
"""
import json, os, re, sys, io

ROOT = os.path.dirname(os.path.abspath(__file__))
INTROS = {}
C = lambda *p: os.path.join(ROOT, *p)

SUBJECTS = [
    dict(id='ds', name='資料結構', short='資結', exam='資料結構與演算法', refs='CLRS 4th ed.；Horowitz《Fundamentals of Data Structures in C++》',
         desc='攤銷分析、各種樹與堆積、雜湊、Union-Find、排序下界、圖的基本結構。台大考法重「為什麼」：給證明、給反例、給精確的界。'),
    dict(id='al', name='演算法', short='演算法', exam='資料結構與演算法', refs='CLRS 4th ed. Ch.3-4, 14-17, 22-26, 34-35；Kleinberg & Tardos',
         desc='遞迴式、分治、DP、貪婪、最短路徑與 MST、網路流、NP-完備性、機率分析。台大常要求設計演算法並證明正確性與複雜度。'),
    dict(id='co', name='計算機組織／結構', short='計組', exam='計算機結構與作業系統', refs='Patterson & Hennessy《COD》；Hennessy & Patterson《CA: AQA》',
         desc='效能公式、數字表示與算術、資料路徑、管線與危障、ILP（Tomasulo、ROB）、Cache 與虛擬記憶體、一致性協定。'),
    dict(id='os', name='作業系統', short='OS', exam='計算機結構與作業系統', refs='Silberschatz《Operating System Concepts》10th ed.',
         desc='行程與執行緒、排程、同步、死結、記憶體管理、虛擬記憶體、檔案與磁碟。台大愛考同步的正確性論證與 fork/執行緒的語意。'),
    dict(id='dm', name='離散數學', short='離散', exam='數學（線代＋離散）', refs='Rosen《Discrete Mathematics and Its Applications》；Grimaldi',
         desc='邏輯與證明、計數與排容、遞迴與生成函數、關係、圖論、數論與代數結構。'),
    dict(id='la', name='線性代數', short='線代', exam='數學（線代＋離散）', refs='Strang《Introduction to Linear Algebra》；Friedberg；Leon',
         desc='線性系統、向量空間與線性變換、行列式、特徵值與對角化、正交與最小平方、對稱矩陣與 SVD。台大線代證明題比例高。'),
]

PLAN = [
    (1, '開局：漸進分析 × 線性系統', '建立「用精確的界說話」的習慣；高斯消去要熟到不會算錯。', ['al-recurrence', 'la-systems']),
    (2, '行程模型 × 攤銷分析', 'fork 語意要能畫行程樹；攤銷三法都要能寫出位能函數。', ['os-process', 'ds-amortized']),
    (3, '邏輯證明 × 效能公式', '歸納法寫法固定化；CPU time 公式與 Amdahl 一次搞懂。', ['dm-logic', 'co-perf']),
    (4, '排序與下界 × 向量空間', '比較排序下界的決策樹論證；子空間、基底、維度的定義要能默寫。', ['ds-sort', 'la-vs']),
    (5, 'CPU 排程 × 堆積', '甘特圖手算零失誤；Build-Heap 為何 O(n)。', ['os-sched', 'ds-heap']),
    (6, '計數 × 數字表示與算術', '排容原理的套路；IEEE 754 與 Booth 乘法。', ['dm-counting', 'co-arith']),
    (7, '平衡樹 × 同步', 'AVL／紅黑樹的旋轉；臨界區三條件與 Peterson 證明。', ['ds-bst', 'os-sync']),
    (8, '複習日 #1', '重交被退回的費曼關卡；做一回交錯混合練習 40 題；錯題本清到 0。', []),
    (9, '行列式 × 雜湊', '行列式的性質證明；雜湊的期望探測次數。', ['la-det', 'ds-hash']),
    (10, '資料路徑 × 遞迴與生成函數', '單週期控制訊號；特徵根法與生成函數解遞迴。', ['co-datapath', 'dm-recur-gf']),
    (11, 'B 樹 × 死結', 'B-tree 的分裂合併；Banker 與死結條件。', ['ds-btree', 'os-deadlock']),
    (12, '特徵值 × 管線', '對角化條件；forwarding 與 stall 計算。', ['la-eigen', 'co-pipeline']),
    (13, 'Union-Find × 圖的走訪', 'rank + 路徑壓縮；DFS 的括號定理與邊分類、SCC。', ['ds-unionfind', 'ds-graph']),
    (14, '關係 × 記憶體管理', '等價關係與偏序；分頁與頁表結構。', ['dm-relations', 'os-memory']),
    (15, '分治 × 指令階層平行', 'Master theorem 的邊界情況；Tomasulo 與 ROB。', ['al-dc', 'co-ilp']),
    (16, '複習日 #2', '模擬考：資料結構與演算法；檢討錯因分布。', [], ['dsa']),
    (17, '正交 × 動態規劃', '投影與最小平方；DP 的狀態定義與重建解。', ['la-ortho', 'al-dp']),
    (18, '虛擬記憶體 × 圖論', '頁替換與 thrashing；平面圖、著色、匹配。', ['os-vm', 'dm-graph']),
    (19, '貪婪 × Cache', '交換論證；Cache 設計與 AMAT。', ['al-greedy', 'co-cache']),
    (20, '對稱矩陣與 SVD × 最短路徑', '正定判別與 SVD；Dijkstra 正確性、Johnson 重新加權。', ['la-sym-svd', 'al-sp']),
    (21, '儲存系統 × 數論與代數', '磁碟排程、RAID、檔案配置；同餘、CRT、群。', ['os-storage', 'dm-nt-algebra']),
    (22, 'MST 與網路流 × 虛擬記憶體硬體與一致性', 'Cut property、Max-flow min-cut；TLB、MESI、記憶體一致性。', ['al-mst-flow', 'co-vm-coherence']),
    (23, 'NP-完備 × 機率分析與字串', '歸約的方向；隨機化分析與 KMP。', ['al-np', 'al-prob']),
    (24, '複習日 #3', '模擬考：計算機結構與作業系統；重寫高信心答錯的題目。', [], ['sys']),
    (25, '弱點補強：數學', '依錯題本與 Agent 指派；做無限隨機題（行列式、特徵值、計數、遞迴）各 10 題。', []),
    (26, '弱點補強：資結演算法＋系統', '依錯題本與 Agent 指派；被退回的費曼關卡全部重交。', []),
    (27, '全真模考：資料結構與演算法', '100 分鐘計時，交卷後逐題寫錯因。', [], ['dsa']),
    (28, '全真模考：計算機結構與作業系統', '100 分鐘計時，交卷後逐題寫錯因。', [], ['sys']),
    (29, '全真模考：數學（線代＋離散）', '100 分鐘計時，交卷後逐題寫錯因。', [], ['math']),
    (30, '總複習：錯題清零＋費曼總關卡', '每一科挑三章，不看書做白紙回憶，再對照補洞。', []),
]


def parse_lessons():
    out = []
    for fn in sorted(os.listdir(C('content', 'lessons'))):
        if not fn.endswith('.md'):
            continue
        sid = fn[:-3]
        txt = io.open(C('content', 'lessons', fn), encoding='utf-8').read().replace('\r\n', '\n')
        parts = re.split(r'^=== *(\S+) *$', txt, flags=re.M)
        intro = parts[0].strip()
        if intro:
            INTROS[sid] = intro
        for i in range(1, len(parts), 2):
            cid, block = parts[i], parts[i + 1]
            head, _, body = block.partition('\n---\n')
            meta, key = {}, None
            for line in head.strip().split('\n'):
                st = line.strip()
                if st.startswith('- ') and key:
                    meta.setdefault(key + '_list', []).append(st[2:].strip())
                    continue
                m = re.match(r'^([A-Za-z_]+):\s*(.*)$', st)
                if m:
                    key = m.group(1)
                    meta[key] = m.group(2).strip()
            rubric = [x.strip() for x in meta.get('rubric', '').split('|') if x.strip()] + meta.get('rubric_list', [])
            out.append(dict(id=cid, subject=cid.split('-')[0], title=meta.get('title', cid), mins=int(meta.get('mins') or meta.get('est') or 90),
                            summary=meta.get('summary', ''), feynman=meta.get('feynman', ''), recall=meta.get('recall_list', []),
                            rubric=rubric, labs=[x.strip() for x in meta.get('labs', '').split(',') if x.strip()], body=body.strip()))
    order = {s['id']: i for i, s in enumerate(SUBJECTS)}
    out.sort(key=lambda l: order.get(l['subject'], 99))
    return out



def parse_cards(lessons):
    """從教材抽出必背卡：[!陷阱] 裡標了 ✓／✗ 的敘述 → 判斷卡；[!考點]、[!定理] → 考點卡；recall 清單 → 回想卡"""
    cards = []
    for l in lessons:
        cid, sid = l['id'], l['subject']
        lines = l['body'].split('\n'); j = 0; ntf = nk = 0
        while j < len(lines):
            t = lines[j].strip()
            m = re.match(r'^>\s*\[!(陷阱|考點|定理)\]\s*(.*)$', t)
            if not m:
                j += 1
                continue
            kind, title = m.group(1), m.group(2).strip()
            body = []; j += 1
            while j < len(lines) and lines[j].strip().startswith('>'):
                body.append(re.sub(r'^>\s?', '', lines[j].strip())); j += 1
            if kind == '陷阱':
                for b in body:
                    if not b.startswith('- '):
                        continue
                    for st, mk, ex in re.findall(r'「(.+?)」\s*(✓|✗)\s*(.*?)(?=(?:[；;]\s*)?「|$)', b[2:]):
                        ntf += 1
                        ex = ex.strip(' ：:；;。，,')
                        if ex.startswith('（') and ex.endswith('）'):
                            ex = ex[1:-1]
                        cards.append(dict(id=f'tf:{cid}:{ntf}', kind='tf', ch=cid, subject=sid, front=st, ans=(mk == '✓'), back=ex))
            else:
                nk += 1
                cards.append(dict(id=f'key:{cid}:{nk}', kind='key', ch=cid, subject=sid, front=title or ('定理' if kind == '定理' else '考點'), back='\n'.join(body), tag=kind))
        for n, q in enumerate(l.get('recall') or [], 1):
            cards.append(dict(id=f'rc:{cid}:{n}', kind='recall', ch=cid, subject=sid, front=q, back=''))
    return cards

def parse_quiz(lesson_ids):
    qs, errs = [], []
    qdir = C('content', 'quiz')
    for fn in sorted(os.listdir(qdir)):
        if not fn.endswith('.txt'):
            continue
        txt = io.open(os.path.join(qdir, fn), encoding='utf-8').read().replace('\r\n', '\n')
        for blk in re.split(r'^@q ', txt, flags=re.M)[1:]:
            head, _, rest = blk.partition('\n')
            f = [x.strip() for x in head.split('|')]
            qid, ch, diff = f[0], f[1], int(f[2]) if len(f) > 2 and f[2] else 2
            q_part, sep, expl = rest.partition('\n---\n')
            if not sep:
                q_part, expl = rest, ''
            stem, opts, ans, fill, fmt = [], [], [], [], ''
            for line in q_part.split('\n'):
                m = re.match(r'^\[( |x|X)\] (.*)$', line)
                if m:
                    if m.group(1).lower() == 'x':
                        ans.append(len(opts))
                    opts.append(m.group(2).strip())
                elif line.startswith('== '):
                    fill.append(line[3:].strip())
                elif line.startswith('?? '):
                    fmt = line[3:].strip()
                elif not opts and not fill:
                    stem.append(line)
            if opts:
                typ = 'multi' if len(ans) > 1 else 'single'
                if not ans:
                    errs.append(f'{qid}: 沒有正確選項')
            elif fill:
                typ, ans = 'fill', fill
            else:
                typ, ans = 'essay', []
            if ch not in lesson_ids:
                errs.append(f'{qid}: 章節 {ch} 不存在')
            qs.append(dict(id=qid, ch=ch, subject=ch.split('-')[0], diff=diff, type=typ, stem='\n'.join(stem).strip(),
                           opts=opts, ans=ans, expl=expl.strip(), fmt=fmt, src='bank'))
    ids = [q['id'] for q in qs]
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        errs.append('重複題號：' + ', '.join(sorted(dup)))
    return qs, errs


def main():
    lessons = parse_lessons()
    lids = {l['id'] for l in lessons}
    quiz, errs = parse_quiz(lids)
    # 題目詳解配圖：content/qfigs/*.md，「=== 題號」後面接 fig 區塊，放在詳解文字前面
    qd = C('content', 'qfigs')
    nq = 0
    if os.path.isdir(qd):
        byq = {q['id']: q for q in quiz}
        for fn in sorted(os.listdir(qd)):
            if not fn.endswith('.md'):
                continue
            txt = io.open(os.path.join(qd, fn), encoding='utf-8').read()
            for part in re.split(r'^=== ', txt, flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                qid = head.strip()
                if qid not in byq:
                    errs.append('題目配圖：找不到題號 ' + qid)
                    continue
                byq[qid]['expl'] = body.strip() + '\n\n' + (byq[qid].get('expl') or '')
                nq += body.count('```fig')
    print('題目配圖：%d 張' % nq)
    plan = []
    for row in PLAN:
        day, title, goal, ls = row[:4]
        mocks = row[4] if len(row) > 4 else []
        for l in ls:
            if l not in lids:
                errs.append(f'計畫第 {day} 天的章節 {l} 不存在')
        plan.append(dict(day=day, title=title, goal=goal, lessons=ls, mocks=mocks, review=title.startswith('複習日')))
    for sb in SUBJECTS:
        sb['intro'] = INTROS.get(sb['id'], '')
    for l in lessons:
        if l['feynman'] and not l['rubric']:
            errs.append(f"{l['id']}: 有費曼題但沒有 rubric")
    # 直觀版（小學生也看得懂）：content/intuition/*.md，以「=== 章節 id」分段
    intu = {}
    idir = C('content', 'intuition')
    if os.path.isdir(idir):
        for fn in sorted(os.listdir(idir)):
            if not fn.endswith('.md'):
                continue
            txt = io.open(os.path.join(idir, fn), encoding='utf-8').read()
            for part in re.split(r'^=== ', txt, flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                intu[head.strip()] = body.strip()
    for l in lessons:
        l['intuit'] = intu.get(l['id'], '')
    miss = [l['id'] for l in lessons if not l['intuit']]
    print('直觀版：%d/%d 章%s' % (len(lessons) - len(miss), len(lessons), ('，缺 ' + ', '.join(miss)) if miss else ''))
    # 跟著做一題：content/examples/*.md，「=== 章節 id」分段；【題目】【步驟】標題【答案】【常錯】
    wk = {}
    edir = C('content', 'examples')
    if os.path.isdir(edir):
        for fn in sorted(os.listdir(edir)):
            if not fn.endswith('.md'):
                continue
            txt = io.open(os.path.join(edir, fn), encoding='utf-8').read()
            for part in re.split(r'^=== ', txt, flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                w = dict(q='', steps=[], ans='', err='')
                cur, buf = None, []

                def flush():
                    t = '\n'.join(buf).strip()
                    if cur is None:
                        return
                    if cur[0] == 'step':
                        w['steps'].append(dict(t=cur[1], b=t))
                    else:
                        w[cur[0]] = t
                for line in body.split('\n'):
                    m = re.match(r'^【(題目|步驟|答案|常錯)】(.*)$', line)
                    if m:
                        flush()
                        cur, buf = ({'題目': ('q',), '答案': ('ans',), '常錯': ('err',)}.get(m.group(1)) or ('step', m.group(2).strip())), []
                    else:
                        buf.append(line)
                flush()
                hid = head.strip()
                if hid not in lids:
                    errs.append(f'例題 {hid} 對不到章節')
                elif not w['q'] or not w['steps'] or not w['ans']:
                    errs.append(f'例題 {hid} 缺題目、步驟或答案')
                wk[hid] = w
    for l in lessons:
        l['worked'] = wk.get(l['id'])
    # 每段配圖：content/figs/*.md，「=== 章節id 段號」後面接一或多個 ```fig 區塊，插在第 N 個「## 」標題下面
    fdir = C('content', 'figs')
    nfig = 0
    if os.path.isdir(fdir):
        add = {}
        for fn in sorted(os.listdir(fdir)):
            if not fn.endswith('.md'):
                continue
            txt = io.open(os.path.join(fdir, fn), encoding='utf-8').read()
            for part in re.split(r'^=== ', txt, flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                m = re.match(r'([\w-]+)\s+(\d+)\s*$', head.strip())
                if not m or m.group(1) not in lids:
                    errs.append('配圖標頭錯誤：' + head.strip())
                    continue
                add.setdefault(m.group(1), {})[int(m.group(2))] = body.strip()
        for l in lessons:
            if l['id'] not in add:
                continue
            lines, k, out = l['body'].split('\n'), 0, []
            for ln in lines:
                out.append(ln)
                if ln.startswith('## '):
                    k += 1
                    if k in add[l['id']]:
                        out += ['', add[l['id']][k], '']
                        nfig += add[l['id']][k].count('```fig')
            miss = [i for i in add[l['id']] if i > k]
            if miss:
                errs.append('%s 沒有第 %s 段' % (l['id'], miss))
            l['body'] = '\n'.join(out)
    print('段落配圖：%d 張' % nfig)
    # 每段「先記住」：content/leads/*.md，「=== 章節id 段號」後面接一兩句白話，插在第 N 個「## 」標題正下方
    ldir = C('content', 'leads')
    nlead = 0
    if os.path.isdir(ldir):
        lead = {}
        for fn in sorted(os.listdir(ldir)):
            if not fn.endswith('.md'):
                continue
            for part in re.split(r'^=== ', io.open(os.path.join(ldir, fn), encoding='utf-8').read(), flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                m = re.match(r'([\w-]+)\s+(\d+)\s*$', head.strip())
                if not m or m.group(1) not in lids:
                    errs.append('先記住標頭錯誤：' + head.strip())
                    continue
                lead.setdefault(m.group(1), {})[int(m.group(2))] = body.strip()
        for l in lessons:
            if l['id'] not in lead:
                continue
            out, k = [], 0
            for ln in l['body'].split('\n'):
                out.append(ln)
                if ln.startswith('## '):
                    k += 1
                    if k in lead[l['id']]:
                        out += ['', '> [!先記住]'] + ['> ' + x for x in lead[l['id']][k].split('\n')] + ['']
                        nlead += 1
            miss = [i for i in lead[l['id']] if i > k]
            if miss:
                errs.append('先記住：%s 沒有第 %s 段' % (l['id'], miss))
            l['body'] = '\n'.join(out)
    nsec = sum(len(re.findall(r'^## ', l['body'], flags=re.M)) for l in lessons)
    print('先記住：%d / %d 段' % (nlead, nsec))
    miss = [l['id'] for l in lessons if not l['worked']]
    print('跟著做：%d/%d 章，%d 步%s' % (len(lessons) - len(miss), len(lessons), sum(len(w['steps']) for w in wk.values()), ('，缺 ' + ', '.join(miss)) if miss else ''))
    methods = io.open(C('content', 'methods.md'), encoding='utf-8').read() if os.path.exists(C('content', 'methods.md')) else ''
    cards = parse_cards(lessons)
    # 卡片的白話理由（含圖）：content/card_reasons.md，以「=== 卡片 id」分段；只補沒有理由的卡
    rfiles = [C('content', 'card_reasons.md')]
    adir = C('content', 'answers')
    if os.path.isdir(adir):
        rfiles += [os.path.join(adir, f) for f in sorted(os.listdir(adir)) if f.endswith('.md')]
    if any(os.path.exists(f) for f in rfiles):
        reasons = {}
        for rp in rfiles:
            if not os.path.exists(rp):
                continue
            for part in re.split(r'^=== ', io.open(rp, encoding='utf-8').read(), flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                reasons[head.strip()] = body.strip()
        byid = {c['id']: c for c in cards}
        for k, v in reasons.items():
            if k not in byid:
                errs.append('card_reasons.md：找不到卡片 ' + k)
            elif not (byid[k].get('back') or '').strip():
                byid[k]['back'] = v
        print('卡片背面：補了 %d 張；對錯卡仍缺 %d、回想卡仍缺 %d' % (sum(1 for k in reasons if k in byid), sum(1 for c in cards if c['kind'] == 'tf' and not c['back'].strip()), sum(1 for c in cards if c['kind'] == 'recall' and not c['back'].strip())))
    # 考古題考頻：content/exams/meta.md，一行「年份 科目 題號 章節id[,章節id] 配分」；只存 metadata
    exams, freq = [], {}
    ep = C('content', 'exams', 'meta.md')
    if os.path.exists(ep):
        for ln in io.open(ep, encoding='utf-8').read().split('\n'):
            ln = ln.strip()
            if not ln or ln.startswith('#'):
                continue
            m = re.match(r'^(\d{2,3})\s+(dsal|coos|math)\s+(\S+)\s+([\w,-]+)\s+(\d+(?:\.\d+)?)$', ln)
            if not m:
                errs.append('考古題格式錯誤：' + ln)
                continue
            chs = m.group(4).split(',')
            bad = [c for c in chs if c not in lids]
            if bad:
                errs.append('考古題章節不存在：%s（%s）' % (','.join(bad), ln))
                continue
            y, pts = int(m.group(1)), float(m.group(5))
            exams.append(dict(y=y, paper=m.group(2), no=m.group(3), ch=chs, pts=pts))
        if exams:
            ymax = max(e['y'] for e in exams)
            for e in exams:
                w = 0.85 ** (ymax - e['y'])   # 越近的年份越重
                for c in e['ch']:
                    freq[c] = freq.get(c, 0) + w * e['pts'] / len(e['ch'])
            tot = sum(freq.values()) or 1
            freq = {k: round(v / tot, 4) for k, v in freq.items()}
    print('考古題：%d 題，%d 年，涵蓋 %d 章' % (len(exams), len({e['y'] for e in exams}), len(freq)))
    data = dict(subjects=SUBJECTS, lessons=lessons, quiz=quiz, plan=plan, methods=methods, cards=cards, exams=exams, examFreq=freq, built=__import__('datetime').date.today().isoformat())
    js = 'window.CSDATA = ' + json.dumps(data, ensure_ascii=False) + ';\n'
    io.open(C('web', 'js', 'data.js'), 'w', encoding='utf-8').write(js)
    # 自我檢查頁：跟 index.html 同一套腳本，多一個 selftest.js，不連 bridge、不動到真正的進度
    ih = io.open(C('web', 'index.html'), encoding='utf-8').read()
    st = ih.replace('<script src="js/data.js"></script>', '<script>window.SELFTEST = true;</script>\n<script src="js/data.js"></script>', 1)
    st = st.replace('</body>', '<script src="js/selftest.js"></script>\n</body>', 1).replace('<title>', '<title>自我檢查｜', 1)
    io.open(C('web', 'selftest.html'), 'w', encoding='utf-8').write(st)
    # single-file build
    html = io.open(C('web', 'index.html'), encoding='utf-8').read()
    css = io.open(C('web', 'style.css'), encoding='utf-8').read()
    import base64 as _b64
    kcss = io.open(C('web', 'vendor', 'katex.min.css'), encoding='utf-8').read()
    kcss = re.sub(r'url\(fonts/([^)]+\.woff2)\)', lambda m: 'url(data:font/woff2;base64,' + _b64.b64encode(open(C('web', 'vendor', 'fonts', m.group(1)), 'rb').read()).decode() + ')', kcss)
    html = html.replace('<link rel="stylesheet" href="vendor/katex.min.css">\n', '<style>\n' + kcss + '\n</style>\n')
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')

    def inline(m):
        src = m.group(1)
        if src.startswith('http'):
            return m.group(0)
        code = io.open(C('web', src), encoding='utf-8').read().replace('</script', '<\\/script')
        return '<script>\n' + code + '\n</script>'
    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    # 單檔版不能安裝、沒有 icons 資料夾：拿掉 manifest，圖示改成內嵌
    import base64
    ico = 'data:image/png;base64,' + base64.b64encode(open(C('web', 'icons', 'icon-192.png'), 'rb').read()).decode()
    html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', '').replace('href="icons/icon-192.png"', 'href="' + ico + '"')
    html = re.sub(r'<link rel="apple-touch-icon"[^>]*>\n', '', html)
    os.makedirs(C('dist'), exist_ok=True)
    # 可安裝成 App：manifest ＋ service worker（先拿網路的新版，斷線才用快取；API 一律不快取）
    shell = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'vendor/katex.min.js', 'vendor/katex.min.css'] + \
        ['vendor/fonts/' + f for f in sorted(os.listdir(C('web', 'vendor', 'fonts')))] + \
        ['icons/' + f for f in sorted(os.listdir(C('web', 'icons'))) if f.endswith('.png')] + \
        re.findall(r'<script src="(js/[^"]+)"></script>', io.open(C('web', 'index.html'), encoding='utf-8').read())
    import hashlib
    hs = hashlib.sha1()
    for f in shell[1:]:
        hs.update(open(C('web', f), 'rb').read() if os.path.exists(C('web', f)) else b'')
    manifest = dict(name='資工所衝刺站', short_name='衝刺站', description='台大資工所考試：每天打開按開始，一次只做一件事。',
                    lang='zh-Hant', start_url='./index.html#go', scope='./', display='standalone', orientation='any',
                    background_color='#eef1f5', theme_color='#2f4fd8',
                    icons=[dict(src='icons/icon-192.png', sizes='192x192', type='image/png'),
                           dict(src='icons/icon-512.png', sizes='512x512', type='image/png'),
                           dict(src='icons/maskable-512.png', sizes='512x512', type='image/png', purpose='maskable')],
                    shortcuts=[dict(name='開始今天', url='./index.html#go'), dict(name='必背卡', url='./index.html#cards')])
    io.open(C('web', 'manifest.webmanifest'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=1))
    sw = '''/* 由 build.py 產生，請勿手改。版本：%s */
const V = 'csgrad-%s', SHELL = %s;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/api/') >= 0) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
''' % (hs.hexdigest()[:10], hs.hexdigest()[:10], json.dumps(shell, ensure_ascii=False))
    io.open(C('web', 'sw.js'), 'w', encoding='utf-8').write(sw)
    io.open(C('dist', 'single.html'), 'w', encoding='utf-8').write(html)
    nq = {}
    for q in quiz:
        nq[q['subject']] = nq.get(q['subject'], 0) + 1
    cs = data['cards']; ck = {}
    for c in cs:
        ck[c['kind']] = ck.get(c['kind'], 0) + 1
    print(f'章節 {len(lessons)}，題目 {len(quiz)} {nq}，計畫 {len(plan)} 天，必背卡 {len(cs)} {ck}')
    for e in errs:
        print('  [警告]', e)
    return 1 if errs else 0


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())

# -*- coding: utf-8 -*-
"""課程規格檢查程式：python tools/check.py [-v]

跑知識點圖的拓撲排序，逐條檢查 H1–H4、H6–H8、H15–H17（其餘規則由 tests/beginner_walk.js 檢查）。
輸出每條規則的違規數；全部 0 才結束碼 0。結果另存 tools/check_report.json，題目指派存 content/qmap.json。
"""
import os, re, io, json, sys, datetime
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import curriculum as cu  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
VERBOSE = '-v' in sys.argv
EXAM = datetime.date(2027, 1, 30)   # 116 學年度，資工／AI 聯招（905）
TODAY = datetime.date.today()


def main():
    G = cu.load()
    nodes, pre = G['nodes'], G['pre']
    pi, cyc, anc, ch, need = cu.topo(G)
    pos = {k: i for i, k in enumerate(pi)}
    V = {}          # 規則 → 違規清單
    info = {}

    # H1 無環
    V['H1'] = [f'環上的點：{k}' for k in cyc]
    if len(pi) != len(nodes):
        V['H1'].append(f'Kahn 只輸出 {len(pi)}/{len(nodes)} 個點')

    # H2 可達：根只能是地基節點
    V['H2'] = [f'{k}（{nodes[k]["title"]}）沒有先修，卻不是地基節點' for k in nodes if not pre[k] and nodes[k]['kind'] != 'f']
    V['H2'] += G['errs']

    # H3 π 是拓撲序
    V['H3'] = [f'{p} → {k} 但 π 中 {k} 在前' for k, ps in pre.items() for p in ps if p in pos and k in pos and pos[p] > pos[k]]

    # H4 題目不超前
    qa = cu.assign(G, pi, anc)
    V['H4'] = [f'{qid}（{i["ch"]}）→ {i["kp"]}：用到還沒教的 {"、".join(i["bad"])}' for qid, i in qa.items() if not i['ok']]
    info['H4_未修正前（題目放在本章最像的一節）違規'] = sum(1 for i in qa.values() if not i['base_ok'])
    info['H4_自動搬家的題目'] = sum(1 for i in qa.values() if i.get('moved'))
    info['H4_搬到別章的題目'] = sum(1 for qid, i in qa.items() if i.get('moved') and nodes[i['kp']]['ch'] != i['ch'])
    io.open(cu.C('content', 'qmap.json'), 'w', encoding='utf-8').write(
        json.dumps({qid: i['kp'] for qid, i in qa.items()}, ensure_ascii=False, indent=0))
    bad_terms = Counter(t for i in qa.values() for t in i['base_bad'])

    # H6 內容完整
    byk = defaultdict(list)
    for qid, i in qa.items():
        i['qid'] = qid
        byk[i['kp']].append(i)
    QTYPE = {q['id']: q['type'] for q in G['quiz']}
    V['H6'] = []
    dup = [q for q, n in Counter(q['id'] for q in G['quiz']).items() if n > 1]
    V['H6'] += [f'題號重複：{q}（後面那題會蓋掉前面那題）' for q in dup]
    miss = Counter()
    for k in pi:
        kp = G['kp'].get(k)
        lack = []
        if not kp or not any(x['t'] == 'md' for x in kp['items']):
            lack.append('白話教學')
        if not kp or not kp['examples']:
            lack.append('例題')
        qs = byk.get(k, [])
        if len(qs) < 3:
            lack.append(f'練習 {len(qs)}/3')
        if not any(i['diff'] == 1 for i in qs):
            lack.append('★入門題')
        for x in lack:
            miss[x.split(' ')[0]] += 1
        if lack:
            V['H6'].append(f'{k} 缺：{"、".join(lack)}')
    info['H6_缺項統計'] = dict(miss)

    # H7 互動密度：顯示給學生的教學序列，任兩個互動間純閱讀 ≤250 字、影片 ≤90 秒
    V['H7'] = []
    INTER = {'mc', 'fill', 'write', 'order', 'lab'}
    for k in pi:
        kp = G['kp'].get(k)
        if kp:
            seq = kp['items']
        else:
            seq = [{'t': 'md', 'text': nodes[k]['text']}] if nodes[k]['text'] else []
        gap_c, gap_v, worst = 0, 0.0, (0, 0.0)
        for x in seq + [{'t': 'mc'}]:
            if x['t'] in INTER:
                if gap_c > 250 or gap_v > 90:
                    worst = max(worst, (gap_c, gap_v))
                gap_c, gap_v = 0, 0.0
            elif x['t'] == 'md':
                gap_c += cu.read_chars(x['text'])
            elif x['t'] == 'video':
                cap = VID.get(x['clip'], {})
                b = x['b'] if x['b'] is not None else cap.get('dur', 999)
                gap_v += b - x['a']
        if worst != (0, 0.0):
            V['H7'].append(f'{k}：一段純閱讀 {worst[0]} 字' + (f'＋影片 {worst[1]:.0f} 秒' if worst[1] else ''))
        if not seq:
            V['H7'].append(f'{k}：沒有任何教學內容')

    # I1–I4 互動規格（課程規格「互動規格」）：手、筆、題目一起動
    for r in ('I1', 'I2', 'I3', 'I4'):
        V[r] = []
    HAND, PEN = {'mc', 'fill', 'order', 'lab'}, {'write'}
    for k in pi:
        kp = G['kp'].get(k)
        seq = kp['items'] if kp else ([{'t': 'md', 'text': nodes[k]['text']}] if nodes[k]['text'] else [])
        first = 0
        for x in seq:
            if x['t'] in INTER:
                break
            if x['t'] == 'md':
                first += cu.read_chars(x['text'])
        if first > 250 or not any(x['t'] in INTER for x in seq):
            V['I1'].append(f'{k}：開頭 {first} 字才第一次動手' if any(x['t'] in INTER for x in seq) else f'{k}：教的部分沒有任何互動')
        ni = sum(1 for x in seq if x['t'] in INTER)
        nw = sum(1 for e in ((kp or {}).get('examples') or []) for st in e['steps'] if st['w'])
        nq = len(byk.get(k, []))
        lack = [f'教的互動 {ni}/4'] if ni < 4 else []
        if nw < 2:
            lack.append(f'例題 @寫 {nw}/2')
        if nq < 3:
            lack.append(f'練習 {nq}/3')
        if lack:
            V['I3'].append(f'{k}：' + '、'.join(lack))
        kinds = {x['t'] for x in seq if x['t'] in INTER}
        pen = bool(kinds & PEN) or nw > 0 or any(QTYPE.get(i['qid']) == 'essay' for i in byk.get(k, []))
        lack = []
        if len(kinds) < 2:
            lack.append(f'教只有 {len(kinds)} 種互動')
        if not pen:
            lack.append('沒有任何「筆」')
        if lack:
            V['I4'].append(f'{k}：' + '、'.join(lack))
    V['I2'] = list(V['H7'])     # I2 ＝ H7（同一條規則，兩個名字都報）

    # H8 例題要動手寫
    V['H8'] = []
    for k in pi:
        kp = G['kp'].get(k)
        for j, e in enumerate((kp or {}).get('examples') or [], 1):
            if not any(s['w'] for s in e['steps']):
                V['H8'].append(f'{k} 例題 {j} 沒有「先寫」的步驟')
    # 舊的章例題（content/examples）若仍會顯示，也算
    legacy = 0
    edir = cu.C('content', 'examples')
    if os.path.isdir(edir) and "C('content', 'examples')" in io.open(cu.C('build.py'), encoding='utf-8').read():
        for fn in os.listdir(edir):
            t = io.open(os.path.join(edir, fn), encoding='utf-8').read()
            for blk in re.split(r'^=== ', t, flags=re.M)[1:]:
                if '【寫】' not in blk:
                    legacy += 1
                    V['H8'].append(f'舊章例題 {blk.split(chr(10))[0].strip()} 沒有「先寫」的步驟')
    info['H8_舊章例題'] = legacy

    # H15 只有一種影片播放器
    V['H15'] = []
    used = re.findall(r'<script src="js/([^"]+)"></script>', io.open(cu.C('web', 'index.html'), encoding='utf-8').read())   # 只看網頁真的有載入的
    js = {fn: io.open(cu.C('web', 'js', fn), encoding='utf-8').read() for fn in used if fn != 'data.js' and os.path.exists(cu.C('web', 'js', fn))}
    players = []
    for fn, s in js.items():
        n = len([1 for line in s.split('\n') if '<video' in line and 'cam-' not in line])
        if n:
            players.append(f'{fn}：<video> × {n}')
    for fn, s in js.items():
        if 'getContext(' in s and re.search(r'def\(\{\s*id:', s) and ('draw(t)' in s or 'X.draw(' in s):
            players.append(f'{fn}：即時繪圖動畫引擎（canvas）')
    if len(players) > 1:
        V['H15'] = ['播放器不只一種：' + '；'.join(players)]
    info['H15_播放器'] = players

    # H16 影片不超前
    V['H16'] = []
    for clip, ref in G['vmap'].items():
        k, a, b = cu.vref(ref)
        if k not in nodes:
            V['H16'].append(f'{clip} 對應的 {k} 不存在'); continue
        cap = VID.get(clip)
        if not cap:
            V['H16'].append(f'{clip} 找不到字幕檔'); continue
        al = anc[k] | {k}
        b = b if b is not None else cap['dur']
        if b - a > 90:
            info.setdefault('H16_超過90秒的影片（嵌進教學時要切段）', []).append(f'{clip} {b - a:.0f}s')
        bad = sorted({t for t, ds in G['terms'].match('\n'.join(t for s, e, t in cap['lines'] if e > a and s < b)) if not (ds & al)})
        if bad:
            V['H16'].append(f'{clip} → {k}：字幕用到還沒教的 {"、".join(bad)}')
    for k in pi:
        kp = G['kp'].get(k)
        for x in (kp or {}).get('items') or []:
            if x['t'] == 'video':
                cap = VID.get(x['clip'])
                if not cap:
                    V['H16'].append(f'{k} 嵌的影片 {x["clip"]} 不存在'); continue
                b = x['b'] if x['b'] is not None else cap['dur']
                txt = '\n'.join(t for s, e, t in cap['lines'] if e > x['a'] and s < b)
                al = anc[k] | {k}
                bad = sorted({t for t, ds in G['terms'].match(txt) if not (ds & al)})
                if bad:
                    V['H16'].append(f'{k} 嵌的 {x["clip"]} {x["a"]:.0f}-{b:.0f}s：用到還沒教的 {"、".join(bad)}')

    # 影片有對應知識點、但那個知識點寫好了卻沒嵌進去（警告）
    unused = []
    for clip, ref in G['vmap'].items():
        k = cu.vref(ref)[0]
        kp = G['kp'].get(k)
        if kp and not any(x['t'] == 'video' and x['clip'] == clip for kk in G['kp'].values() for x in kk['items']):
            unused.append(f'{clip}→{k}')
    if unused:
        info['影片還沒放進已寫好的知識點'] = unused
        V['H16'] += [f'{u}：知識點寫好了，影片還沒嵌進去（課程規格「影片都要嵌進知識點」）' for u in unused]

    # I15 不能靠猜位置：看 build 之後（洗過牌）的 web/js/data.js，單選題正解在每個位置的比例 ≤ 1/選項數 ＋ 10%（樣本 ≥ 20 題才算）
    V['I15'] = []
    try:
        dj = io.open(os.path.join(cu.ROOT, 'web', 'js', 'data.js'), encoding='utf-8').read()
        D = json.loads(dj[dj.index('{'):dj.rindex('}') + 1])
        groups = [('題庫', [q for q in D['quiz'] if q.get('type') == 'single']),
                  ('知識點互動', [x for v in D['kp']['nodes'].values() for x in (v.get('items') or []) if x.get('t') == 'mc' and len(x.get('ans') or []) == 1])]
        for name, items in groups:
            for n in sorted({len(x['opts']) for x in items}):
                sub = [x for x in items if len(x['opts']) == n]
                if len(sub) < 20:
                    continue
                c = Counter(x['ans'][0] for x in sub)
                for pos, cnt in sorted(c.items()):
                    if cnt / len(sub) > 1 / n + 0.1:
                        V['I15'].append(f'{name}：{n} 個選項的 {len(sub)} 題裡，正解在第 {pos + 1} 個的佔 {cnt / len(sub):.0%}')
    except Exception as e:  # noqa: BLE001
        V['I15'].append(f'讀不到 web/js/data.js（先跑 python build.py）：{e}')

    # H17 份量：每點 25–40 分鐘；每日排程 ≤ 設定
    V['H17'] = []
    mins = {k: cu.kp_mins(G, k) for k in pi}
    for k in pi:
        if not (25 <= mins[k] <= 40):
            V['H17'].append(f'{k}：{mins[k]} 分鐘')
    left = (EXAM - TODAY).days
    info[f'H17_距考試天數（{EXAM.isoformat()}）'] = left
    for h in (2, 4, 6, 8):
        cap = round(h * 60 * 0.6)     # 每日時數的 60% 給新知識點，其餘給回想、卡片、複習、練習
        days = cu.plan_days(pi, mins, cap)
        over = [d for d in days if sum(mins[k] for k in d) > cap and len(d) > 1]
        info[f'H17_每天 {h} 小時：上完所有知識點要幾天'] = len(days)
        if over:
            V['H17'].append(f'每天 {h} 小時：{len(over)} 天超過上限')

    # 術語表品質（警告，不算違規）：小節的術語應該出現在該小節內文
    warn = []
    for k, ts in G['tmap'].items():
        if k.startswith('_') or k not in nodes or nodes[k]['kind'] != 's':
            continue
        body = (nodes[k]['title'] + '\n' + nodes[k]['text'] + '\n'
                + json.dumps(G['kp'].get(k, {}), ensure_ascii=False)).lower()
        miss_t = [t for t in ts if t.lower() not in body]
        if len(miss_t) == len(ts):
            warn.append(f'{k}：{len(ts)} 個術語都不在內文（{"、".join(ts[:4])}…）')

    # ---- 輸出 ----
    total = sum(len(v) for r, v in V.items() if r != 'I2')   # I2 跟 H7 是同一條，不重複算
    print(f'知識點 {len(nodes)} 個（地基 {sum(1 for n in nodes.values() if n["kind"] == "f")}、小節 {sum(1 for n in nodes.values() if n["kind"] == "s")}），先修邊 {sum(len(p) for p in pre.values())} 條，題目 {len(qa)} 題，KP 內容 {len(G["kp"])} 個')
    print(f'π 前 12 個：{" → ".join(pi[:12])}')
    print()
    names = {'H1': '無環', 'H2': '可達', 'H3': 'π 是拓撲序', 'H4': '題目不超前', 'H6': '內容完整', 'H7': '互動密度', 'H8': '例題動手寫',
             'H15': '單一播放器', 'H16': '影片不超前', 'H17': '份量', 'I1': '一進來就動手', 'I2': '不一直盯著', 'I3': '動手次數', 'I4': '手筆題目都有', 'I15': '不能猜位置'}
    for r in ['H1', 'H2', 'H3', 'H4', 'H6', 'H7', 'H8', 'H15', 'H16', 'H17', None, 'I1', 'I2', 'I3', 'I4', 'I15']:
        if r is None:
            print('  ── 互動規格 ──'); continue
        v = V[r]
        print(f'{r:<4} {names[r]:<8} 違規 {len(v):>4}')
        for x in (v if VERBOSE else v[:3]):
            print('       ·', x)
        if not VERBOSE and len(v) > 3:
            print(f'       … 還有 {len(v) - 3} 條（加 -v 看全部）')
    print()
    for k, x in info.items():
        print(f'  {k}：{x}')
    print(f'  H4_最常超前的術語：{"、".join(f"{t}×{n}" for t, n in bad_terms.most_common(12))}')
    if warn:
        print(f'  術語表警告 {len(warn)} 條：', '；'.join(warn[:3]))
    print()
    print(f'違規合計 {total}（I2＝H7 不重複算；H5、H9–H14、H18、H19、I5–I14 由 tests/beginner_walk.js 檢查）')
    rep = dict(date=str(TODAY), counts={r: len(v) for r, v in V.items()}, total=total, info=info, violations=V, order=pi,
               bad_terms=bad_terms.most_common(60), warn=warn)
    io.open(cu.C('tools', 'check_report.json'), 'w', encoding='utf-8').write(json.dumps(rep, ensure_ascii=False, indent=1))
    return 1 if total else 0


VID = cu.video_captions()

if __name__ == '__main__':
    sys.exit(main())

"""新題庫（content/quiz/b-*.txt）的「不水」檢查。規則定義在 content/題庫規劃.md 的「什麼不算水題」。
用法：python3 tools/qlint.py        （印每個知識點的題數、難度分布、形式數，和違規）"""
import io, os, re, sys, collections
FORMS = {'觀念', '陷阱', '計算', '追蹤', '情境', '比較', '找錯', '反例', '證明'}
D = os.path.join(os.path.dirname(__file__), '..', 'content', 'quiz')
qs, bad = [], []
for fn in sorted(os.listdir(D)):
    if not (fn.startswith('b-') and fn.endswith('.txt')): continue
    txt = io.open(os.path.join(D, fn), encoding='utf-8').read().replace('\r\n', '\n')
    for blk in re.split(r'^@q ', txt, flags=re.M)[1:]:
        head, _, rest = blk.partition('\n'); f = [x.strip() for x in head.split('|')]
        qid, kp = f[0], f[1]; diff = int(f[2]) if len(f) > 2 and f[2] else 2; form = f[3] if len(f) > 3 else ''
        body, sep, expl = rest.partition('\n---\n')
        opts = re.findall(r'^\[( |x|X)\] (.*)$', body, re.M); fill = re.findall(r'^== (.*)$', body, re.M)
        stem = '\n'.join(l for l in body.split('\n') if not re.match(r'^(\[( |x|X)\] |== |\?\? )', l)).strip()
        q = dict(id=qid, kp=kp, diff=diff, form=form, opts=[o[1] for o in opts], ans=[i for i, o in enumerate(opts) if o[0] != ' '], fill=fill, stem=stem, expl=expl.strip(), fn=fn)
        qs.append(q)
        tf = [o.strip() for o in q['opts']] in (['對', '不對'], ['不對', '對'])
        if form not in FORMS: bad.append(f'{qid}：沒有形式標籤或標籤不對（{form}）')
        if len(q['expl']) < 15: bad.append(f'{qid}：詳解太短（要說為什麼，不能只寫答案）')
        if q['opts'] and not tf and len(q['opts']) < 3: bad.append(f'{qid}：選擇題至少 3 個選項（是非題除外）')
        if any(re.search(r'以上皆(是|非)|都對|都錯', o) for o in q['opts']): bad.append(f'{qid}：不要用「以上皆是／皆非」')
        if q['opts'] and not q['ans']: bad.append(f'{qid}：沒有正確選項')
        if not q['opts'] and not q['fill'] and form != '證明': bad.append(f'{qid}：沒有答案（申論題要標「證明」）')
        if len(q['stem']) < 12: bad.append(f'{qid}：題幹太短')
        q['tf'] = tf
ids = [q['id'] for q in qs]
for x in {i for i in ids if ids.count(i) > 1}: bad.append(f'{x}：題號重複')
norm = lambda t: re.sub(r'\s+', '', t)
seen = {}
for q in qs:
    k = norm(q['stem']) + '|' + '|'.join(q['opts'])
    if k in seen: bad.append(f"{q['id']}：跟 {seen[k]} 題目一樣")
    seen[k] = q['id']
by = collections.defaultdict(list)
for q in qs: by[q['kp']].append(q)
print(f'新題庫 {len(qs)} 題，{len(by)} 個知識點')
for kp, L in sorted(by.items()):
    n = len(L); d = collections.Counter(q['diff'] for q in L); forms = collections.Counter(q['form'] for q in L); tf = sum(q['tf'] for q in L)
    print(f'  {kp}：{n} 題｜難度 1/2/3 = {d[1]}/{d[2]}/{d[3]}｜形式 {len(forms)} 種｜是非 {tf}')
    if n >= 20:
        if d[1] > 0.25 * n: bad.append(f'{kp}：難度 1 超過 25%（{d[1]}/{n}）')
        if d[3] < 0.25 * n: bad.append(f'{kp}：難度 3 不到 25%（{d[3]}/{n}）')
        if tf > 0.15 * n: bad.append(f'{kp}：是非題超過 15%（{tf}/{n}）')
        if forms['觀念'] > 0.3 * n: bad.append(f'{kp}：純觀念題超過 30%（{forms["觀念"]}/{n}）')
        for need in ('陷阱', '計算', '情境'):
            if not forms[need] and not (need == '計算' and forms['追蹤']): bad.append(f'{kp}：缺「{need}」形式')
        if len(forms) < 5: bad.append(f'{kp}：形式少於 5 種')
print('違規：', len(bad)); [print('  ·', b) for b in bad[:60]]
sys.exit(1 if bad else 0)

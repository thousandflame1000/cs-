#!/usr/bin/env python3
"""考古題 → 章節 metadata 草稿。

用法：python3 exam_tag.py 考古題/*.pdf [--out 草稿.md]

做的事：
  1. 讀 PDF 文字（優先用 pdftotext，沒有就用 pypdf）
  2. 依題號切題、抓配分（「（10 分）」「10%」「10 points」）
  3. 用各章的標題、小節標題、先記住裡的關鍵字，建議最可能的 1～2 章
  4. 印出草稿：年份 科目 題號 章節 配分（＋ 信心分數），人工核對後貼進 content/exams/meta.md

只輸出 metadata；題目文字只在終端機顯示前 24 個字給人核對，不寫進任何檔案。
"""
import io
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PAPERS = [('dsal', ('資料結構', '演算法', 'algorithm', 'data structure')),
          ('coos', ('計算機', '作業系統', 'computer', 'operating')),
          ('math', ('數學', '線性代數', '離散', 'linear', 'discrete'))]
SUBJ_OF_PAPER = {'dsal': ('ds', 'al'), 'coos': ('co', 'os'), 'math': ('la', 'dm')}


def pdf_text(path):
    if shutil.which('pdftotext'):
        r = subprocess.run(['pdftotext', '-layout', path, '-'], capture_output=True)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.decode('utf-8', 'ignore')
    try:
        import pypdf
        return '\n'.join((p.extract_text() or '') for p in pypdf.PdfReader(path).pages)
    except Exception as e:  # noqa
        sys.exit('讀不到 %s：%s' % (path, e))


def guess_meta(path, text):
    name = os.path.basename(path)
    y = re.search(r'(?<!\d)(1[0-2]\d|9\d)(?!\d)', name) or re.search(r'(?<!\d)(1[0-2]\d|9\d)\s*學年度', text)
    year = int(y.group(1)) if y else 0
    hay = (name + ' ' + text[:400]).lower()
    paper = next((p for p, keys in PAPERS if any(k.lower() in hay for k in keys)), '?')
    return year, paper


QSTART = re.compile(r'^\s*(?:第\s*(\d{1,2})\s*題|(\d{1,2})\s*[\.．、)）](?!\d)|[（(](\d{1,2})[)）]|Problem\s+(\d{1,2})|Q(\d{1,2})[\.:])', re.I | re.M)
PTS = re.compile(r'[（(]\s*(\d{1,2})\s*(?:分|%|points?|pts?)\s*[)）]|(\d{1,2})\s*(?:分|%|points|pts)(?![\w])', re.I)


def split_questions(text):
    out, last = [], None
    for m in QSTART.finditer(text):
        no = int(next(g for g in m.groups() if g))
        # 題號要遞增（避免把小題 (1)(2) 或內文的數字當成大題）
        if last is not None and no != last + 1:
            continue
        out.append([no, m.start()])
        last = no
    qs = []
    for i, (no, st) in enumerate(out):
        en = out[i + 1][1] if i + 1 < len(out) else len(text)
        body = text[st:en]
        pm = PTS.search(body)
        pts = int(next(g for g in pm.groups() if g)) if pm else 0
        qs.append(dict(no=no, body=body, pts=pts))
    return qs


def load_keywords():
    """每章的關鍵字：章名、各小節標題、先記住裡的英文術語。"""
    kw = {}
    ldir = os.path.join(ROOT, 'content', 'lessons')
    leads = {}
    lpath = os.path.join(ROOT, 'content', 'leads')
    if os.path.isdir(lpath):
        for fn in os.listdir(lpath):
            for part in re.split(r'^=== ', io.open(os.path.join(lpath, fn), encoding='utf-8').read(), flags=re.M)[1:]:
                head, _, body = part.partition('\n')
                leads.setdefault(head.split()[0], []).append(body)
    for fn in sorted(os.listdir(ldir)):
        txt = io.open(os.path.join(ldir, fn), encoding='utf-8').read()
        for part in re.split(r'^=== ', txt, flags=re.M)[1:]:
            head, _, rest = part.partition('\n')
            cid = head.strip()
            title = (re.search(r'^title:\s*(.+)$', rest, re.M) or [None, ''])[1]
            heads = re.findall(r'^## (?:\d+\.\s*)?(.+)$', rest, re.M)
            words = set()
            for t in [title] + heads + leads.get(cid, []):
                t = re.sub(r'\$[^$]*\$', ' ', t)
                for w in re.split(r'[\s、，。：；（）()／/＋+「」？！·\-–—]+', t):
                    w = w.strip()
                    if len(w) >= 2 and not re.fullmatch(r'\d+', w) and w not in ('分析', '性質', '基本', '應用', '其他', '進階', '定義', '方法'):
                        words.add(w)
            kw[cid] = words
    return kw


def suggest(body, kw, paper):
    low = body.lower()
    allow = SUBJ_OF_PAPER.get(paper)
    sc = []
    for cid, words in kw.items():
        if allow and cid.split('-')[0] not in allow:
            continue
        s = sum((2 if re.search(r'[A-Za-z]', w) else 1) * min(3, low.count(w.lower())) for w in words)
        if s:
            sc.append((s, cid))
    sc.sort(reverse=True)
    return sc[:2]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    if out in args:
        args.remove(out)
    if not args:
        sys.exit(__doc__)
    kw = load_keywords()
    lines = []
    for path in args:
        text = pdf_text(path)
        year, paper = guess_meta(path, text)
        qs = split_questions(text)
        print('\n#### %s：%s 年 %s，切出 %d 題' % (os.path.basename(path), year or '?', paper, len(qs)))
        for q in qs:
            sg = suggest(q['body'], kw, paper)
            ch = sg[0][1] if sg else '??'
            if len(sg) > 1 and sg[1][0] >= sg[0][0] * .8:
                ch += ',' + sg[1][1]
            conf = sg[0][0] if sg else 0
            peek = re.sub(r'\s+', ' ', q['body'])[:24]
            print('  %-3s %-28s %3s 分  信心 %-3d ｜%s…' % (q['no'], ch, q['pts'] or '?', conf, peek))
            lines.append('%s %s %s %s %s' % (year or '???', paper, q['no'], ch, q['pts'] or 0))
    if out:
        io.open(out, 'w', encoding='utf-8').write('# exam_tag.py 草稿：核對章節與配分後，貼進 content/exams/meta.md\n' + '\n'.join(lines) + '\n')
        print('\n草稿寫到 %s（只有 metadata）' % out)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()

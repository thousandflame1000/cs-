# -*- coding: utf-8 -*-
"""資工所衝刺站 Agent 工具（土法橋接：只讀寫 bridge/ 底下的檔案）

給 Claude Code、Codex 或任何能跑指令的 AI 使用。完整規則見 AGENTS.md。

  python agent.py watch [--timeout 540] [--name 帳號A] [--only feynman,essay]
                                          等待學生的新訊息（有新訊息就印出並結束）；多個 Agent 用 --name 區分、--only 分工
  python agent.py pending                 列出還沒回覆／審查的訊息
  python agent.py show <id>               顯示一則訊息的完整內容
  python agent.py lesson <章節id>         印出該章教材（審費曼關卡前先讀）
  python agent.py reply <id> --text "…"   回覆（也可 --file 回覆.md；--file - 表示從 stdin 讀）
  python agent.py grade <id> --verdict pass|revise --score 85 --file 評語.md
  python agent.py note --text "…"         主動發訊息
  python agent.py supervise [--auto] [--text …|--file …] [--tasks "a;b;c"] [--date YYYY-MM-DD]
  python agent.py plan --tasks "a;b;c" [--date YYYY-MM-DD]
  python agent.py quiz --file 題目.json   出題（格式見 AGENTS.md）
  python agent.py report [--json]         讀學生進度摘要
  python agent.py heartbeat               更新「Agent 監聽中」狀態
"""
import argparse
import io
import json
import os
import re
import sys
import time
import uuid
from datetime import date, datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
BR = os.path.join(ROOT, 'bridge')
INBOX = os.path.join(BR, 'inbox.jsonl')
OUTBOX = os.path.join(BR, 'outbox.jsonl')
STATE = os.path.join(BR, 'agent_state.json')
PROGRESS = os.path.join(BR, 'progress.json')
HEART = os.path.join(BR, 'heartbeat.json')
NEEDS_ANSWER = {'ask', 'feynman', 'essay', 'blurt', 'checkin', 'request', 'reflect'}
TYPE_ZH = {'ask': '提問', 'feynman': '費曼關卡', 'essay': '申論作答', 'blurt': '白紙回憶', 'checkin': '晚間打卡', 'request': '請求', 'event': '事件'}


def now_iso():
    return datetime.now().astimezone().isoformat(timespec='seconds')


def read_jsonl(path):
    out = []
    if not os.path.exists(path):
        return out
    with io.open(path, encoding='utf-8') as f:
        for i, line in enumerate(f):
            s = line.strip()
            if not s:
                continue
            try:
                m = json.loads(s)
                if not isinstance(m, dict):
                    raise ValueError
            except Exception:
                m = {'type': 'note', 'text': s, 'id': 'txt-%d' % i}
            m.setdefault('id', 'line-%d' % i)
            out.append(m)
    return out


def load_json(path, default):
    try:
        with io.open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, obj):
    tmp = path + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def append_out(msg):
    os.makedirs(BR, exist_ok=True)
    msg.setdefault('id', 'a-' + uuid.uuid4().hex[:10])
    msg.setdefault('ts', now_iso())
    msg['from'] = 'agent'
    with io.open(OUTBOX, 'a', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(msg, ensure_ascii=False) + '\n')
    print('已寫入 outbox：%s %s' % (msg['type'], msg['id']))
    return msg


def heartbeat(status='watching', name=None):
    save_json(HEART, {'ts': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'), 'status': status, 'agent': name or os.environ.get('AGENT_NAME', 'agent')})


def load_data():
    p = os.path.join(ROOT, 'web', 'js', 'data.js')
    try:
        txt = io.open(p, encoding='utf-8').read()
        return json.loads(txt[txt.index('{'):txt.rindex('}') + 1])
    except Exception:
        return {'lessons': [], 'quiz': [], 'plan': [], 'subjects': []}


def get_text(args):
    if getattr(args, 'text', None):
        return args.text
    if getattr(args, 'file', None):
        if args.file == '-':
            return sys.stdin.read()
        return io.open(args.file, encoding='utf-8').read()
    return ''


def fmt_msg(m, data=None):
    data = data or {}
    lessons = {l['id']: l for l in data.get('lessons', [])}
    ctx = m.get('ctx') or {}
    t = m.get('type', '?')
    lines = ['=' * 70, '[%s] %s  id=%s  %s' % (TYPE_ZH.get(t, t), ctx.get('title', ''), m.get('id'), local_ts(m.get('ts', ''))), '-' * 70]
    if t == 'feynman':
        lines += ['章節：%s（%s）第 %s 次提交' % (ctx.get('title'), ctx.get('lesson'), ctx.get('attempt', 1)),
                  '題目：' + str(ctx.get('prompt', '')), '必須涵蓋的關鍵點（rubric）：']
        lines += ['  %d. %s' % (i + 1, r) for i, r in enumerate(ctx.get('rubric', []))]
        lines += ['學生的解釋：', m.get('text', ''),
                  '→ 審查後：python agent.py grade %s --verdict pass|revise --score N --file 評語.md' % m.get('id'),
                  '  （教材原文：python agent.py lesson %s）' % ctx.get('lesson')]
    elif t == 'essay':
        if ctx.get('mock'):
            lines += ['模擬考申論題（%s），選擇題 %s，用時 %s 分' % (ctx.get('mock'), ctx.get('objective'), ctx.get('minutes'))]
            quiz = {q['id']: q for q in data.get('quiz', [])}
            for qid in ctx.get('qids', []):
                q = quiz.get(qid)
                if q:
                    lines += ['--- 參考解答 %s ---' % qid, q.get('expl', '')]
        else:
            lines += ['題目：' + str(ctx.get('stem', '')), '參考解答：' + str(ctx.get('reference', ''))]
        lines += ['學生作答：', m.get('text', ''), '→ 批改：python agent.py grade %s --verdict pass|revise --score N --file 評語.md' % m.get('id')]
    elif t == 'blurt':
        ls = ctx.get('lessons', [])
        lines += ['回憶的章節：' + '、'.join('%s（%s）' % (lessons.get(x, {}).get('title', x), x) for x in ls), '學生寫下的內容：', m.get('text', ''),
                  '→ 對照章節列出漏掉的重點：python agent.py reply %s --file 回饋.md' % m.get('id')]
    elif t == 'checkin':
        lines += ['日期 %s，%s（%s/%s 項），專注 %s 分，做題 %s 題對 %s 題' % (ctx.get('date'), '達標' if ctx.get('full') else '未達標', ctx.get('done'), ctx.get('total'), ctx.get('minutes'), ctx.get('questions'), ctx.get('correct'))]
        for tk in ctx.get('tasks', []):
            lines.append('  [%s] %s' % ('x' if tk.get('done') else ' ', tk.get('text')))
        lines += ['反省：', m.get('text', ''), '→ 回覆督導：python agent.py supervise --text "…" --tasks "明天任務1;任務2" --date 明天']
    else:
        if ctx.get('stem'):
            lines += ['題目：' + str(ctx['stem'])]
            if ctx.get('options'):
                lines += ['選項：' + ' / '.join('%s. %s' % ('ABCDEFGH'[i], o) for i, o in enumerate(ctx['options']))]
            lines += ['學生答案：%s；正解：%s' % (ctx.get('myAnswer'), ctx.get('answer')), '詳解：' + str(ctx.get('explanation', ''))]
        if ctx.get('lesson'):
            lines += ['章節：%s（%s）' % (ctx.get('title'), ctx.get('lesson'))]
        if ctx.get('request'):
            lines += ['請求類型：' + ctx['request']]
        lines += ['內容：', m.get('text', ''), '→ 回覆：python agent.py reply %s --file 回覆.md' % m.get('id')]
    return '\n'.join(lines)


def local_ts(ts):
    try:
        return datetime.fromisoformat(str(ts).replace('Z', '+00:00')).astimezone().strftime('%Y-%m-%d %H:%M')
    except Exception:
        return str(ts)


def answered_ids():
    out = set()
    for m in read_jsonl(OUTBOX):
        if m.get('replyTo'):
            out.add(m['replyTo'])
    return out


def only_types(a):
    if getattr(a, 'only', None):
        return {x.strip() for x in a.only.split(',') if x.strip()}
    return None


def cmd_watch(a):
    """每個 Agent（--name）有自己的游標；--only 只接某些類型，方便多個帳號分工。"""
    name = a.name or 'default'
    st = load_json(STATE, {})
    cursors = st.setdefault('cursors', {})
    if name not in cursors:
        cursors[name] = st.get('inbox_cursor', 0) if name == 'default' else 0
    types = only_types(a) or (None if a.all else NEEDS_ANSWER)
    deadline = time.time() + a.timeout
    data = load_data()
    print('[%s] 監聽 %s（最多 %d 秒%s）…' % (name, INBOX, a.timeout, '，只接 ' + ','.join(sorted(types)) if types and types != NEEDS_ANSWER else ''))
    sys.stdout.flush()
    while True:
        heartbeat('watching', name)
        msgs = read_jsonl(INBOX)
        cur = cursors.get(name, 0)
        if cur > len(msgs):
            cur = 0
        done = answered_ids()
        new = [m for m in msgs[cur:] if (types is None or m.get('type') in types) and m.get('id') not in done]
        if len(msgs) > cur:
            st = load_json(STATE, {})
            st.setdefault('cursors', {})[name] = len(msgs)
            save_json(STATE, st)
            cursors = st['cursors']
        if new:
            print('收到 %d 則新訊息：' % len(new))
            for m in new:
                print(fmt_msg(m, data))
            print('=' * 70)
            print('處理完後再執行一次 python agent.py watch%s 繼續監聽。' % ((' --name ' + name) if a.name else ''))
            return 0
        if time.time() > deadline:
            print('TIMEOUT：%d 秒內沒有新訊息。要繼續監聽就再執行一次 watch。' % a.timeout)
            return 3
        time.sleep(a.interval)


def cmd_pending(a):
    done = answered_ids()
    data = load_data()
    types = only_types(a) or NEEDS_ANSWER
    pend = [m for m in read_jsonl(INBOX) if m.get('type') in types and m.get('id') not in done]
    if not pend:
        print('沒有待處理的訊息。')
        return 0
    for m in pend:
        print(fmt_msg(m, data) if a.full else '%s  %-6s %s  %s' % (local_ts(m.get('ts', '')), TYPE_ZH.get(m.get('type'), m.get('type')), m.get('id'), (m.get('ctx') or {}).get('title', '') or m.get('text', '')[:40].replace('\n', ' ')))
    return 0


def cmd_show(a):
    for m in read_jsonl(INBOX) + read_jsonl(OUTBOX):
        if m.get('id') == a.id:
            print(fmt_msg(m, load_data()) if m.get('from') != 'agent' else json.dumps(m, ensure_ascii=False, indent=2))
            return 0
    print('找不到 id ' + a.id)
    return 1


def cmd_lesson(a):
    for l in load_data().get('lessons', []):
        if l['id'] == a.id:
            print('# %s（%s）\n' % (l['title'], l['id']))
            if l.get('feynman'):
                print('費曼題：' + l['feynman'])
                print('關鍵點：\n' + '\n'.join('- ' + r for r in l.get('rubric', [])) + '\n')
            print(l['body'])
            return 0
    print('找不到章節 ' + a.id)
    return 1


def already(a):
    if a.id in answered_ids() and not a.force:
        print('這則訊息已經有人回覆過了（可能是另一個 Agent）。確定要再寫一次請加 --force。')
        return True
    return False


def cmd_reply(a):
    if already(a):
        return 2
    text = get_text(a).strip()
    if not text:
        print('回覆內容是空的（用 --text 或 --file）')
        return 1
    append_out({'type': 'reply', 'replyTo': a.id, 'text': text})
    return 0


def cmd_grade(a):
    if already(a):
        return 2
    text = get_text(a).strip()
    if a.verdict not in ('pass', 'revise'):
        print('--verdict 只能是 pass 或 revise')
        return 1
    msg = {'type': 'grade', 'replyTo': a.id, 'verdict': a.verdict, 'text': text}
    if a.score is not None:
        msg['score'] = a.score
    append_out(msg)
    return 0


def cmd_note(a):
    text = get_text(a).strip()
    if not text:
        print('內容是空的')
        return 1
    append_out({'type': 'note', 'text': text})
    return 0


def cmd_bonus(a):
    try:
        n = int(a.coins)
    except (TypeError, ValueError):
        print('--coins 要是整數')
        return 1
    if n <= 0 or n > 500:
        print('--coins 要在 1～500 之間')
        return 1
    text = (get_text(a) or '').strip()
    append_out({'type': 'bonus', 'coins': n, 'text': text})
    return 0


def split_tasks(s):
    return [t.strip() for t in re.split(r'[;；\n]', s or '') if t.strip()]


def auto_supervise(p, data):
    """不需要 LLM 的規則式督導：讀 progress.json 產生評語與任務。"""
    if not p:
        return '還沒有收到進度資料（bridge/progress.json）。請先打開網站讀一章、做幾題。', ['打開網站，完成今日任務']
    name = p.get('student') or '同學'
    lessons = {l['id']: l for l in data.get('lessons', [])}
    plan = {x['day']: x for x in data.get('plan', [])}
    last = p.get('last14', [])
    y = last[-2] if len(last) >= 2 and (p.get('planDay') or 1) > 1 else None
    lines = ['**%s，第 %s 天督導**（距考試 %s 天，連續達標 %s 天）' % (name, p.get('planDay'), p.get('daysLeft'), p.get('streak', 0))]
    if (p.get('planDay') or 1) <= 1:
        lines.append('- 第一天。先把「設定」裡的考試日與起始日確認好；今天的兩章都要交費曼關卡，晚上一定要打卡。')
    if y:
        acc = ('%d%%' % round(100 * y['correct'] / y['questions'])) if y['questions'] else '—'
        verdict = '已達標打卡' if y.get('checkin') else '**沒有打卡**'
        lines.append('- 昨天（%s）：專注 %s 分、做題 %s（正確率 %s），%s。' % (y['date'], y['minutes'], y['questions'], acc, verdict))
        goal = p.get('dailyMinutesGoal') or 360
        if y['minutes'] < goal * 0.6:
            lines.append('- 昨天的專注時數只有目標的 %d%%。一個月拚台大，這個量不夠，今天要補回來。' % round(100 * y['minutes'] / goal))
    behind = []
    for d in range(1, (p.get('planDay') or 1)):
        for lid in (plan.get(d, {}).get('lessons') or []):
            if not (p.get('chapters', {}).get(lid, {}).get('read')):
                behind.append(lid)
    if behind:
        lines.append('- 進度落後 %d 章：%s。今天先補最早的一章。' % (len(behind), '、'.join(lessons.get(x, {}).get('title', x) for x in behind[:4])))
    rev = [cid for cid, c in p.get('chapters', {}).items() if c.get('gate') == 'revise']
    if rev:
        lines.append('- 費曼被退回 %d 章（%s），補齊思考鏈後重交。' % (len(rev), '、'.join(lessons.get(x, {}).get('title', x) for x in rev[:3])))
    weak = p.get('weakChapters') or []
    if weak:
        lines.append('- 弱點章節：' + '、'.join('%s（%d%%）' % (w['title'], round(100 * w['acc'])) for w in weak[:4]))
    if p.get('highConfidenceWrong'):
        lines.append('- 有 %d 題「很確定卻答錯」，這是最危險的迷思。' % len(p['highConfidenceWrong']))
    if p.get('dueReviews'):
        lines.append('- 到期複習題 %d 題（FSRS 排定）。' % p['dueReviews'])
    mem = p.get('memory') or {}
    if (mem.get('items') or 0) >= 10 and mem.get('retentionAtExamIfStop') is not None:
        lines.append('- 記憶：此刻平均記得 %d%%；若從今天起不複習，考試那天只剩 %d%%。今天到期 %d 項。' % (round(100 * (mem.get('retentionNow') or 0)), round(100 * mem['retentionAtExamIfStop']), mem.get('dueToday') or 0))
    ms = [(cid, v['p']) for cid, v in (p.get('mastery') or {}).items() if v and v.get('n', 0) >= 3]
    low = sorted([x for x in ms if x[1] < 0.55], key=lambda x: x[1])[:3]
    if low:
        lines.append('- 掌握度最低：' + '、'.join('%s（%d%%）' % (lessons.get(c, {}).get('title', c), round(100 * v)) for c, v in low) + '。')
    cal = {c.get('conf'): c for c in (p.get('calibration') or [])}
    sure = cal.get('sure') or {}
    if (sure.get('n') or 0) >= 8 and (sure.get('acc') or 0) < 0.8:
        lines.append('- 你選「非常確定」時只答對 %d%%：過度自信。作答時把思考鏈寫出來，交卷前驗算。' % round(100 * sure['acc']))
    wr = (p.get('wrappers') or [])[-1:] 
    if wr:
        lines.append('- 你上次模考後決定：「%s」。今天有做到嗎？' % wr[0].get('change', ''))
    cards = p.get('cards') or {}
    hb = p.get('habits') or {}
    if hb.get('missedYesterday'):
        lines.insert(1, '- **昨天沒打卡。規則只有一條：絕不連斷兩天。**' + ('你自己說過沒打卡要：%s。' % hb['stake'] if hb.get('stake') else '') + '今天再累也至少做保底模式（15 分鐘）。')
    ap = hb.get('autopilot') or {}
    if ap.get('skipped'):
        lines.append('- 今天跳過了：%s。為什麼？跳過的通常就是最該做的。' % '、'.join(ap['skipped'][:3]))
    pc = hb.get('pace') or {}
    if pc and (pc.get('day') or 0) >= 3 and pc.get('proj', 99) < pc.get('total', 0):
        lines.append('- 照目前速度，考前只讀得完 %s/%s 章，差 %s 章。' % (pc['proj'], pc['total'], pc['total'] - pc['proj']))
    tasks = []
    if behind:
        tasks.append('補讀並交費曼：' + lessons.get(behind[0], {}).get('title', behind[0]))
    for x in rev[:2]:
        tasks.append('重交費曼：' + lessons.get(x, {}).get('title', x))
    for w in weak[:2]:
        tasks.append('弱點加練 10 題：' + w['title'])
    if p.get('dueReviews'):
        tasks.append('清空到期複習題（%d 題）' % p['dueReviews'])
    for c, v in low[:1]:
        tasks.append('自適應練習 15 題：' + lessons.get(c, {}).get('title', c))
    if cards.get('due'):
        tasks.append('必背卡：清空到期 %d 張' % cards['due'])
    if not tasks:
        tasks.append('打開網站按「開始」，照帶我讀的順序做完今天的步驟')
    if hb.get('missedYesterday'):
        tasks.insert(0, '先做 5 分鐘：打開網站按「只做 5 分鐘」')
    if not behind and not rev and not weak and (p.get('planDay') or 1) > 1:
        lines.append('- 目前節奏正確，保持。今天的費曼關卡要寫出「什麼情況下結論不成立」。')
    tp = p.get('todayPlan') or {}
    if tp.get('lessons'):
        lines.append('- 今天的章節：' + '、'.join(lessons.get(x, {}).get('title', x) for x in tp['lessons']) + '。')
    return '\n'.join(lines), tasks


def cmd_supervise(a):
    data = load_data()
    p = load_json(PROGRESS, None)
    text = get_text(a).strip()
    tasks = split_tasks(a.tasks)
    if a.auto:
        t2, k2 = auto_supervise(p, data)
        text = text or t2
        tasks = tasks or k2
    if not text:
        print('需要 --auto 或 --text/--file')
        return 1
    msg = {'type': 'supervise', 'text': text, 'date': a.date or date.today().isoformat()}
    if tasks:
        msg['tasks'] = tasks
    if getattr(a, 'reply_to', None):
        msg['replyTo'] = a.reply_to
    append_out(msg)
    print(text)
    if tasks:
        print('任務：' + '；'.join(tasks))
    return 0


def cmd_plan(a):
    tasks = split_tasks(a.tasks)
    if not tasks:
        print('--tasks 不能是空的')
        return 1
    msg = {'type': 'plan', 'date': a.date or (date.today() + timedelta(days=1)).isoformat(), 'tasks': tasks, 'text': a.text or '已指派任務：' + '；'.join(tasks)}
    if getattr(a, 'reply_to', None):
        msg['replyTo'] = a.reply_to
    append_out(msg)
    return 0


def cmd_quiz(a):
    qs = json.load(io.open(a.file, encoding='utf-8'))
    if isinstance(qs, dict):
        qs = qs.get('questions', [])
    ok = []
    for i, q in enumerate(qs):
        if not q.get('stem'):
            print('第 %d 題缺 stem，略過' % (i + 1))
            continue
        ok.append(q)
    if not ok:
        print('沒有有效題目')
        return 1
    msg = {'type': 'quiz', 'questions': ok, 'text': a.text or 'Agent 依你的弱點出了 %d 題。' % len(ok)}
    if getattr(a, 'reply_to', None):
        msg['replyTo'] = a.reply_to
    append_out(msg)
    return 0


def cmd_report(a):
    p = load_json(PROGRESS, None)
    if not p:
        print('還沒有 bridge/progress.json（學生還沒打開網站或還沒有任何動作）。')
        return 1
    if a.json:
        print(json.dumps(p, ensure_ascii=False, indent=2))
        return 0
    print('學生：%s　更新：%s' % (p.get('student') or '（未填名字）', local_ts(p.get('updated'))))
    print('計畫第 %s 天｜距考試 %s 天｜連續達標 %s 天｜今日任務 %s/%s' % (p.get('planDay'), p.get('daysLeft'), p.get('streak'), p.get('tasksDone'), p.get('tasksTotal')))
    print('\n近 14 天（日期 分鐘 題數 對 打卡）：')
    for d in p.get('last14', []):
        print('  %s %4s %4s %4s %s' % (d['date'], d['minutes'], d['questions'], d['correct'], '✓' if d['checkin'] else ''))
    print('\n各科：')
    for sid, s in p.get('subjects', {}).items():
        acc = '—' if s.get('acc') is None else '%d%%' % round(100 * s['acc'])
        print('  %-6s 已讀 %s/%s 費曼通過 %s 題數 %s 正確率 %s' % (s.get('name'), s.get('read'), s.get('total'), s.get('pass'), s.get('att'), acc))
    if p.get('weakChapters'):
        print('\n弱點章節：' + '、'.join('%s %d%%' % (w['title'], round(100 * w['acc'])) for w in p['weakChapters']))
    if p.get('recentWrong'):
        print('\n最近錯題：')
        for w in p['recentWrong'][:10]:
            print('  [%s] %s｜信心 %s｜錯因 %s｜%s' % (w['chapter'], w['stem'][:50].replace('\n', ' '), w.get('conf'), w.get('cause'), w.get('note') or ''))
    mem = p.get('memory') or {}
    if mem.get('items'):
        print('\n記憶（FSRS）：%s 項｜此刻記得 %s｜若停止複習，考試日 %s｜今天到期 %s' % (mem['items'], '—' if mem.get('retentionNow') is None else '%d%%' % round(100 * mem['retentionNow']), '—' if mem.get('retentionAtExamIfStop') is None else '%d%%' % round(100 * mem['retentionAtExamIfStop']), mem.get('dueToday')))
    ms = sorted([(cid, v) for cid, v in (p.get('mastery') or {}).items() if v], key=lambda x: x[1]['p'])
    if ms:
        print('掌握度（低→高）：' + '、'.join('%s %d%%(%d)' % (cid, round(100 * v['p']), v['n']) for cid, v in ms[:8]))
    if p.get('calibration'):
        print('校準：' + '｜'.join('%s %s（%s 題）' % (c['conf'], '—' if c['acc'] is None else '%d%%' % round(100 * c['acc']), c['n']) for c in p['calibration']))
    if p.get('cards'):
        print('必背卡：已學 %s/%s，到期 %s' % (p['cards'].get('learned'), p['cards'].get('total'), p['cards'].get('due')))
    rw = p.get('rewards')
    if rw:
        print('\n獎勵：Lv %s「%s」｜🪙 %s｜🧊 %s｜未開寶箱 %s｜成就 %s｜最近兌換：%s' % (rw.get('level'), rw.get('title'), rw.get('coins'), rw.get('freezes'), rw.get('unopenedChests'), rw.get('achievements'), '、'.join('%s(%s)' % (x['name'], x['date']) for x in rw.get('recentRedeem') or []) or '無'))
    if p.get('pendingGates'):
        print('\n待審：%d 則（python agent.py pending）' % len(p['pendingGates']))
    ap = (p.get('habits') or {}).get('autopilot') or {}
    if ap:
        print('\n帶我讀（%s）：完成 %s/%s，下一步：%s%s' % ((p.get('updated') or '')[:10], ap.get('done'), ap.get('total'), ap.get('next') or '—', '｜跳過：' + '、'.join(ap['skipped']) if ap.get('skipped') else ''))
    fc = p.get('forecast') or {}
    if fc.get('date'):
        print('預排 %s：第一步「%s」，共 %s 步、約 %s 分' % (fc['date'], fc.get('firstStep') or '—', fc.get('steps'), fc.get('mins')))
    return 0


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='資工所衝刺站 Agent 工具')
    sp = ap.add_subparsers(dest='cmd')
    w = sp.add_parser('watch'); w.add_argument('--timeout', type=int, default=540); w.add_argument('--interval', type=float, default=1.5); w.add_argument('--all', action='store_true'); w.add_argument('--name', default=None); w.add_argument('--only', default=None)
    pe = sp.add_parser('pending'); pe.add_argument('--full', action='store_true'); pe.add_argument('--only', default=None)
    s = sp.add_parser('show'); s.add_argument('id')
    le = sp.add_parser('lesson'); le.add_argument('id')
    for nm in ('reply', 'grade'):
        r = sp.add_parser(nm); r.add_argument('id'); r.add_argument('--text'); r.add_argument('--file'); r.add_argument('--force', action='store_true')
        if nm == 'grade':
            r.add_argument('--verdict', required=True); r.add_argument('--score', type=int)
    n = sp.add_parser('note'); n.add_argument('--text'); n.add_argument('--file')
    su = sp.add_parser('supervise'); su.add_argument('--auto', action='store_true'); su.add_argument('--text'); su.add_argument('--file'); su.add_argument('--tasks'); su.add_argument('--date'); su.add_argument('--reply-to')
    pl = sp.add_parser('plan'); pl.add_argument('--tasks', required=True); pl.add_argument('--date'); pl.add_argument('--text'); pl.add_argument('--reply-to')
    q = sp.add_parser('quiz'); q.add_argument('--file', required=True); q.add_argument('--text'); q.add_argument('--reply-to')
    bo = sp.add_parser('bonus'); bo.add_argument('--coins', required=True); bo.add_argument('--text'); bo.add_argument('--file')
    rp = sp.add_parser('report'); rp.add_argument('--json', action='store_true')
    hb = sp.add_parser('heartbeat'); hb.add_argument('--status', default='watching'); hb.add_argument('--name', default=None)
    rc = sp.add_parser('reset-cursor'); rc.add_argument('--to', type=int, default=0)
    a = ap.parse_args()
    os.makedirs(BR, exist_ok=True)
    if a.cmd == 'watch':
        return cmd_watch(a)
    if a.cmd == 'pending':
        return cmd_pending(a)
    if a.cmd == 'show':
        return cmd_show(a)
    if a.cmd == 'lesson':
        return cmd_lesson(a)
    if a.cmd == 'reply':
        return cmd_reply(a)
    if a.cmd == 'grade':
        return cmd_grade(a)
    if a.cmd == 'note':
        return cmd_note(a)
    if a.cmd == 'supervise':
        return cmd_supervise(a)
    if a.cmd == 'plan':
        return cmd_plan(a)
    if a.cmd == 'quiz':
        return cmd_quiz(a)
    if a.cmd == 'report':
        return cmd_report(a)
    if a.cmd == 'bonus':
        return cmd_bonus(a)
    if a.cmd == 'heartbeat':
        heartbeat(a.status, a.name)
        print('heartbeat 已更新')
        return 0
    if a.cmd == 'reset-cursor':
        save_json(STATE, {'cursors': {}, 'inbox_cursor': a.to})
        print('cursor = %d' % a.to)
        return 0
    ap.print_help()
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)

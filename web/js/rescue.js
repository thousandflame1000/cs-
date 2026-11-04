/* 資工所衝刺站 — 🆘 完全不會：先看懂一題完整解答，再做同類型的題；這章排進「打底」，並請 Agent 從零講 */
'use strict';

const Rescue = {
  seed() { return Math.floor(Math.random() * 1e9); },
  /* 同類型、不更難的下一題：計算題換數字；題庫題找同章較簡單、還沒做過的 */
  similar(q, qid, skip = new Set()) {
    if (q.src === 'gen' || String(qid).startsWith('gen:')) return `gen:${String(qid).split(':')[1]}:${this.seed()}`;
    const g = Gen.list.filter(x => x.ch === q.ch); if (g.length) return `gen:${rng(this.seed()).pick(g).id}:${this.seed()}`;
    const c = QBANK.all().filter(x => x.ch === q.ch && x.id !== qid && !skip.has(x.id) && x.type !== 'essay' && x.src !== 'agent' && (x.diff || 2) <= (q.diff || 2))
      .sort((a, b) => (!!S.st.answers[a.id]) - (!!S.st.answers[b.id]) || (a.diff || 2) - (b.diff || 2));
    return c[0] ? c[0].id : null;
  },
  /* 打底：範例（看解答）→ 換你做，成對出現；由淺入深 */
  warm(ch) {
    const ex = [], ids = [], R = rng(this.seed());
    const gens = Gen.list.filter(g => g.ch === ch);
    for (const g of R.shuffle(gens).slice(0, 2)) { const a = `gen:${g.id}:${this.seed()}`; ex.push(a); ids.push(a, `gen:${g.id}:${this.seed()}`); }
    const bank = QBANK.all().filter(q => q.ch === ch && q.type !== 'essay' && q.src !== 'agent').sort((a, b) => (a.diff || 2) - (b.diff || 2));
    for (let k = 0; k + 1 < bank.length && ids.length < 8; k += 2) { ex.push(bank[k].id); ids.push(bank[k].id, bank[k + 1].id); }
    return { ids, ex };
  },
  /* 記下這章要打底、排進今天，並請 Agent 從零講（每章每天一次） */
  flag(ch, where, stem) {
    if (!ch || !LESSON[ch]) return; const ls = S.lesson(ch), today = D.today(), l = LESSON[ch];
    ls.base = today; ls.baseDone = null;
    try { Auto.insertNext('base:' + ch); } catch (e) { }
    if (ls.baseAsked !== today) {
      ls.baseAsked = today;
      Bridge.send({ type: 'ask', text: `我在「${l.title}」${where === 'feyn' ? '寫費曼時' : '做題時'}發現完全沒有基礎。請從零教我：\n1. 這章需要先會的 2～4 個前置概念，每個用一句白話＋一個最小例子；\n2. 這章最核心的一個想法，用一個具體例子走一遍；\n3. 出 3 題由淺入深的暖身題（用 quiz 格式送）。${stem ? '\n\n卡住的題目：' + String(stem).slice(0, 400) : ''}`, ctx: { nobase: true, chapter: ch, title: l.title, where, stem: stem || null } }).catch(() => { });
    }
    S.save();
  },
};

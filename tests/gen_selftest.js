/* 參數化題目表的自我測試：每一型抽 SEEDS 題，檢查不出錯、答案合法、選項不重複、同一個 seed 結果一樣；數出不重複的題數。
   用法：cd web && python3 -m http.server 8802 &   然後   node tests/gen_selftest.js   （SEEDS=600 可調） */
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8802, SEEDS = +(process.env.SEEDS || 600), CAP = +(process.env.CAP || 300);
(async () => {
  const b = await chromium.launch(), pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html#practice`); await pg.waitForTimeout(1500);
  const rep = await pg.evaluate(({ SEEDS, CAP }) => {
    const out = [];
    for (const g of Gen.list) {
      const r = { id: g.id, kp: g.kp || null, diff: g.diff || 2, tpl: !!g.tpl, err: 0, bad: [], distinct: 0 };
      const seen = new Set();
      for (let s = 1; s <= SEEDS; s++) {
        let q; try { q = Gen.make(g.id, s); } catch (e) { r.err++; if (r.bad.length < 3) r.bad.push('seed ' + s + ': ' + e.message); continue; }
        const txt = [q.stem, q.expl, ...(q.opts || [])].join('\n');
        const why = !q.stem ? '沒有題幹' : /undefined|NaN|\[object|Infinity/.test(txt) ? '出現 undefined/NaN' : !q.ans || !q.ans.length ? '沒有答案' :
          (q.type === 'single' || q.type === 'multi') && (new Set(q.opts.map(String)).size !== q.opts.length || q.ans.some(i => !(i >= 0 && i < q.opts.length))) ? '選項重複或答案索引錯' :
          q.type === 'fill' && q.ans.some(a => String(a).trim() === '') ? '填空答案是空的' : '';
        if (why) { r.err++; if (r.bad.length < 3) r.bad.push('seed ' + s + ': ' + why); continue; }
        if (s <= 5) { const q2 = Gen.make(g.id, s); if (q2.stem !== q.stem || String(q2.ans) !== String(q.ans)) { r.err++; r.bad.push('seed ' + s + ': 同一個 seed 結果不一樣'); } }
        seen.add(q.stem + '|' + (q.opts || []).join('|'));
      }
      r.distinct = Math.min(seen.size, CAP); r.raw = seen.size; out.push(r);
    }
    return out;
  }, { SEEDS, CAP });
  const tot = rep.reduce((s, r) => s + r.distinct, 0), bad = rep.filter(r => r.err);
  const fixed = await pg.evaluate(() => DATA.quiz.length);
  console.log(`題型 ${rep.length}（新的參數化 ${rep.filter(r => r.tpl).length}），每型抽 ${SEEDS} 題，不重複題數（每型最多算 ${CAP}）：${tot}；固定題庫 ${fixed}；合計 ${tot + fixed}`);
  console.log('沒有對應知識點的題型：', rep.filter(r => !r.kp).map(r => r.id).join(' ') || '無');
  console.log('出錯的題型：', bad.length ? '' : '無'); bad.forEach(r => console.log(`  ${r.id}：${r.err} 次，${r.bad.join('；')}`));
  console.log('不重複題數少於 50 的題型：', rep.filter(r => r.raw < 50).map(r => `${r.id}(${r.raw})`).join(' ') || '無');
  if (errs.length) console.log('頁面錯誤：', errs.slice(0, 3));
  require('fs').writeFileSync(require('path').join(__dirname, 'gen_selftest_report.json'), JSON.stringify({ seeds: SEEDS, cap: CAP, distinct: tot, fixed, perType: rep }, null, 1));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();

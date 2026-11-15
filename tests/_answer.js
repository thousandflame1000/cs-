/* seed(pg, 'first')：只學會「自己挑」清單第一章的知識點（題目少，關卡跑得完）。
   測試共用（2026-11-14 作答卡重寫後）：
   answer(pg)：把目前這題照正解作答並按「送出答案」（申論題自評「完整涵蓋」），取代舊的 #paperDone → [data-pe=full]。
   seed(pg, n)：把前 n 個知識點標成學會（練習題庫只出「學會的知識點」的題，新學生不先學會就沒有題可做）。 */
exports.answer = async pg => {
  await pg.evaluate(() => {
    const s = Practice.sess, q = Practice.getQ(s.ids[s.i]);
    if (q.type === 'single' || q.type === 'multi') { const o = [...document.querySelectorAll('#ansArea .opt input')]; q.ans.forEach(k => { o[k].checked = true; }); }
    else if (q.type === 'fill') { const i = document.querySelector('#opt-fill'); if (i) i.value = String(q.ans[0]); }
    else { const t = document.querySelector('#opt-essay'); if (t) t.value = '我的推理'; }
  });
  await pg.click('#qSubmit'); await pg.waitForTimeout(90);
  if (await pg.locator('[data-se=full]:not(:disabled)').count()) { await pg.click('[data-se=full]'); await pg.waitForTimeout(60); }
};
exports.seed = async (pg, n = 60) => {
  await pg.evaluate(n => { S.st.kp = S.st.kp || {}; const sj = (Practice.sj || 'ds'), ch = typeof n === 'string' ? (n === 'first' ? DATA.lessons.find(l => l.subject === sj).id : n) : null;
    (ch ? KP.ORDER.filter(k => KP.N[k].ch === ch) : KP.ORDER.slice(0, n)).forEach(k => { S.st.kp[k] = Object.assign(S.st.kp[k] || {}, { done: true, stage: 'done', i: 99 }); }); S.st.onboarded = true; S.save(); if (typeof route === 'function') route(); }, n);
  await pg.waitForTimeout(400);
};
exports.wrong = async pg => {
  await pg.evaluate(() => {
    const s = Practice.sess, q = Practice.getQ(s.ids[s.i]);
    if (q.type === 'single' || q.type === 'multi') { const o = [...document.querySelectorAll('#ansArea .opt input')]; const k = o.findIndex((x, i) => !q.ans.includes(i)); o[k].checked = true; }
    else if (q.type === 'fill') { const i = document.querySelector('#opt-fill'); if (i) i.value = 'zzz'; }
    else { const t = document.querySelector('#opt-essay'); if (t) t.value = '不會'; }
  });
  await pg.click('#qSubmit'); await pg.waitForTimeout(90);
  if (await pg.locator('[data-se=none]:not(:disabled)').count()) { await pg.click('[data-se=none]'); await pg.waitForTimeout(60); }
};
/* 結算後開下一回：結算頁的「返回練習」只回練習頁（2026-11-13 改），要再按推薦的「開打」 */
exports.next = async pg => {
  if (await pg.locator('#nextGo').count()) { await pg.click('#nextGo'); await pg.waitForTimeout(300); }
  else if (await pg.locator('#goNextRec').count()) { await pg.click('#goNextRec'); await pg.waitForTimeout(300); }
  if (!(await pg.locator('#qSubmit, #stGo').count()) && await pg.locator('#fhGo').count()) { await pg.click('#fhGo'); await pg.waitForTimeout(300); }
};

// 六個學習法：先認方法、紙筆先標信心＋高信心答錯優先、例題淡出、紙筆模考、憑記憶畫圖、對錯卡追問為什麼
const {chromium}=require('playwright');
const SHOT=process.env.SHOT||'';
(async()=>{const b=await chromium.launch();const W=+(process.env.W||1440),H=W<500?844:900;
const pg=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const U='http://localhost:'+(process.env.PORT||8801)+'/index.html';const shot=async n=>{if(SHOT)await pg.screenshot({path:SHOT+'/'+n+'-'+W+'.png'});};
await pg.goto(U+'#practice');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{for(const id of ['ds-amortized','ds-sort','ds-heap','al-recurrence','ds-hash']){S.lesson(id).read=D.today();}S.st.onboarded=true;S.saveNow();});
const out=[];
// 1. 先認方法
await pg.evaluate(()=>{Practice.sess=null;Practice.view();});await pg.waitForTimeout(300);
await pg.evaluate(()=>document.querySelector('.self-pick').open=true);await pg.click('#mInter');await pg.waitForTimeout(400);
if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(300);}
out.push('mpick:'+await pg.locator('#mpick').count()+' chipHidden:'+await pg.locator('.q-meta .chip[hidden]').count()+' gateHidden:'+await pg.locator('#ansArea[hidden]').count()+' opts:'+await pg.locator('[data-mp]').count());
await shot('1-mpick');
await pg.keyboard.press('1');await pg.waitForTimeout(250);
out.push('after pick gateHidden:'+await pg.locator('#ansArea[hidden]').count()+' fb:'+(await pg.locator('#mpFb').innerText()).slice(0,20)+' pconf:'+await pg.locator('[data-pconf]').count());
await shot('2-picked');
// 紙筆：很確定 → 自評錯 → 高信心答錯
const qid=await pg.evaluate(()=>Practice.sess.ids[Practice.sess.i]);
await pg.keyboard.press('3');await pg.waitForTimeout(250);await pg.click('[data-pe=none]');await pg.waitForTimeout(250);
out.push('hcw msg:'+await pg.locator('#feedback .hcw').count()+' stored hcw:'+await pg.evaluate(id=>(S.st.answers[id]||{}).hcw,qid)+' mpick n:'+await pg.evaluate(()=>S.st.mpick.n));
await shot('3-hcw');
// 高信心答錯排在到期最前面
const first=await pg.evaluate(id=>{const k=Learn.keyOf(id);S.st.srs[k].due=D.add(D.today(),-1);for(const [kk,c] of Object.entries(S.st.srs)){if(kk!==k&&QBANK.get(kk))c.due=D.add(D.today(),-2);}return Learn.dueQuestions()[0]===id;},qid);
out.push('hcw first in due:'+first);
// 2. 憑記憶畫圖
await pg.evaluate(()=>{Practice.sess=null;Practice.startDraw();});await pg.waitForTimeout(400);
out.push('draw prompt:'+(await pg.locator('.dr-head').innerText()).slice(0,20)+' pad:'+await pg.locator('#pad').count());
const box=await pg.locator('#pad').boundingBox();await pg.mouse.move(box.x+40,box.y+40);await pg.mouse.down();await pg.mouse.move(box.x+200,box.y+120,{steps:8});await pg.mouse.up();
await shot('4-draw');
await pg.keyboard.press('Enter');await pg.waitForTimeout(300);out.push('draw fig:'+await pg.locator('#feedback svg').count());
await shot('5-draw-reveal');
await pg.keyboard.press('2');await pg.waitForTimeout(200);out.push('draws stored:'+await pg.evaluate(()=>Object.keys(S.st.draws||{}).length));
await pg.evaluate(()=>{Practice.draw.items=Practice.draw.items.slice(0,1);});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);
out.push('draw end:'+(await pg.locator('.page-head h1').innerText()).replace(/\s+/g,' '));
// 3. 紙筆模考
await pg.evaluate(()=>Practice.startMock('sys'));await pg.waitForTimeout(500);
out.push('mock paper note:'+await pg.locator('.exam-note').count()+' chapter chips:'+await pg.locator('.exam .chip').count()+' hp:'+await pg.locator('#mockHpN').innerText());
await pg.locator('[data-wrote="0"]').check();await pg.waitForTimeout(100);out.push('hp after 1:'+await pg.locator('#mockHpN').innerText());
await shot('6-mock');
await pg.click('#handIn');await pg.waitForTimeout(400);
await pg.click('[data-mg="0:full"]');await pg.click('[data-mg="1:part"]');out.push('left:'+await pg.locator('#mgLeft').innerText());
await shot('7-mockgrade');
await pg.click('#mgDone');await pg.waitForTimeout(400);out.push('mock result:'+(await pg.locator('.page-head h1').innerText())+' self label:'+((await pg.locator('.exam li .muted').first().innerText()).slice(0,8)));
// 4. 例題淡出
await pg.goto(U+'#ds-amortized');await pg.waitForTimeout(1200);
await pg.evaluate(()=>{const l=LESSON['ds-amortized'];const ls=S.lesson(l.id);ls.wk=l.worked.steps.length+1;S.saveNow();});
await pg.goto(U+'#co-perf');await pg.waitForTimeout(300);await pg.goto(U+'#ds-amortized');await pg.waitForTimeout(1200);
out.push('wkFade btn:'+await pg.locator('#wkFade').count());
await pg.locator('#wkFade').scrollIntoViewIfNeeded();await pg.click('#wkFade');await pg.waitForTimeout(400);
const n=await pg.evaluate(()=>LESSON['ds-amortized'].worked.steps.length);
for(let i=0;i<n;i++){await pg.click('#wkNext');await pg.waitForTimeout(80);}
out.push('fade1 n='+n+' blanks left:'+await pg.locator('.wk-blank').count()+' lv:'+await pg.locator('.wk-lv').innerText());
await pg.locator('#wk').scrollIntoViewIfNeeded();await shot('8-fade1');
await pg.click('#wkNext');await pg.waitForTimeout(150);await pg.click('#wkFade');await pg.waitForTimeout(400);
out.push('fade2 visible steps:'+await pg.locator('.wk-s:not([hidden])').count()+' btn:'+await pg.locator('#wkNext').innerText());
await pg.locator('#wk').scrollIntoViewIfNeeded();await shot('9-fade2');
await pg.click('#wkNext');await pg.waitForTimeout(200);out.push('fade2 open:'+await pg.locator('.wk-s.open').count()+' route wk still done:'+await pg.evaluate(()=>S.lesson('ds-amortized').wk>LESSON['ds-amortized'].worked.steps.length));
// 5. 對錯卡追問為什麼
await pg.goto(U+'#cards');await pg.waitForTimeout(800);
await pg.evaluate(()=>{const c=DATA.cards.filter(x=>x.kind==='tf'&&x.back).slice(0,3);CardSess={list:c,i:0,res:[],requeue:{},t0:Date.now()};route();});await pg.waitForTimeout(400);
await pg.keyboard.press('ArrowRight');await pg.waitForTimeout(200);
out.push('why ask:'+await pg.locator('.why-ask').count()+' back hidden:'+(await pg.locator('.f-b').count()===0)+' rate:'+await pg.locator('[data-g]').count());
await shot('10-why');
await pg.keyboard.press(' ');await pg.waitForTimeout(200);
out.push('after why back:'+await pg.locator('.f-b').count()+' rate:'+await pg.locator('[data-g]').count());
await shot('11-why-back');
await pg.keyboard.press('3');await pg.waitForTimeout(200);out.push('next card idx:'+await pg.evaluate(()=>CardSess&&CardSess.i));
console.log(out.join('\n'));console.log(errs);await b.close();})();

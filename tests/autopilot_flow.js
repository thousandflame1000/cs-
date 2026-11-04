const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#go');await pg.waitForTimeout(800);
await pg.evaluate(()=>{S.st.onboarded=true;S.save();const l=Auto.list();l.slice(0,3).forEach(x=>Auto.skip(x.id));route();});await pg.waitForTimeout(500);
console.log('cur step:',await pg.evaluate(()=>Auto.current().id));
await pg.click('#goNow');await pg.waitForTimeout(500);
if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(200);}
while(await pg.locator('#paperDone').count()){await pg.click('#paperDone');await pg.waitForTimeout(90);await pg.click('[data-pe=full]');await pg.waitForTimeout(110);await pg.click('#qNext');await pg.waitForTimeout(150);if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(150);}}
console.log('summary buttons:',(await pg.locator('.row.end').last().innerText()).replace(/\n/g,' | '));
await pg.waitForTimeout(4800);console.log('after 4.8s ->',(await pg.locator('main').innerText()).slice(0,40).replace(/\n/g,' '),'step now',await pg.evaluate(()=>Auto.current()&&Auto.current().id),errs);
// 從闖關頁進來的不受影響
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.reload();await pg.waitForTimeout(800);await pg.click('#fhGo');await pg.waitForTimeout(300);
while(await pg.locator('#paperDone').count()){await pg.click('#paperDone');await pg.waitForTimeout(90);await pg.click('[data-pe=full]');await pg.waitForTimeout(110);await pg.click('#qNext');await pg.waitForTimeout(150);}
console.log('feed summary:',(await pg.locator('#goNextRec').innerText()), 'nextGo?',await pg.locator('#nextGo').count(),errs);await b.close();})();

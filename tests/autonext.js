const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);
await pg.click('#fhGo');await pg.waitForTimeout(300);
while(await pg.locator('#paperDone').count()){await pg.click('#paperDone');await pg.waitForTimeout(100);await pg.click('[data-pe=full]');await pg.waitForTimeout(120);await pg.click('#qNext');await pg.waitForTimeout(150);}
console.log('summary btn:',await pg.locator('#goNextRec').innerText());
await pg.waitForTimeout(5600);
console.log('auto ->',(await pg.locator('main').innerText()).slice(0,60).replace(/\n/g,' '));
// cancel case
while(await pg.locator('#paperDone').count()){await pg.click('#paperDone');await pg.waitForTimeout(100);await pg.click('[data-pe=full]');await pg.waitForTimeout(120);await pg.click('#qNext');await pg.waitForTimeout(150);}
await pg.mouse.click(10,400);await pg.waitForTimeout(6000);
console.log('after cancel still summary:',await pg.locator('#goNextRec').count(),await pg.locator('#goNextRec').innerText(),errs);await b.close();})();

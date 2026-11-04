const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1000);
await pg.evaluate(()=>Practice.startMock('dsa'));await pg.waitForTimeout(500);
console.log('start',await pg.locator('#mockHpN').innerText());
for(const k of [0,1,2]){const li=pg.locator('#eq-'+k);const rad=li.locator('input[type=radio],input[type=checkbox]');
 if(await rad.count()) await rad.first().check({force:true}); else { const f=li.locator('input,textarea').first(); await f.fill('3'); }
 await pg.waitForTimeout(400);}
console.log('after 3',await pg.locator('#mockHpN').innerText());
await pg.evaluate(()=>window.scrollTo(0,3000));await pg.waitForTimeout(200);
console.log(errs);await b.close();})();

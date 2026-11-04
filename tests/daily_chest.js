const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);
const log=[await pg.locator('.fh-daily').innerText()];
let drops=0;
for(let r=0;r<3;r++){
  await pg.click(r?'#goNextRec':'#fhGo');await pg.waitForTimeout(300);
  while(await pg.locator('#paperDone').count()){await pg.click('#paperDone');await pg.waitForTimeout(90);await pg.click('[data-pe=full]');await pg.waitForTimeout(110);await pg.click('#qNext');await pg.waitForTimeout(140);}
  await pg.waitForTimeout(1200); drops+=await pg.locator('.rw-drop.t-gold').count();
  log.push('r'+r+' stars today='+await pg.evaluate(()=>S.day().stars));
}
await pg.mouse.click(5,5);await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#gen');await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(500);
log.push('hero: '+await pg.locator('.fh-daily').innerText(),'gold drops seen: '+drops,'coins:'+await pg.evaluate(()=>Rewards.coins()));
console.log(log.join('\n'),errs);await b.close();})();

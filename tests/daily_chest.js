const {chromium}=require('playwright');const H=require('./_answer');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);await H.seed(pg);
const log=[await pg.locator('.fh-daily').innerText()];
let drops=0;
for(let r=0;r<3;r++){
  await H.next(pg);if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(200);}
  while(await pg.locator('#qSubmit').count()){await H.answer(pg);await pg.waitForTimeout(110);await pg.click('#qNext');await pg.waitForTimeout(140);}
  await pg.waitForTimeout(1200); drops+=await pg.locator('.rw-drop.t-gold').count();
  log.push('r'+r+' stars today='+await pg.evaluate(()=>S.day().stars));
}
await pg.mouse.click(5,5);await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#gen');await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(500);
if(await pg.locator('#qQuit').count()){await pg.click('#qQuit');await pg.waitForTimeout(300);}if(await pg.locator('#goNextRec').count()){await pg.click('#goNextRec');await pg.waitForTimeout(300);}
log.push('hero: '+await pg.locator('.fh-daily').innerText(),'gold drops seen: '+drops,'coins:'+await pg.evaluate(()=>Rewards.coins()));
console.log(log.join('\n'),errs);await b.close();})();

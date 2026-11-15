const {chromium}=require('playwright');const H=require('./_answer');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1500);await H.seed(pg,'first');
await pg.click('details.self-pick > summary');await pg.locator('[data-ch]:not([disabled])').first().click();await pg.waitForTimeout(300);await pg.click('#stGo');await pg.waitForTimeout(200);
const log=[];
for(let i=0;i<140;i++){
  if(await pg.locator('.stage-card').count()){log.push('STAGE['+(await pg.locator('.stage-clear').count()?await pg.locator('.stage-clear').innerText():'')+']');await pg.click('#stGo');await pg.waitForTimeout(200);continue;}
  if(!(await pg.locator('#qSubmit').count())) break;
  await H.answer(pg);await pg.waitForTimeout(250);
  log.push(await pg.locator('.boss').innerText());
  await pg.click('#qNext');await pg.waitForTimeout(250);
}
log.push('SUM:'+(await pg.locator('.sum-stars').count()?await pg.locator('.sum-stars').innerText():'none'));

await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.reload();await pg.waitForTimeout(1000);
if(await pg.locator('#qQuit').count()){await pg.click('#qQuit');await pg.waitForTimeout(300);}if(await pg.locator('#goNextRec').count()){await pg.click('#goNextRec');await pg.waitForTimeout(300);}if(!(await pg.locator('.ch-row').count()))await pg.click('details.self-pick > summary');await pg.waitForTimeout(300);
log.push('ROW:'+await pg.locator('.ch-row').first().innerText());
console.log(log.join('\n'),errs);await b.close();})();

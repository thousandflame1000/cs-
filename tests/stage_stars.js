const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1500);
await pg.click('details.self-pick > summary');await pg.locator('[data-ch]').first().click();await pg.waitForTimeout(300);await pg.click('#stGo');await pg.waitForTimeout(200);
const log=[];
for(let i=0;i<22;i++){
  if(await pg.locator('.stage-card').count()){log.push('STAGE['+(await pg.locator('.stage-clear').count()?await pg.locator('.stage-clear').innerText():'')+']');await pg.click('#stGo');await pg.waitForTimeout(200);continue;}
  if(!(await pg.locator('#paperDone').count())) break;
  await pg.click('#paperDone');await pg.waitForTimeout(150);await pg.click('[data-pe=full]');await pg.waitForTimeout(250);
  log.push(await pg.locator('.boss').innerText());
  await pg.click('#qNext');await pg.waitForTimeout(250);
}
log.push('SUM:'+(await pg.locator('.sum-stars').count()?await pg.locator('.sum-stars').innerText():'none'));

await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.reload();await pg.waitForTimeout(1000);
log.push('ROW:'+await pg.locator('.ch-row').first().innerText());
console.log(log.join('\n'),errs);await b.close();})();

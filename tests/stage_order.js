const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1500);
await pg.click('details.self-pick > summary');await pg.locator('[data-ch]').first().click();await pg.waitForTimeout(400);
console.log('stage1',await pg.locator('.stage-card h2').innerText());
await pg.click('#stGo');await pg.waitForTimeout(300);
console.log('eyebrow',await pg.locator('.eyebrow').innerText(), await pg.locator('.stars').innerText());
// skip through questions to see stage changes
const seq=[];
for(let i=0;i<14;i++){
  if(await pg.locator('.stage-card').count()){seq.push('STAGE:'+await pg.locator('.stage-card h2').innerText());await pg.click('#stGo');await pg.waitForTimeout(200);}
  if(await pg.locator('#qSkip').count()){seq.push((await pg.locator('.stars').innerText()).replace(/☆/g,''));await pg.click('#qSkip');await pg.waitForTimeout(200);}
}
console.log(seq.join(' '),errs);
// 自適應第一題
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.reload();await pg.waitForTimeout(800);
await pg.click('details.self-pick > summary');await pg.click('#mAdapt');await pg.waitForTimeout(400);console.log('adaptive first stars',await pg.locator('.stars').innerText());
await b.close();})();

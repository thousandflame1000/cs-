const {chromium}=require('playwright');const H=require('./_answer');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1500);await H.seed(pg);

const log=[];log.push('HERO:'+(await pg.locator('.feed-hero').innerText()).replace(/\n/g,' | '));
for(let round=0;round<3;round++){
  await H.next(pg);
  if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(200);}
  let n=0;while(await pg.locator('#qSubmit').count()&&n<40){await H.answer(pg);await pg.waitForTimeout(150);await pg.click('#qNext');await pg.waitForTimeout(200);n++;
    if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(150);}}
  log.push('round'+round+': answered '+n+' sum='+(await pg.locator('.sum-stars').count()?await pg.locator('.sum-stars').innerText():'-')+' url='+pg.url().split('#')[1]);
  if(!(await pg.locator('#goNextRec').count())) break;
}

console.log(log.join('\n'),errs);await b.close();})();

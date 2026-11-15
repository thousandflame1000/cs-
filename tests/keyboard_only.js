const {chromium}=require('playwright');const H=require('./_answer');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);await H.seed(pg);
let rounds=0;
for(let k=0;k<240;k++){if(await pg.locator('#qSubmit').count()){await pg.keyboard.press('a');await pg.keyboard.press('1');if(await pg.locator('#qSubmit').count())await pg.keyboard.press('Enter');}else await pg.keyboard.press('Enter');await pg.waitForTimeout(220); if(await pg.locator('#goNextRec').count()) rounds++;}
console.log('summaries seen',rounds,'stars',await pg.evaluate(()=>JSON.stringify(S.st.stars)),errs);await b.close();})();

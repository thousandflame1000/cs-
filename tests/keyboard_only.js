const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);
let rounds=0;
for(let k=0;k<30;k++){await pg.keyboard.press('Enter');await pg.waitForTimeout(220);if(await pg.locator('[data-pe]:not(:disabled)').count()){await pg.keyboard.press('1');await pg.waitForTimeout(200);} if(await pg.locator('#goNextRec').count()) rounds++;}
console.log('summaries seen',rounds,'stars',await pg.evaluate(()=>JSON.stringify(S.st.stars)),errs);await b.close();})();

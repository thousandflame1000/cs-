const {chromium}=require('playwright');const H=require('./_answer');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1000);
const cov=await pg.evaluate(()=>{let n=0,h=0;const ex=[];QBANK.all().forEach(q=>{n++;const sp=lessonSpot(q);if(sp){h++;if(ex.length<6&&Math.random()<.05)ex.push(q.id+' → '+(sp.i+1)+' '+sp.title+' ｜'+String(q.stem).slice(0,30));}});return {n,h,ex};});
console.log('coverage',cov.h,'/',cov.n);console.log(cov.ex.join('\n'));
await pg.evaluate(()=>Practice.start(QBANK.all().filter(q=>q.ch==='ds-hash').map(q=>q.id),{title:'t',ch:'ds-hash',direct:true}));await pg.waitForTimeout(300);
let found=false;
for(let i=0;i<11&&!found;i++){ if(await pg.locator('#stGo').count()){await pg.click('#stGo');await pg.waitForTimeout(150);}
 await H.wrong(pg);await pg.waitForTimeout(200);
 if(await pg.locator('#goSpot').count()){found=true;console.log('btn:',await pg.locator('#goSpot').innerText());await pg.click('#goSpot');await pg.waitForTimeout(900);
   console.log('url',pg.url().split('#')[1],'open sections:',await pg.evaluate(()=>[...document.querySelectorAll('details.sec')].map((d,i)=>d.open?i+1:'').filter(Boolean)));}
 else {await pg.locator('[data-cause]').first().click();await pg.waitForTimeout(150);} }
console.log(errs);await b.close();})();

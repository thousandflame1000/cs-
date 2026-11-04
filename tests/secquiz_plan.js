const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#go');await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{let tot=0,withq=0,k={tf:0,rc:0,sq:0},future=0;for(const l of DATA.lessons){delete l._sq;const p=secQuizPlan(l);tot+=p.length;p.forEach((x,i)=>{if(x){withq++;k[x.rc?'rc':x.c?'tf':'sq']++;if(x.at>i)future++;}});}
 const pl=id=>{const l=LESSON[id];delete l._sq;return secQuizPlan(l).map((x,i)=>x?((x.rc?'回':x.c?'卡':'單')+'@'+x.at):'—').join(' ')};return {tot,withq,k,future,hash:pl('ds-hash'),ds:pl('ds-amortized')};});
console.log(JSON.stringify(r),errs);await b.close();})();

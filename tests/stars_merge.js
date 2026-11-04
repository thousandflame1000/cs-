const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#practice');await pg.waitForTimeout(1200);
// 舊資料搬家
await pg.evaluate(()=>{localStorage.setItem('chStars',JSON.stringify({'ds-sort':2}));localStorage.setItem('dictate',JSON.stringify({'ds-heap':{date:'2020-01-01',hit:2,total:5}}));delete S.st.stars;delete S.st.dict;});
const r=await pg.evaluate(()=>{const a=[Practice.starGet('ds-sort'),!!S.st.stars,Practice.dictRedo().length];
 const m=Sync.merge(Object.assign({},S.st,{stars:{'ds-sort':2,'al-dp':1},dict:{'ds-heap':{date:'2020-01-01',hit:2,total:5}}}),Object.assign({},S.st,{stars:{'ds-sort':3},dict:{'ds-heap':{date:'2026-11-03',hit:5,total:5}}}));
 return a.concat([JSON.stringify(m.stars),m.dict['ds-heap'].hit]);});
console.log(r,errs);await b.close();})();

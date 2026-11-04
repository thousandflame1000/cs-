const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#go');await pg.waitForTimeout(1000);
await pg.evaluate(()=>{S.st.onboarded=true;S.save();});
const routes=await pg.evaluate(()=>['go','today','plan','practice','gen','cards','wrong','stats','agent','methods','setup','rewards','lab','feed'].concat(DATA.lessons.map(l=>l.id)).concat(DATA.subjects.map(s=>'subj-'+s.id)).concat(Labs&&Labs.list?Labs.list.map(x=>'lab-'+x.id):[]));
const bad=[];
for(const r of routes){await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#'+r);await pg.waitForTimeout(r.startsWith('lab-')?700:350);
  // 打開所有段落再量
  await pg.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));await pg.waitForTimeout(100);
  const o=await pg.evaluate(()=>{const W=document.documentElement.clientWidth;const out=[];document.querySelectorAll('main *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>W+2){let p=e.parentElement,clip=false;while(p&&p.tagName!=='MAIN'){const cs=getComputedStyle(p);if(/(auto|scroll|hidden)/.test(cs.overflowX)){clip=true;break;}p=p.parentElement;}if(!clip)out.push(e.tagName.toLowerCase()+'.'+(e.className&&e.className.baseVal===undefined?String(e.className).split(' ')[0]:'')+':'+Math.round(r.right));}});return [document.documentElement.scrollWidth>W+2,out.slice(0,3)];});
  if(o[0]||o[1].length) bad.push(r+' '+JSON.stringify(o));}
console.log('routes',routes.length);console.log(bad.join('\n')||'no overflow');console.log('errs',errs.slice(0,5));await b.close();})();

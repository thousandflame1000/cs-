// 「只看重點」時每段剩下多少字：太少（< 25%）代表重點被藏掉了
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#go');await pg.waitForTimeout(800);
const ids=await pg.evaluate(()=>DATA.lessons.map(l=>l.id));const low=[];let tot=0,sum=0;
for(const id of ids){await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#'+id);await pg.waitForTimeout(300);
 const r=await pg.evaluate(()=>{const body=document.getElementById('lessonBody');const ds=[...body.querySelectorAll('details.sec')];ds.forEach(d=>d.open=true);
  const vis=el=>{let n=0;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode()){const p=t.parentElement;if(p.closest('.sec-quiz,.sec-nav,summary,.katex-mathml'))continue;if(p.offsetParent!==null||p.getClientRects().length)n+=t.textContent.trim().length;}return n;};
  body.classList.add('skim');const a=ds.map(vis);body.classList.remove('skim');const f=ds.map(vis);body.classList.add('skim');return a.map((x,i)=>[x,f[i],ds[i].querySelector('summary').innerText.replace(/\n/g,' ')]);});
 r.forEach(([a,f,t])=>{tot++;sum+=a/Math.max(1,f);if(a/Math.max(1,f)<.25)low.push(id+' | '+t+' | '+a+'/'+f);});}
console.log('sections',tot,'avg kept',(sum/tot*100).toFixed(0)+'%','too-little',low.length);console.log(low.slice(0,25).join('\n'));await b.close();})();

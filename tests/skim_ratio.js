// 「只看重點」：段落文字全部收起，但每段至少要留下要點框／提示框／圖／表／公式其中一樣
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
const P='http://localhost:'+(process.env.PORT||8801)+'/index.html#';
await pg.goto(P+'go');await pg.waitForTimeout(800);
const ids=await pg.evaluate(()=>DATA.lessons.map(l=>l.id));const empty=[];let tot=0,paras=0;
for(const id of ids){await pg.goto(P+id);await pg.waitForTimeout(300);
 const r=await pg.evaluate(()=>{const body=document.getElementById('lessonBody');body.classList.add('skim');const ds=[...body.querySelectorAll('details.sec')];ds.forEach(d=>d.open=true);
  return ds.map(d=>{const keep=[...d.children].filter(el=>el.matches('aside.callout, figure, .fgw, .fg-row, table, .table-wrap, p:has(> .katex-display), div:has(> svg)')&&el.offsetParent!==null).length;
   const vp=[...d.children].filter(el=>el.tagName==='P'&&el.offsetParent!==null&&!el.querySelector('.katex-display')).length;return [keep,vp,d.querySelector('summary').innerText.replace(/\n/g,' ')];});});
 r.forEach(([k,vp,t])=>{tot++;paras+=vp;if(!k)empty.push(id+' | '+t);});}
console.log('sections',tot,'visible paragraphs',paras,'empty',empty.length);console.log(empty.slice(0,20).join('\n'));await b.close();})();

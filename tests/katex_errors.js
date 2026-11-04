const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext()).newPage();
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/index.html#go');await pg.waitForTimeout(1000);
const r=await pg.evaluate(()=>{const bad=[];const chk=(src,where)=>{if(!src)return;const d=document.createElement('div');d.innerHTML=md(String(src));d.querySelectorAll('.katex-error').forEach(e=>bad.push(where+' :: '+(e.getAttribute('title')||'').slice(0,80)+' :: '+e.textContent.slice(0,60)));};
 DATA.lessons.forEach(l=>{chk(l.body,l.id+'/body');chk(l.intuit,l.id+'/intuit');(l.rubric||[]).forEach((x,i)=>chk(x,l.id+'/rubric'+i));(l.recall||[]).forEach((x,i)=>chk(x,l.id+'/recall'+i));chk(l.feynman,l.id+'/feyn');if(l.worked){chk(l.worked.q,l.id+'/wk.q');l.worked.steps.forEach((s,i)=>{chk(s.t,l.id+'/wk.t'+i);chk(s.b,l.id+'/wk.b'+i)});chk(l.worked.ans,l.id+'/wk.ans');chk(l.worked.err,l.id+'/wk.err');}});
 QBANK.all().forEach(q=>{chk(q.stem,q.id+'/stem');chk(q.expl,q.id+'/expl');(q.opts||[]).forEach((o,i)=>chk(o,q.id+'/opt'+i));});
 DATA.cards.forEach(c=>{chk(c.front,c.id+'/front');chk(c.back,c.id+'/back');});
 return bad;});
console.log(r.length);console.log(r.slice(0,30).join('\n'));await b.close();})();

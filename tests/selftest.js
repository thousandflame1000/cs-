const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:'+(process.env.PORT||8801)+'/selftest.html');await pg.waitForTimeout(6000);
console.log((await pg.innerText('body')).slice(-300),errs);await b.close();})();

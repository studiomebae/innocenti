const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
test('catalogo, filtri, richiesta e layout mobile',async()=>{
 const browser=await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000');
 assert.equal(await page.locator('.card').count(),4);
 await page.getByRole('button',{name:'Con piscina'}).click();
 assert.equal(await page.locator('.card').count(),2);
 await page.getByRole('button',{name:/Tutte le dimore/}).click();
 await page.locator('#destination').selectOption('Firenze');
 await page.locator('#search').getByRole('button').click();
 assert.equal(await page.locator('.card').count(),1);
 await page.getByRole('button',{name:/Scopri la dimora/}).click();
 await page.locator('[name=arrival]').fill('2027-06-10');
 await page.locator('[name=departure]').fill('2027-06-13');
 await page.locator('[name=name]').fill('Ospite di prova');
 await page.locator('[name=email]').fill('ospite@example.com');
 assert.match(await page.locator('#estimate').textContent(),/570/);
 await page.getByRole('button',{name:/Prepara richiesta/}).click();
 assert.match(await page.locator('.request-summary').textContent(),/La Terrazza di Firenze/);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:/Scarica il riepilogo/}).click();assert.equal((await download).suggestedFilename(),'richiesta-innocenti.txt');
 await page.getByRole('button',{name:'Chiudi',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.deepEqual(errors,[]);
 } finally {await browser.close();}
});

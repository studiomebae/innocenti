const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const yaml = require('yaml');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const base = 'http://127.0.0.1:3000';
const launch = () => chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
const json = async file => JSON.parse(await fs.readFile(file,'utf8'));
const writeJson = (file,data) => fs.writeFile(file,JSON.stringify(data,null,2));
async function configAndTree() {
  const config = yaml.parse(await fs.readFile(path.join(root,'public/admin/config.yml'),'utf8'));
  const tree = {};
  for (const collection of config.collections) {
    for (const file of collection.files) {
      let directory = tree;
      const parts = file.file.split('/');
      for (const part of parts.slice(0,-1)) directory = directory[part] ??= {};
      directory[parts.at(-1)] = {path:file.file,content:await fs.readFile(path.join(root,file.file),'utf8')};
    }
  }
  return {config,tree};
}
async function viewBuild(page, outDir) {
  await page.route('http://innocenti.test/**', async route => {
    const url = new URL(route.request().url());
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.join(outDir,relative);
    const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)] || 'application/octet-stream';
    try { await route.fulfill({contentType:type,body:await fs.readFile(file)}); }
    catch { await route.fulfill({status:404,body:'Not found'}); }
  });
}

test('CMS di produzione: accesso GitHub, guida e campi collegati ai contenuti', async () => {
  const {config} = await configAndTree();
  assert.equal(config.backend.name,'github');
  assert.equal(config.backend.repo,'studiomebae/innocenti');
  assert.equal(config.backend.branch,'main');
  assert.equal(config.local_backend,undefined);
  assert.equal(config.media_folder,'public/uploads');
  // Every form field has a real persisted value, including all property galleries.
  function validate(fields,data) {
    for (const field of fields) {
      assert.ok(Object.hasOwn(data,field.name), `Campo senza contenuto: ${field.name}`);
      if(field.widget === 'object') validate(field.fields,data[field.name]);
      if(field.widget === 'list' && field.fields) for(const item of data[field.name]) validate(field.fields,item);
    }
  }
  for(const collection of config.collections) for(const file of collection.files) validate(file.fields,await json(path.join(root,file.file)));
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    assert.equal((await page.goto(`${base}/admin/`)).status(),200);
    await page.getByRole('button',{name:'Accedi con GitHub'}).waitFor();
    await page.getByRole('link',{name:/Come aggiornare il sito/}).waitFor();
    const guide = await page.request.get(`${base}/admin/guida.html`);
    assert.equal(guide.status(),200);
    assert.match(await guide.text(),/Prima attivazione/);
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
});

test('una modifica pubblicata nel CMS viene salvata nel JSON e appare nella pagina ricostruita', async () => {
  const {build} = await import('../scripts/build.mjs');
  const {config,tree} = await configAndTree();
  const temp = await fs.mkdtemp(path.join(os.tmpdir(),'innocenti-cms-'));
  const browser = await launch();
  try {
    // Use Decap's in-memory test backend only inside this browser test. No GitHub write occurs.
    config.backend = {name:'test-repo',login:false};
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(repo => {window.repoFiles = repo;},tree);
    await page.route('**/admin/config.yml',route=>route.fulfill({contentType:'text/yaml',body:yaml.stringify(config)}));
    await page.goto(`${base}/admin/#/collections/pages/entries/home`);
    await page.locator('[id^=hero-field-]').getByRole('button',{name:'Expand',exact:true}).click();
    await page.getByLabel('Titolo – prima riga',{exact:true}).fill('La tua Toscana,');
    await page.getByRole('button',{name:'Pubblica',exact:true}).click();
    await page.getByText('Pubblica ora',{exact:true}).click();
    // Decap persists the same JSON data that the GitHub backend would commit.
    await page.waitForFunction(()=>JSON.parse(window.repoFiles.content.pages['home.json'].content).hero.text_02 === 'La tua Toscana,');
    const saved = await page.evaluate(()=>window.repoFiles.content.pages['home.json'].content);
    const contentDir = path.join(temp,'content');
    await fs.cp(path.join(root,'content'),contentDir,{recursive:true});
    await fs.writeFile(path.join(contentDir,'pages/home.json'),saved);
    const outDir = path.join(temp,'dist');
    assert.deepEqual(await build({contentDir,outDir}),{homes:4,pages:7});
    await viewBuild(page,outDir);
    await page.goto('http://innocenti.test/');
    assert.match(await page.locator('h1').textContent(),/^La tua Toscana,/);
    assert.equal(await page.locator('.card').count(),4);
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
    await fs.rm(temp,{recursive:true,force:true});
  }
});

test('contenuti aggiornati su schede, catalogo, contatti e servizi; HTML sicuro e build non distruttiva', async () => {
  const {build} = await import('../scripts/build.mjs');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(),'innocenti-content-'));
  const browser = await launch();
  try {
    const contentDir = path.join(temp,'content'), outDir = path.join(temp,'dist');
    await fs.cp(path.join(root,'content'),contentDir,{recursive:true});
    const homeFile = path.join(contentDir,'dimore/casale-degli-ulivi.json');
    const home = await json(homeFile);
    home.name = 'Casale <img src=x onerror=alert(1)> & Ulivi';
    home.description = 'Una nuova descrizione scelta dal cliente.';
    home.place = 'Pienza';home.price = 350;home.area = 200;home.guests = 8;
    home.amenities = ['Wi-Fi','Piscina','Aria condizionata'];
    home.photos = [home.photos[1],home.photos[0]];
    await writeJson(homeFile,home);
    const contactFile=path.join(contentDir,'pages/contact.json');
    const contact=await json(contactFile);contact.contact_details.text_04='cliente@innocenti.example';await writeJson(contactFile,contact);
    const servicesFile=path.join(contentDir,'pages/services.json');
    const services=await json(servicesFile);services.host.text_01='SERVIZI SU MISURA PER HOST';await writeJson(servicesFile,services);
    const siteFile=path.join(contentDir,'site.json');
    const site=await json(siteFile);site.footer.text_03='Un nuovo modo di viaggiare.';await writeJson(siteFile,site);
    await build({contentDir,outDir});
    const page = await browser.newPage();
    const errors = [];page.on('pageerror',error=>errors.push(error.message));
    await viewBuild(page,outDir);
    await page.goto('http://innocenti.test/');
    assert.equal(await page.locator('.card h3').first().textContent(),home.name);
    assert.equal(await page.locator('.card h3 img').count(),0);
    assert.equal(await page.locator('#destination').getByRole('option',{name:'Pienza'}).count(),1);
    assert.match(await page.locator('.card').first().textContent(),/350/);
    assert.match(await page.locator('footer').textContent(),/Un nuovo modo di viaggiare/);
    await page.goto('http://innocenti.test/dimore/casale-degli-ulivi.html');
    assert.equal(await page.locator('h1').textContent(),home.name);
    assert.equal(await page.locator('h1 img').count(),0);
    assert.equal(await page.locator('.description').textContent(),home.description);
    assert.equal(await page.locator('.gallery-counter').textContent(),'1 / 2');
    assert.match(await page.locator('#gallery-image').getAttribute('src'),/photo-1600210492486/);
    assert.equal(await page.locator('.amenities li').count(),3);
    assert.match(await page.locator('.specification-list').textContent(),/200 m²/);
    assert.match(await page.locator('.property-meta').textContent(),/8 ospiti/);
    assert.equal(await page.locator('meta[name=description]').getAttribute('content'),home.description);
    await page.getByRole('button',{name:/Richiedi il soggiorno/}).click();
    assert.equal(await page.locator('#booking h2').textContent(),home.name);
    assert.equal(await page.locator('#booking h2 img').count(),0);
    await page.goto('http://innocenti.test/contatti.html');
    assert.match(await page.locator('.contact-details').textContent(),/cliente@innocenti.example/);
    await page.goto('http://innocenti.test/servizi.html');
    assert.match(await page.locator('#host').textContent(),/SERVIZI SU MISURA PER HOST/);
    for(const file of ['index.html','contatti.html','servizi.html','dimore/casale-degli-ulivi.html']) assert.doesNotMatch(await fs.readFile(path.join(outDir,file),'utf8'),/\{\{(?:page|property|site)\./);
    assert.deepEqual(errors,[]);
    const goodBuild=await fs.readFile(path.join(outDir,'index.html'),'utf8');
    home.photos[0].image='javascript:alert(1)';await writeJson(homeFile,home);
    await assert.rejects(build({contentDir,outDir}),/HTTPS/);
    assert.equal(await fs.readFile(path.join(outDir,'index.html'),'utf8'),goodBuild);
  } finally {
    await browser.close();
    await fs.rm(temp,{recursive:true,force:true});
  }
});

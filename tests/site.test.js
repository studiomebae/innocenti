const {test} = require('node:test');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = 'http://127.0.0.1:3000';
const launch = () => chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});

test('filtri, pagina della dimora, date conservate e richiesta di soggiorno', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    assert.equal(await page.locator('.card').count(), 4);
    await page.getByRole('button', {name:'Con piscina'}).click();
    assert.equal(await page.locator('.card').count(), 2);
    await page.getByRole('button', {name:/Tutte le dimore/}).click();
    await page.locator('#destination').selectOption('Firenze');
    await page.locator('#arrival').fill('2027-06-10');
    await page.locator('#departure').fill('2027-06-13');
    await page.locator('#guests').selectOption('4');
    await page.locator('#search').getByRole('button').click();
    assert.equal(await page.locator('.card').count(), 1);
    await page.getByRole('link', {name:/Scopri la dimora/}).click();
    assert.match(page.url(), /dimore\/la-terrazza-di-firenze.html/);
    assert.equal(await page.locator('h1').textContent(), 'La Terrazza di Firenze');
    await page.getByRole('button', {name:/Richiedi il soggiorno/}).click();
    assert.equal(await page.locator('[name=arrival]').inputValue(), '2027-06-10');
    assert.equal(await page.locator('[name=departure]').inputValue(), '2027-06-13');
    assert.equal(await page.locator('[name=guests]').inputValue(), '4');
    await page.locator('[name=departure]').fill('2027-06-09');
    await page.locator('[name=name]').fill('Ospite di prova');
    await page.locator('[name=email]').fill('ospite@example.com');
    await page.getByRole('button', {name:/Prepara richiesta/}).click();
    assert.match(await page.locator('#form-error').textContent(), /successiva/);
    await page.locator('[name=departure]').fill('2027-06-13');
    assert.match(await page.locator('#estimate').textContent(), /570/);
    await page.getByRole('button', {name:/Prepara richiesta/}).click();
    assert.match(await page.locator('.request-summary').textContent(), /La Terrazza di Firenze/);
    const download = page.waitForEvent('download');
    await page.getByRole('button', {name:/Scarica il riepilogo/}).click();
    assert.equal((await download).suggestedFilename(), 'richiesta-innocenti.txt');
    await page.getByRole('button', {name:'Chiudi',exact:true}).click();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('tutte le dimore: URL diretti, carosello, specifiche e layout desktop/mobile', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const paths = ['casale-degli-ulivi','la-terrazza-di-firenze','villa-le-vigne','il-giardino-segreto'];
    for (const slug of paths) {
      const response = await page.goto(`${base}/dimore/${slug}.html`);
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('.specification-list > div').count(), 8);
      assert.ok(await page.locator('.amenities li').count() >= 12);
      assert.equal(await page.locator('.gallery-counter').textContent(), '1 / 4');
      const initial = await page.locator('#gallery-image').getAttribute('src');
      await page.getByRole('button', {name:'Foto successiva'}).click();
      assert.equal(await page.locator('.gallery-counter').textContent(), '2 / 4');
      assert.notEqual(await page.locator('#gallery-image').getAttribute('src'), initial);
      await page.getByRole('button', {name:'Foto precedente'}).click();
      await page.getByRole('button', {name:'Foto precedente'}).click();
      assert.equal(await page.locator('.gallery-counter').textContent(), '4 / 4');
      await page.getByRole('button', {name:/Mostra foto 2/}).click();
      assert.equal(await page.locator('.gallery-counter').textContent(), '2 / 4');
      await page.locator('.gallery-main').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.gallery-counter').textContent(), '3 / 4');
      for (const width of [1440,768,390,320]) {
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${slug} at ${width}px`);
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(255, 255, 255)');
        const margins = await page.locator('.property-heading').evaluate(el => {
          const rect = el.getBoundingClientRect();
          return [rect.left, window.innerWidth - rect.right];
        });
        assert.ok(margins.every(m => m <= 20));
      }
    }
    // URL input is not allowed to become HTML in the booking form.
    await page.goto(`${base}/dimore/casale-degli-ulivi.html?arrival=2027-06-10%22%3E%3Cimg%3E&departure=2028-01-01`);
    await page.getByRole('button', {name:/Richiedi il soggiorno/}).click();
    assert.equal(await page.locator('[name=arrival]').inputValue(), '');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('servizi host, contatti di esempio e messaggio locale', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/servizi.html`);
    assert.equal(await page.locator('#host .service-grid article').count(), 6);
    await page.getByRole('link', {name:/Parliamo della tua proprietà/}).click();
    assert.match(page.url(), /contatti.html\?interesse=host/);
    assert.equal(await page.locator('[name=interest]').inputValue(), 'host');
    assert.match(await page.locator('.contact-details').textContent(), /info@innocenti.example/);
    await page.locator('[name=name]').fill('Proprietario di prova');
    await page.locator('[name=email]').fill('host@example.com');
    await page.locator('[name=message]').fill('Vorrei informazioni per la mia proprietà. <script>test</script>');
    await page.getByRole('button', {name:/Prepara il messaggio/}).click();
    assert.equal(await page.locator('.contact-form').isVisible(), false);
    assert.match(await page.locator('#contact-result').textContent(), /Nessun invio effettuato/);
    assert.equal(await page.locator('#contact-result script').count(), 0);
    const download = page.waitForEvent('download');
    await page.getByRole('button', {name:/Scarica il messaggio/}).click();
    assert.equal((await download).suggestedFilename(), 'messaggio-innocenti.txt');
    await page.getByRole('button', {name:'Scrivi un altro messaggio'}).click();
    assert.equal(await page.locator('.contact-form').isVisible(), true);
    for (const path of ['/', '/servizi.html', '/contatti.html']) {
      for (const width of [1440,390,320]) {
        await page.setViewportSize({width,height:900});
        await page.goto(`${base}${path}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${path} at ${width}px`);
        assert.equal(await page.getByRole('navigation', {name:'Navigazione principale'}).getByRole('link').count(), 4);
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

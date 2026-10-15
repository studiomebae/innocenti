import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));

function render(template, data) {
  return template.replace(/\{\{\{([\w.]+)\}\}\}|\{\{([\w.]+)\}\}/g, (_, raw, escaped) => {
    const key = raw || escaped;
    const value = key.split('.').reduce((object, part) => object?.[part], data);
    if (value === undefined || value === null) throw new Error(`Contenuto mancante: ${key}`);
    return raw ? String(value) : escapeHtml(value);
  });
}

export function photoUrl(source, width = 1800) {
  if (typeof source !== 'string') throw new Error('La fotografia deve essere un percorso o un URL HTTPS.');
  if (source.startsWith('/uploads/')) {
    const decoded = decodeURIComponent(source);
    if (decoded.split('/').includes('..') || /[\\\x00-\x1f?#]/.test(decoded)) throw new Error('Percorso immagine non valido.');
    return source;
  }
  const url = new URL(source);
  if (url.protocol !== 'https:') throw new Error('Le fotografie esterne devono usare HTTPS.');
  if (url.hostname === 'images.unsplash.com') {
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', width > 400 ? '85' : '80');
  }
  return url.href;
}

function validateHomes(homes) {
  const ids = new Set(), slugs = new Set();
  for (const home of homes) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(home.slug) || slugs.has(home.slug)) throw new Error('URL di una dimora non valido o duplicato.');
    if (!Number.isInteger(home.id) || home.id < 1 || ids.has(home.id)) throw new Error('ID di una dimora non valido o duplicato.');
    slugs.add(home.slug); ids.add(home.id);
    for (const field of ['name','place','kind','description','accessibility']) {
      if (typeof home[field] !== 'string' || !home[field].trim()) throw new Error(`${home.slug}: campo ${field} mancante.`);
    }
    for (const field of ['guests','bedrooms','baths','area','price']) {
      if (!Number.isInteger(home[field]) || home[field] < (field === 'price' ? 0 : 1)) throw new Error(`${home.slug}: ${field} non valido.`);
    }
    if (!['Campagna','Città'].includes(home.type) || typeof home.pool !== 'boolean') throw new Error(`${home.slug}: categoria o piscina non valida.`);
    for (const field of ['amenities','beds','rules']) {
      if (!Array.isArray(home[field]) || !home[field].length || home[field].some(item => typeof item !== 'string' || !item.trim())) throw new Error(`${home.slug}: ${field} non valido.`);
    }
    if (!Array.isArray(home.photos) || !home.photos.length || home.photos.length > 30) throw new Error(`${home.slug}: inserire da 1 a 30 foto.`);
    for (const photo of home.photos) {
      photoUrl(photo.image);
      if (typeof photo.alt !== 'string' || !photo.alt.trim()) throw new Error(`${home.slug}: descrizione foto mancante.`);
    }
  }
  if (!homes.length) throw new Error('Il catalogo deve contenere almeno una dimora.');
}

function gallery(home) {
  const e = escapeHtml;
  return `<section class="gallery page-section" aria-label="Galleria fotografica di ${e(home.name)}"><div class="gallery-main" tabindex="0" aria-label="Carosello foto. Usa le frecce destra e sinistra."><img id="gallery-image" src="${e(photoUrl(home.photos[0].image))}" alt="${e(home.photos[0].alt)}"><button class="gallery-prev" aria-label="Foto precedente">←</button><button class="gallery-next" aria-label="Foto successiva">→</button><span class="gallery-counter" aria-live="polite">1 / ${home.photos.length}</span></div><div class="thumbnails">${home.photos.map((photo, index) => `<button class="thumbnail ${index === 0 ? 'selected' : ''}" data-slide="${index}" aria-label="Mostra foto ${index+1}: ${e(photo.alt)}" aria-pressed="${index === 0}"><img src="${e(photoUrl(photo.image,400))}" alt="${e(photo.alt)}" loading="lazy"></button>`).join('')}</div><p class="demo-note">Scheda dimostrativa · Tutte le fotografie sono illustrative e non raffigurano una proprietà verificata.</p></section>`;
}

function propertyData(home) {
  const e = escapeHtml;
  const specs = [['Tipologia', home.kind], ['Spazi', 'Intera dimora ad uso esclusivo'], ['Ospiti', home.guests], ['Camere da letto',home.bedrooms], ['Bagni',home.baths], ['Superficie',`${home.area} m²`], ['Località',home.place], ['Piano / accessibilità',home.accessibility]];
  return {...home, location: home.place.toUpperCase(), gallery: gallery(home),
    specs: specs.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join(''),
    beds_html: home.beds.map(bed=>`<li><span aria-hidden="true">◇</span>${e(bed)}</li>`).join(''),
    amenities_html: home.amenities.map(item=>`<li><span aria-hidden="true">✓</span>${e(item)}</li>`).join(''),
    rules_html: [`Massimo ${home.guests} ospiti`,...home.rules].map(rule=>`<li>${e(rule)}</li>`).join('')
  };
}

export async function build({contentDir = path.join(ROOT,'content'), outDir = path.join(ROOT,'dist')} = {}) {
  const [site, homePage, services, contact, property, filenames] = await Promise.all([
    readJson(path.join(contentDir,'site.json')),
    ...['home','services','contact','property'].map(name=>readJson(path.join(contentDir,'pages',`${name}.json`))),
    fs.readdir(path.join(contentDir,'dimore'))
  ]);
  const homes = await Promise.all(filenames.filter(name=>name.endsWith('.json')).map(name=>readJson(path.join(contentDir,'dimore',name))));
  homes.sort((a,b)=>a.id-b.id);
  validateHomes(homes);
  const template = async name => fs.readFile(path.join(ROOT,'templates',`${name}.html`),'utf8');
  const [header,footer] = await Promise.all(['header','footer'].map(async name=>render(await template(name),{site})));
  const shared = {site,header,footer};
  const destinations = '<option value="">Tutta la Toscana</option>' + [...new Set(homes.map(home=>home.place))].map(place=>`<option value="${escapeHtml(place)}">${escapeHtml(place)}</option>`).join('');
  const documents = new Map();
  for (const [name, filename, page] of [['home','index.html',homePage],['services','servizi.html',services],['contact','contatti.html',contact]]) {
    documents.set(filename,render(await template(name),{...shared,page,destinations}));
  }
  const propertyTemplate = await template('property');
  for (const home of homes) documents.set(`dimore/${home.slug}.html`,render(propertyTemplate,{...shared,page:property,property:propertyData(home)}));

  // Work in a temporary output directory; invalid content never replaces a good build.
  const stage = await fs.mkdtemp(path.join(path.dirname(outDir),'.innocenti-build-'));
  try {
    await fs.cp(path.join(ROOT,'public'),stage,{recursive:true});
    await fs.mkdir(path.join(stage,'dimore'),{recursive:true});
    for (const [filename,html] of documents) await fs.writeFile(path.join(stage,filename),html);
    const browserHomes = homes.map(home=>({...home,image:photoUrl(home.photos[0].image,1000)}));
    await fs.writeFile(path.join(stage,'homes.js'),`window.INNOCENTI_HOMES = ${JSON.stringify(browserHomes).replace(/</g,'\\u003c')};\n`);
    const vendorDir = path.join(stage,'admin','vendor');
    await fs.mkdir(vendorDir,{recursive:true});
    const decapDir = path.join(ROOT,'node_modules','decap-cms','dist');
    const vendorFiles = (await fs.readdir(decapDir)).filter(name=>name === 'decap-cms.js' || name.endsWith('.decap-cms.js') || name.endsWith('.wasm') || name.endsWith('.css') || name.endsWith('.LICENSE.txt'));
    await Promise.all(vendorFiles.map(name=>fs.copyFile(path.join(decapDir,name),path.join(vendorDir,name))));
    await fs.rm(outDir,{recursive:true,force:true});
    await fs.rename(stage,outDir);
  } catch (error) {
    await fs.rm(stage,{recursive:true,force:true});
    throw error;
  }
  return {homes:homes.length,pages:documents.size};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Sito generato: ${result.pages} pagine, ${result.homes} dimore e CMS /admin/.`);
}

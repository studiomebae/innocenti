# Innocenti — Abitare la Toscana

Sito in italiano per affitti brevi in Toscana con catalogo, pagine delle dimore, servizi per ospiti e host, contatti e CMS Decap per il cliente. Sfondo bianco, margini laterali entro 20 px, titoli Playfair Display/Georgia e testi Helvetica/Arial.

## Sviluppo

Con Node.js 24:

```sh
npm ci --cache /workspace/.cache/npm
npm run dev
```

Il server usa la porta 3000, modificabile tramite `PORT`. `npm run dev` genera il sito in `dist/` e avvia il server. Per modifiche locali successive a contenuti, template o risorse, eseguire `npm run build` e ricaricare la pagina. Non modificare direttamente `dist/`: contiene output generati ed è esclusa da Git.

- `content/pages/*.json`: testi e SEO delle pagine, organizzati per sezione.
- `content/site.json`: menu e piè di pagina.
- `content/dimore/*.json`: nome, località, descrizione, tariffe, capienza, fotografie, camere, dotazioni e regole.
- `templates/`: struttura HTML delle pagine.
- `public/`: JavaScript, CSS, configurazione CMS e immagini caricate.
- `scripts/build.mjs`: generazione del sito, validazione dei contenuti e inclusione locale del bundle Decap.

Il sito pubblicato è statico e non richiede il server Node in produzione. I testi modificati vengono inseriti nell’HTML generato; il catalogo e le richieste di soggiorno usano gli stessi dati delle schede. Le stringhe del CMS sono trattate come testo, senza eseguire HTML inserito nei campi.

## Pagine

- `/`: homepage e catalogo filtrabile.
- `/dimore/casale-degli-ulivi.html`
- `/dimore/la-terrazza-di-firenze.html`
- `/dimore/villa-le-vigne.html`
- `/dimore/il-giardino-segreto.html`
- `/servizi.html`
- `/contatti.html`
- `/admin/`: area cliente in italiano.
- `/admin/guida.html`: guida cliente e attivazione amministratore.

Le schede includono un carosello con frecce, miniature, tastiera e swipe. Le date e il numero di ospiti passano dal catalogo alla richiesta di soggiorno. Gli URL delle quattro dimore restano fissi: il CMS modifica le schede esistenti senza crearle o eliminarle.

## CMS e Netlify

Decap CMS **3.17.1** è servito localmente dal sito: il build copia bundle, chunk e licenze dal pacchetto npm verificato nel lockfile. Non è necessario un CDN esterno per avviare il pannello.

La configurazione `public/admin/config.yml` usa il backend GitHub, repository `studiomebae/innocenti`, branch `main`. Premendo **Pubblica → Pubblica ora**, il CMS salva i contenuti JSON in GitHub. Il deploy automatico Netlify esegue `npm run build` e pubblica `dist`, come indicato in `netlify.toml`. Non mantenere override Netlify che forzano la vecchia cartella `public` o un comando di build vuoto.

Le immagini caricate dal CMS sono versionate in `public/uploads/` e pubblicate sotto `/uploads/`. La prima foto di ogni dimora viene usata anche nel catalogo.

### Prima attivazione dell’accesso reale

1. Creare un’app OAuth GitHub per il dominio di produzione. La callback del provider Netlify è `https://api.netlify.com/auth/done`.
2. Nella configurazione del progetto Netlify, installare GitHub sotto **OAuth providers** usando il Client ID e il Client Secret dell’app. Il segreto va inserito solo in Netlify, mai nel repository, nel CMS o in chat.
3. Invitare il cliente su GitHub come collaboratore del repository con permesso **Write**. Verificare anche che possa pubblicare su `main` e che i deploy automatici siano attivi.
4. Dal dominio di produzione aprire `/admin/`, accedere come cliente e verificare una modifica fino al completamento del deploy.

Il backend GitHub concede al cliente accesso in scrittura al repository, non soltanto ai contenuti; per permessi limitati ai contenuti serve un backend con ruoli dedicati. Una configurazione con pull request obbligatorie richiede un flusso editoriale diverso dal salvataggio diretto attuale.

Procedura e risoluzione dei problemi: `/admin/guida.html`. Documentazione ufficiale: [Decap GitHub backend](https://decapcms.org/docs/github-backend/) e [provider di autenticazione Netlify](https://www.netlify.com/docs/authentication-providers/#using-an-authentication-provider).

## Verifica

Con il server avviato:

```sh
npm test
```

I test usano Chromium in `/usr/bin/chromium`; impostare `CHROMIUM_PATH` per un’altra installazione. Verificano filtri, navigazione, date, riepiloghi, caroselli, contatti e layout da 320 a 1440 px. Le prove CMS coprono la schermata di accesso, la corrispondenza dei campi ai dati, la pubblicazione in memoria e il risultato del build su pagine e catalogo. Verificano anche che un contenuto non valido non sostituisca un build riuscito.

Il backend di test di Decap viene attivato esclusivamente intercettando la configurazione nel browser di test. La configurazione distribuita mantiene il backend GitHub e non include login anonimo o server di scrittura locale. Il login di produzione e il salvataggio remoto richiedono OAuth configurato e account cliente: non sono verificati dalle prove in memoria.

## Stato dei contenuti

Dimore, specifiche, tariffe, regole e recapiti iniziali sono dimostrativi. Le fotografie Unsplash sono illustrative e non rappresentano proprietà verificate. Il font Playfair Display viene caricato da Google Fonts.

I moduli preparano solo riepiloghi scaricabili nel browser, senza invio di messaggi, conferma delle prenotazioni, pagamenti o blocco delle disponibilità. Il CMS non cambia questo comportamento. Prima del lancio reale, sostituire i contenuti e collegare i servizi necessari per contatti e prenotazioni, definendo condizioni e informativa privacy.

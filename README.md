# Innocenti — Abitare la Toscana

Sito in italiano per affitti brevi in Toscana. Sfondo bianco, margini laterali di 20 px (16 px su mobile), titoli serif Playfair Display con fallback Georgia e testi Helvetica/Arial. Il catalogo include filtri per destinazione, capienza e tipologia.

## Pagine

- `/`: presentazione e catalogo delle quattro dimore dimostrative.
- `/dimore/casale-degli-ulivi.html`
- `/dimore/la-terrazza-di-firenze.html`
- `/dimore/villa-le-vigne.html`
- `/dimore/il-giardino-segreto.html`
- `/servizi.html`: servizi per ospiti e proprietari/host.
- `/contatti.html`: recapiti di esempio e modulo dimostrativo.

Ogni pagina della dimora include carosello con frecce, miniature, navigazione da tastiera e swipe, specifiche, camere, dotazioni, località, regole e richiesta di soggiorno. Date e ospiti vengono conservati quando si passa dal catalogo alla dimora.

## Avvio

Con Node.js 24, eseguire `npm ci` e `npm run dev` nella directory del progetto. Il server usa la porta 3000, modificabile tramite `PORT`. Il sito pubblicato è interamente statico; il server Node serve solo per lo sviluppo locale.

## Test

Con il server avviato, eseguire `npm test`. I test utilizzano Chromium in `/usr/bin/chromium`; impostare `CHROMIUM_PATH` per un'altra installazione. Verificano filtri, navigazione, date, richieste, caroselli, schede delle dimore, modulo contatti e layout da 320 a 1440 px.

## Contenuti dimostrativi

Le dimore, specifiche, tariffe, regole e recapiti sono di esempio. Le fotografie illustrative provengono da Unsplash e non rappresentano proprietà verificate. Playfair Display viene caricato da Google Fonts. Nessuna richiesta viene inviata a un server: i moduli generano riepiloghi scaricabili nel browser, senza conferme, pagamenti o blocco delle disponibilità.

Prima del lancio reale, sostituire i contenuti con immobili e recapiti reali e collegare disponibilità, prenotazioni e gestione dei contatti. Definire inoltre servizi effettivamente offerti, condizioni contrattuali e informativa privacy. Il design è originale: il sito di riferimento non era accessibile durante lo sviluppo.

## Netlify

`netlify.toml` pubblica la cartella `public`, senza comando di build. Importare `studiomebae/innocenti` da GitHub, autorizzare l'accesso e scegliere `main`. Se il repository è già collegato e i deploy automatici sono abilitati, un push su `main` avvia il nuovo deploy. La pubblicazione statica non aggiunge un backend di prenotazione.

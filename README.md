# Innocenti — Abitare la Toscana

Sito in italiano per affitti brevi in Toscana, con catalogo filtrabile, dettagli delle dimore e richiesta di soggiorno dimostrativa.

## Avvio

Node.js 24. Eseguire `npm ci` e `npm run dev` nella directory del progetto. Il server usa la porta 3000 (modificabile tramite `PORT`). Non sono necessarie dipendenze per l'applicazione; Playwright è usato solo per i test.

## Verifica

Con il server avviato, eseguire `npm test`. I test utilizzano Chromium in `/usr/bin/chromium`; impostare `CHROMIUM_PATH` per usare un'altra installazione. Verificano filtri, dettaglio della dimora, stima del soggiorno, download del riepilogo e assenza di overflow orizzontale su mobile.

## Contenuti e prenotazioni

Le quattro dimore, descrizioni e tariffe sono dimostrative. Le fotografie sono illustrative, caricate da Unsplash; i font da Google Fonts. Le richieste sono elaborate nel browser e possono essere scaricate, ma non vengono inviate o memorizzate su un server. Nessun pagamento o blocco delle disponibilità viene eseguito. Prima del lancio, inserire immobili reali e collegare un servizio di prenotazione con disponibilità, conferme, pagamenti e informativa privacy.

Il sito di riferimento non era accessibile durante lo sviluppo; il design è una proposta originale in stile immobiliare di lusso, senza garanzia di corrispondenza esatta.

## Netlify

Il file `netlify.toml` configura la pubblicazione statica della cartella `public`, senza comando di build. Nel pannello Netlify importare `studiomebae/innocenti` da GitHub, autorizzare l'accesso al repository e scegliere il branch `main`. Il server Node è necessario solo per lo sviluppo locale. La pubblicazione non aggiunge un backend di prenotazione.

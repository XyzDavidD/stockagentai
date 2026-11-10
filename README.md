# stockagentai

Dashboard pre-IPO în română, Next.js + TypeScript + Tailwind + Supabase.
Public: https://stockagentai.vercel.app

## Pornire și verificare

Node.js 22.12+; `npm ci`, apoi `npm run dev`.
`npm run typecheck`, `npm test`, `npm run build`.
Dacă mediul local nu permite porturile auxiliare Turbopack, folosește `npx next build --webpack`.

## Milestone 2 — date reale

Pagina citește la fiecare cerere dosarele publicate din Supabase (fără cache static și fără fallback la companii fictive). O eroare de conexiune afișează explicit indisponibilitatea datelor.

Setul inițial, consultat la 10 noiembrie 2026:
- Anthropic: S-1 din 26 octombrie și roadshow anunțat la 10 noiembrie; dată de listare neconfirmată.
- CEC Bank și CN APM Constanța: semnale preliminare din presa din 16 aprilie, fără decizie finală confirmată; marcate ca vechi și necesitând reconfirmare.
- Electro-Alfa International: debut confirmat de BVB la 3 martie; apare separat, în arhivă.

Fiecare dosar păstrează URL-ul sursei, data publicării și data consultării. Consultarea unui document vechi nu confirmă stadiul curent. Scorurile fictive au fost eliminate. Nu există încă evaluare financiară automată sau acoperire exhaustivă.

## Supabase și acces

Proiect: `kvssszorqmzmikmxcwll`, Europa (Irlanda).
- `companies`: profil documentat, vizibil public numai când `published=true`.
- `research_sources`: registru public și ultima verificare reușită.
- `ingestion_candidates`: coadă privată de revizuire, deduplicată după URL.
- `ingestion_runs`: istoric privat al execuțiilor și codurilor de eroare.

RLS este activ pe toate tabelele. `anon`/`authenticated` au doar SELECT pe cercetarea publicată și registrul surselor. Nu au acces la candidați, rulări sau scrieri. Preferințele personale rămân în browser, fără sincronizare. Site-ul public nu are autentificare.

Cheia **publishable** din configurație este destinată expunerii publice și nu poate scrie. Cheia server este păstrată exclusiv în GitHub Actions Secrets pentru worker; nu este publicată în cod sau frontend. Configurația poate fi înlocuită prin variabilele din `.env.example`.

Migrarea inițială este `supabase/migrations/202611100001_research.sql`; a fost aplicată în SQL Editor. Nu se reaplică peste aceleași politici. `supabase/seed.sql` importă setul inițial revizuit; nu îl rula peste cercetări mai noi, deoarece actualizează profilurile cu snapshotul inițial.

## Stare operațională — 10 noiembrie 2026

Colectarea orară este activată (`RESEARCH_ENABLED=true`). Secretul server a fost configurat cu acordul proprietarului. Execuția reală de verificare [42899258147](https://github.com/XyzDavidD/stockagentai/actions/runs/42899258147) a salvat cu succes rezultatele tuturor celor șase surse active în Supabase. Aceasta a fost declanșată manual; prima execuție cron nu era încă observată la activare. Programarea GitHub poate întârzia.

Candidații colectați sunt privați și necesită revizuire înainte să devină dosare publice. Profilele companiilor nu sunt actualizate automat de colectori. Resend, extragerea AI și analiza financiară automată nu sunt încă activate.

## Următorii pași

3. Panou privat de revizuire, documente și afirmații normalizate, reconcilierea stadiilor și extragere AI cu dovezi.
4. Extinderea surselor, alerte la schimbări prin Resend și evaluare financiară separată de certitudinea listării.

Referințele de design ale utilizatorului rămân în `ui-skills`. Datele din surse sunt conținut neîncrezător și nu pot executa instrucțiuni ori accesa secrete.

## Extindere: colectori și rulare orară

Migrarea `202611100002_automated_ingestion.sql` adaugă istoricul încercărilor, numărul de eșecuri consecutive, candidații în așteptare și RPC-ul atomic `record_ingestion`. Funcția este SECURITY INVOKER, executabilă numai de `service_role`; nu publică și nu modifică profiluri de companii. Rulările se deduplică după `(source_id, run_key)`, iar o execuție veche nu suprascrie starea uneia mai noi. Modificarea unui document trimite candidatul înapoi la revizuire.

Surse active în colector:
- Oferte BVB, filtrate de titluri de stat și obligațiuni identificate explicit.
- Comunicate BVB: posibile IPO-uri și evenimente de debut, pentru reconcilierea stadiilor; ETF-urile sunt excluse.
- Noutăți Anthropic: monitorizare de emitent, nu descoperire a tuturor companiilor SUA.
- Deutsche Börse: RSS oficial, cu verificarea domeniilor articolelor.
- Wiener Börse: comunicate recente, inclusiv evenimente de debut marcate pentru revizuire.
- Feedul financiar PR Newswire: indicii din comunicate distribuite, cu piața și tipul ofertei încă de verificat.

SEC este suspendat în configurație după HTTP 403; nu este reîncercat orar. Lista surselor indică diferența dintre sursă manuală, colectare la cerere și ultima rulare programată. Un succes de acum câteva ore nu este etichetat drept funcționare continuă garantată.

`node scripts/worker.mjs --dry-run` verifică sursele și salvează rezultate/SQL în `/tmp`, fără secrete. Workerul fără `--dry-run` necesită `SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY` și salvează fiecare sursă prin RPC. Cheia nu ajunge în frontend. Eșecurile de persistare opresc jobul; eșecurile surselor sunt înregistrate și marchează jobul ca eșuat. Timeout 20s, corp maximum 2 MB, un retry numai la erori temporare de rețea/5xx; fără retry imediat la 403/429. Conținutul extern nu este evaluat ca JavaScript, SQL sau instrucțiuni.

Workflow: `.github/workflows/research.yml`, orar la minutul 17, cu execuții neconcurente, timeout 8 minute și permisiune GitHub doar `contents: read`. Acțiunile sunt fixate la commituri. Într-o instalare nouă, programarea este **oprită implicit**, până la configurarea secretului `SUPABASE_SERVICE_ROLE_KEY` și a variabilei `RESEARCH_ENABLED=true` în repository. Rularea manuală are implicit modul fără scriere. Secretul server are privilegii extinse în Supabase și transferul lui în GitHub necesită acordul explicit al proprietarului.

GitHub Actions oferă programare best-effort: joburile pot întârzia; feedurile au istoric limitat și pot pierde știri între execuții. Nu există încă notificări prin e-mail sau clasificare AI. Candidații rămân privați până la revizuire. Următorul pas este un panou privat de aprobare, apoi extragerea afirmațiilor și analiza financiară cu dovezi.

Actualizare documentată: `supabase/updates/20261110_anthropic_roadshow.sql` păstrează istoricul S-1 și adaugă comunicatul oficial de roadshow din 10 noiembrie. Nu atribuie o dată de debut.

## Germania, Austria și activarea workerului

Colectorii includ acum RSS-ul oficial Deutsche Börse și comunicatele Wiener Börse. Detectarea include termeni germani (Börsengang, Handelsstart, Erstnotiz); exclude anunțurile despre obligațiuni, certificate și ETF/ETP. Comunicatele de debut sunt doar candidați de verificat, nu listări viitoare. Pagina vieneză acoperă comunicatele recente, fără backfill complet. Feedurile pot omite evenimente, deci nu constituie o acoperire exhaustivă.

Dosare europene revizuite: KNDS (grup franco-german, intenție documentată, fără calendar confirmat) și Bitpanda (Austria, planul Frankfurt amânat conform presei din 15 septembrie). Filtrul „țară sau piață” folosește și `regions`, astfel încât o companie austriacă interesată de Frankfurt poate apărea în ambele filtre. Data originală și istoricul surselor rămân vizibile. JSON-urile din `supabase/updates/20261110_europe*.json` păstrează snapshotul de import, nu date actualizate automat.

Workerul acceptă cheia server modernă `sb_secret_...` în secretul GitHub numit `SUPABASE_SERVICE_ROLE_KEY` (numele este păstrat pentru compatibilitate). Pentru cheile moderne trimite `apikey`, fără a le trata ca JWT. Cheia este disponibilă doar pasului de persistare, nu instalării dependențelor, testelor, frontendului sau repository-ului. Erorile de transport sunt înlocuite cu un cod generic pentru a nu expune antete.

Migrarea `202611100003_agent_status.sql` separă starea configurării programului de dovada unei execuții: `agent_status.enabled` arată dacă programul este activat, iar `research_sources.last_attempt_at`/`checked_at` arată ultimele încercări/succese. Marcajul `last_trigger=schedule` este înregistrat numai când GitHub chiar pornește execuția programată. O rulare manuală de verificare nu este prezentată ca rulare cron.

Notificările citite sunt legate de versiunea semnalului (companie + data sursei + rezumat). O schimbare documentată reapare ca necitită. Trimiterea prin Resend și extragerea cu un model AI nu sunt încă activate.

## Descoperiri publice fără AI — milestone 3, prima etapă

Decizia proprietarului: fără API AI plătit și fără conturi de utilizator momentan. `/descoperiri` afișează până la 100 de documente din surse publice, fără a le prezenta drept IPO-uri confirmate. Migrarea `202611100004_public_discovery.sql` expune numai metadatele publice prin RPC `list_discoveries`; tabelele interne, hash-urile și istoricul rulărilor rămân private. Nu oferă scrieri anonime. Documentele respinse nu sunt afișate.

`src/lib/signals.mjs` clasifică prudent titlurile prin reguli românești, englezești și germane. Indiciile de amânare au prioritate; negațiile și contradicțiile rămân incerte. Nu extrage nume de companii sau date IPO și nu citește articolul integral. Rezultatul se calculează la afișare, fără apeluri către modele. Căutarea și filtrele sunt locale; dosarele publicate nu se modifică automat.

Pagina diferențiază data publicării, prima detectare și ultima observare în feed. O nouă observare nu reconfirmă stadiul companiei. Analiza financiară, citirea integrală și reconcilierea dosarelor nu sunt implementate. Următorii pași trebuie să păstreze constrângerea de zero servicii plătite; planurile gratuite ale infrastructurii au limite și nu promit capacitate nelimitată.

## Citirea articolelor fără AI

Workerul citește cel mult 4 documente pe execuție, după colectarea feedurilor. `scripts/documents.mjs` acceptă numai HTTPS, domenii și căi de articole explicit permise, fără porturi speciale, credențiale sau query strings. Redirecturile sunt refuzate. Sunt păstrate limitele de 20s și 2 MB; nu se execută JavaScript și nu se ocolesc pagini de autentificare sau blocaje.

Extragerea caută paragrafe relevante în containerele articolului, elimină navigarea/scripturile și salvează un singur fragment de maximum 20 de cuvinte, indicii prin reguli, data explicită din metadate și amprenta textului. Nu salvează articolul integral și nu produce o traducere sau o evaluare financiară. Indiciile pot aparține contextului istoric ori condițional, nu reprezintă confirmări ale stadiului curent. Pagini fără structură recunoscută produc erori explicite.

Migrarea `202611100005_document_evidence.sql` adaugă o coadă de citire și persistență accesibile numai workerului. Fragmentele și starea citirii sunt publicate prin `list_discoveries_enriched`; accesul direct la tabel rămâne privat. O schimbare de titlu invalidează afișarea fragmentului anterior. Reverificare după minimum 24h; HTTP 403/429 și URL-uri nepermise au pauză de 7 zile. Se prioritizează documentele necitite, apoi cele mai vechi încercări. Schimbările doar în corp pot fi detectate la reverificarea zilnică, fără publicarea automată a dosarelor.

Eșecurile de articol sunt afișate și marchează execuția ca nereușită; o colectare de feed reușită nu este dovadă că articolele au fost citite. Modul `--dry-run` verifică numai feedurile, fără modificări în baza de date. Nu au fost adăugate servicii AI, abonamente sau chei noi.

Verificare în producție: prima rulare programată observată și reușită, [42904410241](https://github.com/XyzDavidD/stockagentai/actions/runs/42904410241), a rulat versiunea cu citirea articolelor la 10 noiembrie 2026. Au fost salvate primele patru documente; programarea nu mai este doar configurată, ci verificată printr-o execuție cron reală.

## Dosare și semnale — grupare și comparație fără AI

`/dosare` grupează ultimele maximum 100 de descoperiri cu dosarele publicate, prin `src/lib/reconciliation.mjs`. Un URL deja citat în dosar stabilește asocierea; numele complet în titlu reprezintă numai o propunere. Numele scurte, potrivirile parțiale și sursele comune mai multor companii nu sunt folosite pentru a forța o identitate. Se deduplică fragmentele URL și parametrii `utm_`, păstrând parametrii cu semnificație.

Cronologia compară data publicării din feed/metadate cu data sursei curente a dosarului. Date contradictorii, necunoscute ori viitoare cer verificare. Articolele mai vechi nu regresează stadiul; cele din aceeași zi nu presupun o ordine intrazilnică. Un indiciu diferit într-un document mai recent este o propunere de verificare, nu o actualizare automată. URL-ul cunoscut nu dovedește că întregul conținut curent a fost revizuit.

Rezultatele sunt recalculate la încărcare; nu sunt un istoric persistent al schimbărilor și nu trimit alerte. Documentele fără asociere sunt vizibile separat. Pagina are căutare și filtrul „Doar de verificat”, iar dosarele fără descoperiri păstrează sursele manuale accesibile. Nu adaugă servicii, chei sau abonamente.

### Milestone-uri — situația curentă

1. Platforma și publicarea: finalizat.
2. Supabase și colectarea orară: finalizat pentru setul inițial de surse; acoperire parțială, SEC suspendat.
3. Cercetare fără AI: colectare, citirea articolelor, fragmente, grupare și comparație implementate. Mai rămân deciziile persistente de verificare/publicare și istoricul schimbărilor; accesul public este numai pentru citire.
4. Alerte: de implementat, cu deduplicarea schimbărilor și preferințe; Resend rămâne neconectat. Nu activa servicii plătite.

## Acoperire extinsă și proveniență

17 canale automate active și unul suspendat (EU-Startups) din extindere, plus SEC suspendat; 18 canale de descoperire configurate (nu 18 publicații independente): cele 6 inițiale, Stock Analysis depuneri/calendar, TechCrunch, EU-Startups, Sifted, Profit.ro și 6 căutări Google News pentru SUA, Regatul Unit, Germania, Austria, Franța și România (fereastră 90 zile, rezultate limitate de furnizor). Căutările regionale nu garantează că fiecare rezultat privește o companie din țara respectivă. Sursele cu zero rezultate nu indică absența IPO-urilor.

Stock Analysis este agregator neoficial; o depunere din listă nu dovedește că oferta mai este activă. Data depunerii sau data estimată din calendar nu sunt salvate ca dată a publicării. Rezultatele pot include SPAC-uri, oferte istorice și știri repetate. UI oferă etichete de proveniență, indicii speculative, filtru de posibile SPAC-uri, filtrarea sursei și afișare progresivă câte 25. Maximum 1000 de documente sunt citite pentru interfață; aceasta nu înseamnă 1000 companii distincte. Persistența acceptă maximum 500 candidați per sursă, cu aceeași deduplicare după URL. Căutările Google pot suprapune aceeași știre și păstrează numele editorului în titlul RSS.

Articolele integrale rămân limitate la colectorii cu extractori verificați. Noile agregatoare și fluxuri de presă sunt surse de descoperire și linkuri pentru verificare, nu sunt trimise în coada de citire incompatibilă. Niciun paywall sau blocaj nu este ocolit. Timpul maxim al workerului a fost ajustat la 15 minute pentru setul mai mare, fără concurență între rulări.

SEC a fost reevaluat la 10 noiembrie 2026: feedul EDGAR și `data.sec.gov/submissions` au răspuns HTTP 403. Rămâne suspendat; agregatoarele nu sunt prezentate ca acces direct SEC. Documentația oficială: https://www.sec.gov/search-filings/edgar-application-programming-interfaces .

`/startupuri` este separat de semnalele IPO: sincronizează zilnic selecția „Top companies” din https://yc-oss.github.io/api/companies/top.json (proiect comunitar neoficial, 91 profiluri la implementare). Nu este întregul director YC, nu este un scor de potențial și nu dovedește intenția de listare. Păstrează statusurile Active/Public/Acquired și linkurile către profilurile oficiale YC. Nu se importă date personale sau descrieri integrale. Nu sunt folosite servicii plătite.

Validare producție: prima extindere a salvat 897 documente distincte și 91 profiluri YC. EU-Startups a răspuns HTTP 403 din GitHub și a fost suspendat, deși accesul local funcționase. Căutarea britanică include explicit London/UK/Britain/LSE. UI permite alegerea publicației și sortarea după publicare, detectare sau titlu.

Rularea reală [42907186363](https://github.com/XyzDavidD/stockagentai/actions/runs/42907186363) a reușit pentru toate cele 17 canale active. Snapshot verificat: 960 documente distincte, 85 atribuite canalului britanic, 474 înregistrări din lista de depuneri și 91 profiluri YC (34 cu status Active). Sunt documente și profiluri de context, nu 960 IPO-uri confirmate. Depunerile din agregator pot fi vechi; UI sortează separat după data raportată în index și semnalează înregistrările mai vechi de 90 zile.

### Dashboard integrat

Pagina principală încarcă în paralel dosarele, radarul extins și directorul YC. Acoperirea geografică provine din sursele cu rulări înregistrate, iar filtrul Regatul Unit / Anglia este disponibil direct pe prima pagină. Meniul separă documentele descoperite, înregistrările despre companii/startupuri și dosarele verificate. Numărul documentelor (maximum 1000) și cel al înregistrărilor din surse nu reprezintă companii unice sau IPO-uri confirmate. Aria radarului indică sursa căutării, nu domiciliul emitentului.

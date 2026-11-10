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

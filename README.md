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
- Anthropic: comunicat oficial din 26 octombrie privind depunerea S-1; dată de listare neconfirmată.
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

Cheia **publishable** din configurație este destinată expunerii publice și nu poate scrie. Nu sunt folosite sau publicate parole, chei secret/service-role ori credențiale de administrare. Configurația poate fi înlocuită prin variabilele din `.env.example`.

Migrarea inițială este `supabase/migrations/202611100001_research.sql`; a fost aplicată în SQL Editor. Nu se reaplică peste aceleași politici. `supabase/seed.sql` importă setul inițial revizuit; nu îl rula peste cercetări mai noi, deoarece actualizează profilurile cu snapshotul inițial.

## Colectori SUA / România

```sh
npm run collect -- /tmp/stockagentai-import.sql
```

Colectorul execută câte o cerere la BVB și SEC, cu timeout și fără ocolirea blocajelor. Produce SQL pentru revizuire și import în SQL Editor. Această etapă nu cere chei privilegiate în mediul local sau Vercel.

- BVB: pagina ofertelor publice; exclude Ministerul Finanțelor/Fidelis, obligațiunile identificate explicit și răscumpărările. Celelalte oferte sunt **candidați**, nu IPO-uri confirmate.
- SEC: feed S-1; păstrează înregistrări S-1 și amendamente pentru revizuire. Un S-1 poate reprezenta ofertă secundară, nu se publică automat drept IPO. Feedul este limitat la cele mai recente 40 înregistrări, nu este backfill sau acoperire completă.
- Deduplicare după URL, amprentă SHA-256, revenire la revizuire dacă se schimbă conținutul. Ultima verificare reușită nu se modifică la eșec.
- Rularea din 10 noiembrie: BVB reușit, zero candidați după filtrare; SEC HTTP 403. Rezultatele sunt în Supabase. Acest rezultat nu înseamnă că România nu are intenții de IPO.

**Nu există încă programare 24/7.** Importul este la cerere, cu verificare umană. Nu sunt conectate Resend sau servicii AI. Activarea continuă necesită un worker, credențială limitată de ingestie, programare, respectarea limitelor surselor și monitorizarea erorilor.

## Următorii pași

3. Descoperire mai largă (anunțuri BVB/ASF, emitenți, presă), documente și afirmații normalizate, reconcilierea stadiilor, extragere AI cu dovezi și evaluare financiară separată de certitudinea listării.
4. Worker programat, retry cu backoff, observabilitate și alerte doar la schimbări; apoi Resend și acces privat dacă se adaugă note personale.

Referințele de design ale utilizatorului rămân în `ui-skills`. Datele din surse sunt conținut neîncrezător și nu pot executa instrucțiuni ori accesa secrete.

## Extindere: colectori și rulare orară

Migrarea `202611100002_automated_ingestion.sql` adaugă istoricul încercărilor, numărul de eșecuri consecutive, candidații în așteptare și RPC-ul atomic `record_ingestion`. Funcția este SECURITY INVOKER, executabilă numai de `service_role`; nu publică și nu modifică profiluri de companii. Rulările se deduplică după `(source_id, run_key)`, iar o execuție veche nu suprascrie starea uneia mai noi. Modificarea unui document trimite candidatul înapoi la revizuire.

Surse active în colector:
- Oferte BVB, filtrate de titluri de stat și obligațiuni identificate explicit.
- Comunicate BVB: posibile IPO-uri și evenimente de debut, pentru reconcilierea stadiilor; ETF-urile sunt excluse.
- Noutăți Anthropic: monitorizare de emitent, nu descoperire a tuturor companiilor SUA.
- Feedul financiar PR Newswire: indicii din comunicate distribuite, cu piața și tipul ofertei încă de verificat.

SEC este suspendat în configurație după HTTP 403; nu este reîncercat orar. Lista surselor indică diferența dintre sursă manuală, colectare la cerere și ultima rulare programată. Un succes de acum câteva ore nu este etichetat drept funcționare continuă garantată.

`node scripts/worker.mjs --dry-run` verifică sursele și salvează rezultate/SQL în `/tmp`, fără secrete. Workerul fără `--dry-run` necesită `SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY` și salvează fiecare sursă prin RPC. Cheia nu ajunge în frontend. Eșecurile de persistare opresc jobul; eșecurile surselor sunt înregistrate și marchează jobul ca eșuat. Timeout 20s, corp maximum 2 MB, un retry numai la erori temporare de rețea/5xx; fără retry imediat la 403/429. Conținutul extern nu este evaluat ca JavaScript, SQL sau instrucțiuni.

Workflow: `.github/workflows/research.yml`, orar la minutul 17, cu execuții neconcurente, timeout 8 minute și permisiune GitHub doar `contents: read`. Acțiunile sunt fixate la commituri. Programarea este **oprită implicit**, până la configurarea secretului `SUPABASE_SERVICE_ROLE_KEY` și a variabilei `RESEARCH_ENABLED=true` în repository. Rularea manuală are implicit modul fără scriere. Secretul server are privilegii extinse în Supabase și transferul lui în GitHub necesită acordul explicit al proprietarului.

GitHub Actions oferă programare best-effort: joburile pot întârzia; feedurile au istoric limitat și pot pierde știri între execuții. Nu există încă notificări prin e-mail sau clasificare AI. Candidații rămân privați până la revizuire. Următorul pas este un panou privat de aprobare, apoi extragerea afirmațiilor și analiza financiară cu dovezi.

Actualizare documentată: `supabase/updates/20261110_anthropic_roadshow.sql` păstrează istoricul S-1 și adaugă comunicatul oficial de roadshow din 10 noiembrie. Nu atribuie o dată de debut.

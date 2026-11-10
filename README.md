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

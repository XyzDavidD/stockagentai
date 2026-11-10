# stockagentai

Dashboard de cercetare pre-IPO, în română. Milestone 1: prototip public interactiv cu date fictive.

## Pornire

Node.js 20.9+ și npm.

```sh
npm install
npm run dev
```

Deschide http://127.0.0.1:3000. Pentru verificare: `npm run typecheck` și `npm run build`.

## Ce funcționează

- Privire de ansamblu, căutare, filtre combinate și sortare.
- Dosar de companie în panou accesibil (focus controlat, Escape, revenire la context).
- Listă de urmărire persistentă în localStorage.
- Calendar navigabil, perioade cunoscute și orizonturi neconfirmate.
- Notificări demonstrative, citit/necitit și preferințe persistente.
- Registru de surse propuse și prezentarea fluxului de cercetare.
- Layout adaptiv pentru desktop și mobil; suport reduced-motion.
- Meniu lateral retractabil cu preferință persistentă și notificări într-un singur loc.
- Text de minimum 12px pentru conținutul obișnuit și contrast întărit.

## Limitele prototipului

Toate cele șase companii, scorurile și evenimentele sunt fictive. Snapshotul este fixat la 10 noiembrie 2026. Sursele externe din registru sunt reale, dar nu sunt conectate; nu reprezintă dovezi pentru companiile demo. Nu există colectare live, autentificare, bază de date sau trimitere de e-mailuri. Prototipul public nu are barieră de autentificare. Serverul de dezvoltare ascultă doar local.

Nu introduce date sensibile în prototip. Datele locale nu se sincronizează între dispozitive.

## Structură

- `src/app`: shell Next.js, metadata, stiluri și pagina principală.
- `src/components/dashboard.tsx`: navigare și interacțiuni demonstrative.
- `src/lib/data.ts`: tipurile de domeniu, companiile fictive și registrul surselor.
- `ui-skills`: referințele de design furnizate de utilizator, păstrate integral.

## Etapele următoare

2. Supabase/PostgreSQL, acces privat, migrații și colectori oficiali SUA/România.
3. Descoperire multilingvă, extragere AI cu dovezi, Germania/Austria și evaluare pe date istorice.
4. Operare continuă, alerte, observabilitate, pilot de 14 zile și ulterior Resend.

Modelul persistent va separa companies, listing_events, sources, documents, claims, evidence, analyses, watchlists, alerts și job_runs. Se vor păstra published_at, detected_at și verified_at separat. Joburile trebuie să fie idempotente și să suporte retry cu backoff, deduplicare, limite pe sursă, buget zilnic și revizuirea contradicțiilor. Conținutul colectat este neîncrezător și nu poate executa instrucțiuni sau accesa secrete.

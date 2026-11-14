"use client";
import ActivityLog from '@/components/research-activity';
import {companyList,newestCompanyFirst} from '@/lib/company-list.mjs';
import type {ResearchActivity,ResearchEvent} from '@/lib/data';
import EarlyRadar from '@/components/early-radar';
import CompanyDrawer from './company-drawer';
import {enrichCompany} from '@/lib/company-detail';
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bookmark,
  Radio,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Bell,
  Plus,
  X,
  Check,
  Globe2,
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  ExternalLink,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Activity,
  Mail,
  CheckCheck,
} from "lucide-react";
import { type Company, type Source, type Scheduler } from "@/lib/data";



import type {Discovery,StartupProfile} from "@/lib/data";
import {useRouter} from 'next/navigation';
import {platformRoutes,type View} from '@/lib/platform-routes';

import {relatedSources} from '@/lib/dossiers.mjs';
import {safeEvidenceUrl} from '@/lib/signals.mjs';


const navigation = [
  { id: "overview", label: "Privire de ansamblu", icon: LayoutDashboard },
  { id: "universe", label: "Companii", icon: Building2 },
  { id: "early", label: "Radar timpuriu", icon: Radio },
  { id: "calendar", label: "Calendar IPO", icon: CalendarDays },
  { id: "watchlist", label: "Lista mea", icon: Bookmark },
  { id: "research", label: "Centrul de cercetare", icon: Radio },
] as const;
const titles: Record<View, string> = {
  early: "Radar timpuriu",
  overview: "Privire de ansamblu",
  discoveries: "Companii · descoperiri și dosare",
  universe: "Companii cu planuri de listare",
  companies: "Companii",
  startups:"Companii cu planuri de listare",
  dossiers:"Dosare și semnale",
  calendar: "Calendarul listărilor",
  watchlist: "Companiile pe care le urmărești",
  research: "În spatele fiecărui semnal",
  alerts: "Centrul de notificări",
  settings: "Preferințele tale",
};
function Logo({
  company,
  small = false,
}: {
  company: Company;
  small?: boolean;
}) {
  return (
    <span className={`company-logo ${company.color} ${small ? "small" : ""}`}>
      {company.monogram}
    </span>
  );
}
function Badge({ stage }: { stage: string }) {
  return (
    <span
      className={`badge ${stage === "Documente depuse" ? "green" : stage === "Ofertă programată" ? "blue-badge" : stage === "Semnal preliminar" ? "gray" : "amber"}`}
    >
      <span />
      {stage}
    </span>
  );
}
export default function Dashboard({ detected, activity, companies: allCompanies, sources, error, scheduler, discoveries, discoveryError, startups, startupError, initialView="overview", evaluatedAt }: {detected:ResearchEvent[];activity:ResearchActivity|null;initialView?:View;evaluatedAt:string;discoveries:Discovery[];discoveryError:string|null;startups:{profile:StartupProfile;checked_at:string}[];startupError:string|null; companies: Company[]; sources: Source[]; error: string | null; scheduler: Scheduler | null }) {
  const coverage = [...new Set(sources.filter(s=>s.last_attempt_at&&s.checked_at&&!s.status.startsWith('Suspendat')).map(s=>s.area))].filter(a=>['SUA','România','Germania','Austria','Regatul Unit','Franța'].includes(a));
  const regionCodes:Record<string,string>={'SUA':'SUA','România':'RO','Germania':'DE','Austria':'AT','Regatul Unit':'UK','Franța':'FR'};
  const router=useRouter();
  const associated=useMemo(()=>relatedSources(discoveries.filter(d=>!d.source_name.startsWith('Radar timpuriu ·')&&!d.source_name.startsWith('Radar focalizat ·')),allCompanies),[discoveries,allCompanies]);
  const [archive, setArchive] = useState(false);
  const listedCompanies=useMemo(()=>companyList(allCompanies,detected).map(enrichCompany),[allCompanies,detected]);
  const openCompany=useCallback((c:Company)=>setSelected(enrichCompany(c)),[]);
  const companies = allCompanies.filter(c => c.stage !== "Listată");
  const formatDate = (value: string) => !value||!Number.isFinite(Date.parse(value))?"Dată neprecizată":new Intl.DateTimeFormat("ro-RO", {dateStyle: "medium", timeZone: "Europe/Bucharest"}).format(new Date(value));
  const stale = (c: Company) => Date.now() - new Date(c.publishedAt).getTime() > 90 * 86400000;
  const pendingTotal = sources.reduce((sum, source) => sum + (source.pending_count || 0), 0);
  const timestamp = (value: string) => new Intl.DateTimeFormat("ro-RO", {dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest"}).format(new Date(value));
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState<View>(initialView);
  useEffect(()=>setView(initialView),[initialView]);
  const [focusOnly,setFocusOnly]=useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Toate țările");
  const [stage, setStage] = useState("Toate stadiile");
  const [sort, setSort] = useState("newest");
  const [watch, setWatch] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  useEffect(()=>{const key=new URL(window.location.href).searchParams.get('companie');const found=listedCompanies.find(c=>c.id===key||c.signalId===key);if(found)setSelected(found);},[listedCompanies]);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  useEffect(() => {
    try {
      const w = JSON.parse(
        localStorage.getItem("stockagentai-watch") || "null",
      );
      if (Array.isArray(w))
        setWatch(
          w.filter(
            (id: unknown) =>
              typeof id === "string",
          ),
        );
      const r = JSON.parse(localStorage.getItem("stockagentai-read") || "[]");
      if (Array.isArray(r))
        setRead(r.filter((v: unknown) => typeof v === "string"));
      setOnlyOfficial(localStorage.getItem("stockagentai-official") === "true");
      setCollapsed(
        localStorage.getItem("stockagentai-sidebar") === "collapsed",
      );
    } catch {
      setNotice(
        "Preferințele locale nu au putut fi încărcate. Poți continua fără salvarea preferințelor.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "stockagentai-sidebar",
          collapsed ? "collapsed" : "expanded",
        );
        localStorage.setItem("stockagentai-watch", JSON.stringify(watch));
        localStorage.setItem("stockagentai-read", JSON.stringify(read));
        localStorage.setItem("stockagentai-official", String(onlyOfficial));
      } catch {
        setNotice("Browserul nu permite salvarea locală a preferințelor.");
      }
  }, [watch, read, ready, onlyOfficial, collapsed]);
  const toggle = (id: string) =>
    setWatch((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const navigate = (v: View) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setView(v);
    router.push(platformRoutes[v]);
    setArchive(false);
    setMobile(false);
    setQuery("");
    setCountry("Toate țările");
    setStage("Toate stadiile");
  };
  useEffect(() => {
    if (!mobile) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobile(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobile]);
  const filtered = useMemo(
    () =>
      (archive ? listedCompanies.filter(c => c.stage === "Listată") : listedCompanies.filter(c => view === "watchlist" || c.stage !== "Listată"))
        .filter(
          (c) =>
            (view !== "watchlist" || watch.includes(c.id)) && (!focusOnly||c.context?.focus===true||!!c.signalId) &&
            `${c.name} ${c.sector} ${c.country}`
              .toLocaleLowerCase("ro")
              .includes(query.toLocaleLowerCase("ro")) &&
            (country === "Toate țările" || country === c.country || c.regions?.includes(country)) &&
            (stage === "Toate stadiile" || stage === c.stage),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : newestCompanyFirst(a,b),
        ),
    [view, watch, query, country, stage, sort, archive, listedCompanies,focusOnly],
  );
  const alerts = companies
    .filter((c) => !onlyOfficial || c.official);
  const alertKey = (c: Company) => `${c.id}:${c.publishedAt}:${c.signal}`;
  const unread = alerts.filter((c) => !read.includes(alertKey(c))).length;
  const table = (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <h2>
            {view === "watchlist" ? "Lista de urmărire" : archive ? "Arhiva listărilor" : "Companii · descoperiri și dosare"}{" "}
            <span className="count">{filtered.length}</span>
          </h2>

        </div>
        {view === "overview" && (
          <button className="text-button" onClick={() => navigate("universe")}>
            Vezi toate <ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="filters"><label className="focus-filter"><input type="checkbox" checked={focusOnly} onChange={e=>setFocusOnly(e.target.checked)}/> AI · apărare · software</label>
        <button hidden={view === "watchlist"} className="secondary" aria-pressed={archive} onClick={() => setArchive(v => !v)}>{archive ? "Arhivă · vezi radarul" : "Vezi listările încheiate"}</button>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Caută companii"
            placeholder="Caută o companie sau un sector…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>⌕</kbd>
        </label>
        <label className="select-field">
          <Globe2 size={14} />
          <select
            aria-label="Filtrează după țară sau piață"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {["Toate țările", ...new Set(listedCompanies.flatMap(c=>c.regions||[c.country]))].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
        <label className="select-field">
          <SlidersHorizontal size={14} />
          <select
            aria-label="Filtrează după stadiu"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {[
              "Toate stadiile",
              "Calendar estimativ",
              "Posibilă amânare",
              "Documente depuse",
              "Roadshow lansat",
              "Amânată",
              "Intenție anunțată",
              "Semnal preliminar",
              "Ofertă programată",
              "Listată",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="sort-field">
          <ArrowDownWideNarrow size={16} />
          <select
            aria-label="Sortează companiile"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Cele mai noi descoperiri</option>
            <option value="name">Nume A–Z</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>COMPANIE</th>
              <th>PIAȚĂ VIZATĂ</th>
              <th>STADIUL LISTĂRII</th>
              <th>
                DOVEZI <Info size={12} />
              </th>
              <th>ORIZONT RELATAT</th>
              <th>
                <span className="sr-only">Urmărește</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="clickable-company" onClick={e=>{if(!(e.target as HTMLElement).closest("button,a,input"))openCompany(c);}}>
                <td>
                  <button
                    className="company-cell"
                    onClick={() => openCompany(c)}
                  >
                    <Logo company={c} />
                    <span>
                      <strong>{c.name}</strong>
                      <small>{c.sector}{c.context?.focus?" · Prioritar":""}</small><small>{c.discoveredAt?`Descoperită: ${timestamp(c.discoveredAt)}`:`Dosar verificat: ${formatDate(c.checkedAt)}`}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <span className="market">
                    {c.flag} {c.exchange}
                  </span>
                  <small>{c.country}</small>
                </td>
                <td>
                  <Badge stage={c.stage} />
                </td>
                <td>
                  <span className="confidence">{c.sourceLabel||(c.official ? "Oficială" : "Presă")}{stale(c) && <small>Necesită reconfirmare</small>}</span>
                </td>
                <td className="horizon">{c.dateLabel}</td>
                <td>
                  <button
                    className={`icon-button bookmark ${watch.includes(c.id) ? "saved" : ""}`}
                    aria-label={`${watch.includes(c.id) ? "Elimină" : "Urmărește"} ${c.name}`}
                    aria-pressed={watch.includes(c.id)}
                    onClick={() => toggle(c.id)}
                  >
                    <Bookmark size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="empty">
          <Search />
          <h3>
            {view === "watchlist" && !watch.length
              ? "Prima companie, primul pas."
              : "Nicio companie găsită"}
          </h3>
          <p>
            {view === "watchlist" && !watch.length
              ? "Salvează o companie de pe radar pentru a o regăsi aici."
              : "Încearcă un alt nume sau elimină filtrele."}
          </p>
          <button
            className="secondary"
            onClick={() => {
              if (view === "watchlist" && !watch.length) navigate("universe");
              else {
                setQuery("");
                setCountry("Toate țările");
                setStage("Toate stadiile");
              }
            }}
          >
            Explorează companiile
          </button>
        </div>
      )}
      <div className="table-footer">
        <span>
          {filtered.length} {filtered.length === 1 ? "companie" : "companii"} ·
          companii · dosare și semnale automate etichetate separat
        </span>
        <span>Stadiul documentelor nu indică randamentul investiției.</span>
      </div>
    </section>
  );
  return (
    <div lang="ro" className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Sari la conținut
      </a>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Închide navigarea"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <button
          className="brand"
          onClick={() => navigate("overview")}
          aria-label="stockagentai — pagina principală"
        >
          <span className="brand-mark">
            <Activity size={22} />
          </span>
          <span className="brand-wordmark">
            stockagent<span className="brand-ai">ai</span>
            <span className="brand-dot" />
          </span>
        </button>
        <div className="workspace">
          <span className="workspace-icon">D</span>
          <div>
            <strong>Spațiul meu de cercetare</strong>
            <small>{coverage.map(a=>regionCodes[a]).join(" · ")||"Acoperire indisponibilă"}</small>
          </div>
          <span className="workspace-lock">
            <ShieldCheck size={15} />
          </span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map((n) => (
            <button
              key={n.id}
              aria-label={n.label}
              title={n.label}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={18} />
              <span className="nav-text">{n.label}</span>
              {n.id === "watchlist" && (
                <span className="nav-count">{allCompanies.filter(r=>watch.includes(r.id)).length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-separator" />
        <button
          className={`nav-item ${view === "alerts" ? "active" : ""}`}
          onClick={() => navigate("alerts")}
          aria-label={`Notificări: ${unread} necitite`}
          title="Notificări"
        >
          <Bell size={18} />
          <span className="nav-text">Notificări</span>
          {unread > 0 && <span className="notification-count">{unread}</span>}
        </button>
        <button
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          onClick={() => navigate("settings")}
          aria-label="Preferințe"
          title="Preferințe"
        >
          <Settings2 size={18} />
          <span className="nav-text">Preferințe</span>
        </button>
        <div className="sidebar-bottom">
          <div className="agent-card">
            <div>
              <span className="status-dot" />
              CERCETARE DOCUMENTATĂ
            </div>
            <strong>Un pas înaintea pieței.</strong>
            <p>
              Dosare revizuite și semnale automate, etichetate separat.
            </p>
            <button onClick={() => navigate("research")}>
              Descoperă infrastructura <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <span className="avatar">D</span>
            <div>
              <strong>Cont local</strong>
              <small>Preferințe în browser</small>
            </div>
            <button
              className="icon-button sidebar-collapse"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={
                collapsed ? "Extinde bara laterală" : "Restrânge bara laterală"
              }
              aria-expanded={!collapsed}
              aria-controls="workspace-navigation"
              title={collapsed ? "Extinde meniul" : "Restrânge meniul"}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <button
              className="icon-button mobile-close"
              aria-label="Închide meniul"
              onClick={() => setMobile(false)}
            >
              <X size={19} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button desktop-toggle"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={
                collapsed
                  ? "Afișează meniul lateral"
                  : "Restrânge meniul lateral"
              }
              aria-expanded={!collapsed}
              aria-controls="workspace-navigation"
              title="Comută meniul lateral"
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Deschide navigarea"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "overview"
                ? "Privire de ansamblu"
                : navigation.find((n) => n.id === view)?.label || titles[view]}
            </strong>
          </div>
          <div className="top-actions">
            <span className="demo-pill">
              <span />
              Date publice
            </span>
            <span className="avatar small-avatar">D</span>
          </div>
        </header>
        <main id="main">
          {!['overview','discoveries','universe','companies','watchlist','startups','dossiers'].includes(view) && <div className="page-heading"><h1>{titles[view]}</h1></div>}

          {error && <div role="alert" className="notice">{error}</div>}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button
                aria-label="Închide mesajul"
                className="icon-button"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {['overview','discoveries','universe','companies','watchlist','startups','dossiers'].includes(view) && table}
          {view === "early" && <EarlyRadar items={discoveries} sources={sources} error={discoveryError} evaluatedAt={evaluatedAt} onOpenCompany={openCompany}/>}
          {view === "calendar" && (
            <section className="table-panel calendar-panel">
              <div className="section-heading">
                <div>
                  <h2>
                    {new Intl.DateTimeFormat("ro-RO", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(currentYear, month, 1))}
                  </h2>
                  <p>
                    Doar date confirmate de subscriere. Nicio dată estimată nu este introdusă automat.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="icon-button"
                    aria-label="Luna anterioară"
                    onClick={() => setMonth((m) => m - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button className="secondary" onClick={() => setMonth(new Date().getMonth())}>
                    Luna curentă
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Luna următoare"
                    onClick={() => setMonth((m) => m + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {["LUN", "MAR", "MIE", "JOI", "VIN", "SÂM", "DUM"].map((d) => (
                  <div className="weekday" key={d}>
                    {d}
                  </div>
                ))}
                {Array.from(
                  { length: (new Date(currentYear, month, 1).getDay() + 6) % 7 },
                  (_, i) => (
                    <div className="calendar-day muted-day" key={`blank${i}`} />
                  ),
                )}
                {Array.from(
                  { length: new Date(currentYear, month + 1, 0).getDate() },
                  (_, i) => {
                    const date = new Date(currentYear, month, i + 1);
                    const event = companies.find(
                      (c) =>
                        c.date ===
                        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
                    );
                    return (
                      <div
                        className={`calendar-day ${month === new Date().getMonth() && i + 1 === new Date().getDate() ? "today" : ""}`}
                        key={i}
                      >
                        <span>{i + 1}</span>
                        {event && (
                          <button onClick={() => setSelected(event)}>
                            <span>SUBSCRIERE</span>
                            {event.name}
                            <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
              <div className="calendar-unscheduled"><h3>Orizonturi estimate · deschide analiza</h3><p>Aceste estimări sunt separate de datele confirmate de subscriere.</p>{companies.filter(c=>c.dateLabel.includes('estimare')).map(c=><button key={c.id} onClick={()=>setSelected(c)}><Logo company={c} small/><strong>{c.name}</strong><span>{c.dateLabel}</span><ArrowUpRight size={15}/></button>)}</div>
              <div className="calendar-unscheduled">
                <h3>Orizont neconfirmat</h3>
                {companies
                  .filter((c) => !c.date&&!c.dateLabel.includes("estimare"))
                  .map((c) => (
                    <button key={c.id} onClick={() => openCompany(c)}>
                      <Logo company={c} small />
                      <strong>{c.name}</strong>
                      <span>{c.dateLabel}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
              </div>
            </section>
          )}
          {view === "research" && (
            <>
              <ActivityLog activity={activity}/>
              <div className="research-intro">
                <Radio size={26} />
                <div>
                  <h2>Supabase · registrul de cercetare</h2>
                  <p>
                    {pendingTotal} documente așteaptă verificarea. {scheduler?.enabled ? `Colectarea este programată la fiecare ${scheduler.cadence_minutes} minute. Verifică mai jos ultima execuție reușită; programarea poate avea întârzieri.` : "Programarea automată este oprită."} SEC rămâne suspendat după refuzul accesului.
                  </p>
                </div>
                <span className="badge gray">
                  <span />
                  {scheduler?.enabled ? "Programare activă" : "Programare oprită"}
                </span>
              </div>
              <p className="notice">{discoveries.length} documente colectate în fundal. {companies.length} companii au dosare publicate. Documentele noi nu devin automat companii sau stadii confirmate.</p>
              <a className="research-discovery-link" href="/companii">Deschide dosarele companiilor <ExternalLink size={16} /></a>
              <section className="table-panel">
                <div className="section-heading">
                  <h2>Registrul surselor</h2>
                  <span className="count">{sources.length} surse</span>
                </div>
                {sources.map((s) => (
                  <div className="source-row" key={s.name}>
                    <span className="source-icon">
                      <Globe2 size={20} />
                    </span>
                    <div>
                      <strong>{s.name}</strong>
                      <small>
                        {s.area} · {s.kind}<br />{s.detail}{!!s.consecutive_failures && <><br />{s.consecutive_failures} eșecuri consecutive</>}
                      </small>
                    </div>
                    <span className="source-frequency">
                      {s.checked_at ? <>Ultimul succes<br />{timestamp(s.checked_at)}</> : "Fără colectare reușită"}
                      {s.last_attempt_at && <small>Ultima încercare: {timestamp(s.last_attempt_at)}<br />{s.last_trigger === "schedule" ? "Programată" : "La cerere"}{scheduler?.enabled && Date.now() - new Date(s.last_attempt_at).getTime() > 2 * 3600000 ? " · Întârziere peste 2h" : ""}</small>}
                    </span>
                    <span className="badge gray">
                      <span />
                      {s.status}
                    </span>
                    <a
                      className="icon-button"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Deschide ${s.name}`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </section>
              <div className="pipeline">
                {[
                  "Colectare",
                  "Deduplicare",
                  "Extragerea dovezilor",
                  "Verificare",
                  "Rezumat & alertă",
                ].map((s, i) => (
                  <div key={s}>
                    <span>0{i + 1}</span>
                    <h3>{s}</h3>
                    <p>
                      {
                        [
                          "API, RSS și pagini publice permise.",
                          "O singură origine pentru știrile republicate.",
                          "Fiecare afirmație este legată de un document.",
                          "Separăm certitudinile de presupuneri.",
                          "Context în română, doar la schimbări relevante.",
                        ][i]
                      }
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
          {view === "alerts" && (
            <section className="table-panel">
              <div className="section-heading">
                <div>
                  <h2>Schimbări care merită atenția ta</h2>
                  <p>{unread} dosare necitite · un rezumat în română pentru fiecare companie</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setRead(r=>Array.from(new Set([...r,...alerts.map(alertKey)])))}
                >
                  <CheckCheck size={16} />
                  Marchează citite
                </button>
              </div>
              {alerts.map((c) => (
                <div
                  className={`alert-row ${!read.includes(alertKey(c)) ? "unread" : ""}`}
                  key={c.id}
                >
                  <Logo company={c} />
                  <button
                    className="alert-content"
                    onClick={() => {
                      setSelected(c);
                      setRead((r) => Array.from(new Set([...r, alertKey(c)])));
                    }}
                  >
                    <strong>
                      {c.name}
                      <Badge stage={c.stage} />
                    </strong>
                    <p>{c.signal}</p>
                    <small>{formatDate(c.publishedAt)} · {c.sourceName}</small>
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Marchează ${c.name} ${read.includes(alertKey(c)) ? "necitit" : "citit"}`}
                    onClick={() =>
                      setRead((r) =>
                        r.includes(alertKey(c))
                          ? r.filter((x) => x !== alertKey(c))
                          : [...r, alertKey(c)],
                      )
                    }
                  >
                    {read.includes(alertKey(c)) ? (
                      <Check size={17} />
                    ) : (
                      <span className="unread-dot" />
                    )}
                  </button>
                </div>
              ))}
            </section>
          )}
          {view === "settings" && (
            <section className="table-panel settings-panel">
              <div className="section-heading">
                <div>
                  <h2>Un flux adaptat intereselor tale</h2>
                  <p>Preferințele sunt salvate doar în acest browser.</p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Doar semnale cu dovezi solide</strong>
                  <p>
                    În notificări, afișează doar dosarele a căror sursă principală este oficială.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={onlyOfficial}
                  aria-label="Doar semnale cu dovezi solide"
                  className={`switch ${onlyOfficial ? "on" : ""}`}
                  onClick={() => setOnlyOfficial((v) => !v)}
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Notificări prin e-mail</strong>
                  <p>Resend va fi conectat într-o etapă ulterioară.</p>
                </div>
                <span className="badge gray">
                  <Mail size={13} />
                  Neconectat
                </span>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Limba platformei</strong>
                  <p>Dosarele și interfața sunt în română. Documentele originale se deschid prin link extern.</p>
                </div>
                <span>Română 🇷🇴</span>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Date reale · Supabase</strong>
                  <p>
                    Date publice colectate automat și dosare revizuite separat. Lista nu acoperă toate IPO-urile. Starea colectării apare în Centrul de cercetare.
                  </p>
                </div>
                <span className="badge green">
                  <span />
                  Activ
                </span>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              stockagentai <span className="footer-slash">/</span> Perspectivă,
              înainte de oportunitate.
            </span>
            <span>Surse publice · Verificare manuală · Fără recomandări de investiții</span>
          </footer>
        </main>
      </div>
      <CompanyDrawer selected={selected} onClose={()=>setSelected(null)} watch={watch} toggle={toggle} associated={associated} evaluatedAt={evaluatedAt}/>
    </div>
  );
}

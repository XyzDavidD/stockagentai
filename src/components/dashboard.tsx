"use client";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
import Discoveries from "@/components/discoveries";
import RadarOverview from "@/components/radar-overview";
import CompanyUniverse from "@/components/company-universe";
import type {Discovery,StartupProfile} from "@/lib/data";
import {useRouter} from 'next/navigation';
import {platformRoutes,type View} from '@/lib/platform-routes';
import {companyUniverse,estimatedCalendar,discoveryKey} from '@/lib/universe.mjs';
import {sourceCategory} from '@/lib/provenance.mjs';
import {safeEvidenceUrl} from '@/lib/signals.mjs';
import CompanyResearch from '@/components/company-research';
import StartupDirectory from '@/components/startup-directory';
const navigation = [
  { id: "overview", label: "Privire de ansamblu", icon: LayoutDashboard },
  { id: "discoveries", label: "Radar IPO · toate sursele", icon: Globe2 },
  { id: "universe", label: "Companii și startupuri", icon: Building2 },
  { id: "companies", label: "Dosare verificate", icon: ShieldCheck },
  { id: "calendar", label: "Calendar IPO", icon: CalendarDays },
  { id: "watchlist", label: "Lista mea", icon: Bookmark },
  { id: "research", label: "Centrul de cercetare", icon: Radio },
] as const;
const titles: Record<View, string> = {
  overview: "Privire de ansamblu",
  discoveries: "Radar IPO extins",
  universe: "Companii și startupuri",
  companies: "Dosare verificate",
  startups:"Registru YC",
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
export default function Dashboard({ companies: allCompanies, sources, error, scheduler, discoveries, discoveryError, startups, startupError, initialView="overview", evaluatedAt }: {initialView?:View;evaluatedAt:string;discoveries:Discovery[];discoveryError:string|null;startups:{profile:StartupProfile;checked_at:string}[];startupError:string|null; companies: Company[]; sources: Source[]; error: string | null; scheduler: Scheduler | null }) {
  const coverage = [...new Set(sources.filter(s=>s.last_attempt_at&&s.checked_at&&!s.status.startsWith('Suspendat')).map(s=>s.area))].filter(a=>['SUA','România','Germania','Austria','Regatul Unit','Franța'].includes(a));
  const regionCodes:Record<string,string>={'SUA':'SUA','România':'RO','Germania':'DE','Austria':'AT','Regatul Unit':'UK','Franța':'FR'};
  const router=useRouter();
  const universe=useMemo(()=>companyUniverse(allCompanies,discoveries,startups),[allCompanies,discoveries,startups]);
  const estimated=useMemo(()=>estimatedCalendar(discoveries),[discoveries]);
  const [alertLimit,setAlertLimit]=useState(25);
  const [archive, setArchive] = useState(false);
  const companies = allCompanies.filter(c => c.stage !== "Listată");
  const formatDate = (value: string) => new Intl.DateTimeFormat("ro-RO", {dateStyle: "medium", timeZone: "Europe/Bucharest"}).format(new Date(value));
  const stale = (c: Company) => Date.now() - new Date(c.publishedAt).getTime() > 90 * 86400000;
  const pendingTotal = sources.reduce((sum, source) => sum + (source.pending_count || 0), 0);
  const timestamp = (value: string) => new Intl.DateTimeFormat("ro-RO", {dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest"}).format(new Date(value));
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState<View>(initialView);
  useEffect(()=>setView(initialView),[initialView]);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Toate țările");
  const [stage, setStage] = useState("Toate stadiile");
  const [sort, setSort] = useState("priority");
  const [watch, setWatch] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
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
      (view === "watchlist" ? allCompanies : archive ? allCompanies.filter(c => c.stage === "Listată") : companies)
        .filter(
          (c) =>
            (view !== "watchlist" || watch.includes(c.id)) &&
            `${c.name} ${c.sector} ${c.country}`
              .toLocaleLowerCase("ro")
              .includes(query.toLocaleLowerCase("ro")) &&
            (country === "Toate țările" || country === c.country || c.regions?.includes(country)) &&
            (stage === "Toate stadiile" || stage === c.stage),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : b.publishedAt.localeCompare(a.publishedAt),
        ),
    [view, watch, query, country, stage, sort, archive, allCompanies],
  );
  const alerts = companies
    .filter((c) => !onlyOfficial || c.official);
  const alertKey = (c: Company) => `${c.id}:${c.publishedAt}:${c.signal}`;
  const documentAlerts=useMemo(()=>discoveries.filter(i=>!onlyOfficial||sourceCategory(i.source_kind).startsWith('Oficială')).sort((a,b)=>b.discovered_at.localeCompare(a.discovered_at)),[discoveries,onlyOfficial]);
  const unread = alerts.filter((c) => !read.includes(alertKey(c))).length+documentAlerts.filter(i=>!read.includes(discoveryKey(i))).length;
  const table = (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <h2>
            {view === "watchlist" ? "Lista de urmărire" : archive ? "Arhiva listărilor" : "Dosare verificate pe radar"}{" "}
            <span className="count">{filtered.length}</span>
          </h2>
          <p>De la primul semnal, până la prima zi de tranzacționare.</p>
        </div>
        {view === "overview" && (
          <button className="text-button" onClick={() => navigate("companies")}>
            Vezi toate <ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="filters">
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
            {["Toate țările", "SUA", "România", "Germania", "Austria", "Franța"].map(
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
            <option value="priority">Sursa cea mai recentă</option>
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
              <th>ORIZONT</th>
              <th>
                <span className="sr-only">Urmărește</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <button
                    className="company-cell"
                    onClick={() => setSelected(c)}
                  >
                    <Logo company={c} />
                    <span>
                      <strong>{c.name}</strong>
                      <small>{c.sector}</small>
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
                  <span className="confidence">{c.official ? "Oficiale" : "Presă"}{stale(c) && <small>Necesită reconfirmare</small>}</span>
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
              if (view === "watchlist" && !watch.length) navigate("companies");
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
          date din Supabase
        </span>
        <span>Stadiul documentelor nu indică randamentul investiției.</span>
      </div>
    </section>
  );
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
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
                <span className="nav-count">{universe.filter(r=>watch.includes(r.id)).length}</span>
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
              Colectori conectați. Semnalele sunt revizuite înainte de publicare.
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
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                INTELIGENȚĂ PENTRU URMĂTOAREA OPORTUNITATE
              </div>
              <h1>
                {titles[view]}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {view === "overview"
                  ? "Radar extins, surse etichetate și dosare verificate separat."
                  : view === "research"
                    ? "Transparență asupra surselor și a modului în care vor fi analizate."
                    : "Informația potrivită, cu dovezile și contextul la îndemână."}
              </p>
            </div>
            <div className="date-label">
              <CalendarDays size={15} />
              {formatDate(new Date().toISOString())}<span>Surse datate individual</span>
            </div>
          </div>

          <nav className="platform-links" aria-label="Secțiuni de cercetare"><a href="/companii">Companii</a><a href="/descoperiri">Radar extins</a><a href="/startupuri">Registru YC</a><a href="/dosare">Dosare și semnale</a><button onClick={()=>router.refresh()}>Actualizează datele</button></nav>
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
          {view === "overview" && (
            <>
              <div className="metrics">
                {[
                  {label:"Documente în radar",value:discoveryError?"—":discoveries.length,sub:"Rezultate disponibile · maximum 1000",icon:Radio},
                  {label:"Piețe monitorizate",value:error?"—":coverage.length,sub:coverage.join(" · "),icon:Globe2},
                  {label:"Startupuri YC active",value:startupError?"—":startups.filter(r=>r.profile.status==='Active').length,sub:"Profiluri de context · IPO neconfirmat",icon:Building2},
                  {label:"Dosare verificate active",value:error?"—":companies.length,sub:"Stadii revizuite · nu toate descoperirile",icon:ShieldCheck},
                ].map((m, i) => (
                  <button
                    className="metric"
                    key={m.label}
                    onClick={() => {
                      navigate(i===0?"discoveries":i===1?"research":i===2?"universe":"companies");
                    }}
                  >
                    <div>
                      {m.label}
                      <m.icon size={17} />
                    </div>
                    <strong>{String(m.value).padStart(2, "0")}</strong>
                    <span>
                      <span className="metric-indicator" />
                      {m.sub}
                    </span>
                  </button>
                ))}
              </div>
              <RadarOverview items={discoveries} error={discoveryError} onExplore={()=>navigate("discoveries")}/>
              <div className="content-grid">
                <div>{table}</div>
                <aside className="signal-panel">
                  <div className="section-heading">
                    <h2>Semnale din dosarele verificate</h2>
                    <span className="signal-symbol">
                      <Radio size={17} />
                    </span>
                  </div>
                  <p className="signal-caption">
                    Publicarea surselor, în ordine cronologică
                  </p>
                  <div className="timeline">
                    {companies.slice(0, 3).map((c, i) => (
                      <button
                        className="signal"
                        key={c.id}
                        onClick={() => setSelected(c)}
                      >
                        <span className={`timeline-dot dot-${i}`} />
                        <span className="signal-time">
                          {formatDate(c.publishedAt)}
                        </span>
                        <strong>{c.name}</strong>
                        <p>{c.signal}</p>
                        <span className="signal-source">
                          <FileText size={12} />
                          {c.sourceName}{" "}
                          <ArrowUpRight size={12} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="signal-all"
                    onClick={() => navigate("alerts")}
                  >
                    Toate semnalele <ArrowRight size={15} />
                  </button>
                </aside>
              </div>
              <div className="bottom-note">
                <ShieldCheck size={16} />
                <span>
                  Context înainte de concluzii. Fiecare semnal are o sursă și o dată. Intențiile nu garantează listarea.
                </span>
                <button onClick={() => navigate("research")}>
                  Cum funcționează <ArrowUpRight size={14} />
                </button>
              </div>
            </>
          )}
          {view === "discoveries" && <Discoveries items={discoveries} error={discoveryError} embedded/>}
          {view === "universe" && <CompanyUniverse companies={allCompanies} items={discoveries} startups={startups} error={discoveryError||startupError||error} onVerified={()=>navigate("companies")} watch={watch} onToggle={toggle}/>}
          {view === "companies" && table}
          {view === "watchlist" && <CompanyUniverse companies={allCompanies} items={discoveries} startups={startups} error={discoveryError||startupError||error} onVerified={()=>navigate("universe")} watch={watch} onToggle={toggle} savedOnly/>}
          {view === "startups" && <StartupDirectory rows={startups} error={startupError} embedded/>}
          {view === "dossiers" && <CompanyResearch companies={allCompanies} items={discoveries} error={discoveryError||error} evaluatedAt={evaluatedAt} embedded/>}
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
              <div className="calendar-unscheduled">
                <h3>Calendar raportat de agregator · estimări neconfirmate</h3>
                <p>Datele de mai jos provin din calendarul Stock Analysis; nu sunt date confirmate de subscriere. Depunerile SEC raportate nu sunt introduse ca date de listare.</p>
                {discoveryError&&<p role="alert">{discoveryError}</p>}
                {estimated.filter(i=>i.eventDate?.startsWith(`${new Date(currentYear,month,1).getFullYear()}-${String(new Date(currentYear,month,1).getMonth()+1).padStart(2,'0')}`)).map(i=><p key={i.url}><strong>{i.eventDate}</strong> · {safeEvidenceUrl(i.url)?<a href={i.url} target="_blank" rel="noopener noreferrer">{i.title} ↗</a>:i.title} · Neoficial / estimativ</p>)}
                {!estimated.some(i=>i.eventDate?.startsWith(`${new Date(currentYear,month,1).getFullYear()}-${String(new Date(currentYear,month,1).getMonth()+1).padStart(2,'0')}`))&&<p>Nicio estimare disponibilă pentru luna selectată.</p>}
                <button className="text-button" onClick={()=>navigate('universe')}>Explorează toate companiile și startupurile →</button>
              </div>
              <div className="calendar-unscheduled">
                <h3>Orizont neconfirmat</h3>
                {companies
                  .filter((c) => !c.date)
                  .map((c) => (
                    <button key={c.id} onClick={() => setSelected(c)}>
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
              <a className="research-discovery-link" href="/descoperiri">Vezi documentele descoperite <ExternalLink size={16} /></a>
              <a className="research-discovery-link" href="/dosare">Dosare și semnale <ExternalLink size={16} /></a>
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
                  <p>{unread} semnale necitite · dosare și documente descoperite</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setRead(r=>Array.from(new Set([...r,...alerts.map(alertKey),...documentAlerts.map(discoveryKey)])))}
                >
                  <CheckCheck size={16} />
                  Marchează citite
                </button>
              </div>
              {discoveryError&&<p role="alert" className="notice">{discoveryError}</p>}
              <h3 className="home-radar-count">Documente descoperite · {documentAlerts.length}</h3>
              {documentAlerts.slice(0,alertLimit).map(i=><article className={`alert-row ${read.includes(discoveryKey(i))?'':'unread'}`} key={i.url}><div className="alert-content"><strong>{safeEvidenceUrl(i.url)?<a href={i.url} target="_blank" rel="noopener noreferrer">{i.title} ↗</a>:i.title}</strong><p>{sourceCategory(i.source_kind)} · {i.area} · {i.source_name}</p><small>Detectat: {formatDate(i.discovered_at)} · Publicat: {i.published_at?formatDate(i.published_at):'necunoscut'} · stadiu de verificat</small></div><button className="secondary" aria-label={`Marchează documentul ${read.includes(discoveryKey(i))?'necitit':'citit'}: ${i.title}`} onClick={()=>setRead(r=>r.includes(discoveryKey(i))?r.filter(k=>k!==discoveryKey(i)):[...r,discoveryKey(i)])}>{read.includes(discoveryKey(i))?'Citit ✓':'Marchează citit'}</button></article>)}
              {documentAlerts.length>alertLimit&&<button className="discovery-button" onClick={()=>setAlertLimit(n=>n+25)}>Arată încă 25 documente</button>}
              <h3 className="home-radar-count">Dosare verificate · {alerts.length}</h3>
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
                    În notificări, afișează doar dosarele și documentele provenite din surse oficiale.
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
                  <p>Rezumatele și interfața vor fi disponibile în română.</p>
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
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="detail-panel"
            aria-describedby="company-description"
          >
            {selected && (
              <>
                <div className="detail-top">
                  <span className="eyebrow">DOSAR DE CERCETARE</span>
                  <Dialog.Close
                    className="icon-button"
                    aria-label="Închide profilul"
                  >
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="detail-title">
                  <Logo company={selected} />
                  <div>
                    <Dialog.Title>{selected.name}</Dialog.Title>
                    <span>
                      {selected.flag} {selected.country} <span>·</span>{" "}
                      {selected.sector}
                    </span>
                  </div>
                </div>
                <Dialog.Description
                  id="company-description"
                  className="detail-description"
                >
                  {selected.summary}
                </Dialog.Description>
                <div className="detail-actions">
                  <Badge stage={selected.stage} />
                  <button
                    className={
                      watch.includes(selected.id) ? "secondary" : "primary"
                    }
                    onClick={() => toggle(selected.id)}
                  >
                    {watch.includes(selected.id) ? (
                      <Check size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                    {watch.includes(selected.id) ? "În lista mea" : "Urmărește"}
                  </button>
                </div>
                <div className="demo-warning">
                  <Info size={17} />
                  <p>
                    {stale(selected) ? "Sursă mai veche de 90 de zile: stadiul necesită reconfirmare. " : ""}Stadiul reflectă documentul citat, nu garantează că oferta se va realiza.
                  </p>
                </div>
                <div className="detail-stats">
                  <div>
                    <small>PUBLICAREA SURSEI</small>
                    <strong>
                      {formatDate(selected.publishedAt)}
                    </strong>
                  </div>
                  <div>
                    <small>ÎNCREDERE ÎN DOVEZI</small>
                    <strong className="confidence">
                      {selected.confidence}
                    </strong>
                  </div>
                </div>
                <p className="score-explainer">
                  Document consultat la {formatDate(selected.checkedAt)}. Citirea sursei nu confirmă că stadiul nu s-a schimbat între timp.
                </p>
                <section className="detail-section">
                  <h3>Ce s-a schimbat</h3>
                  <p>{selected.signal}</p>
                  <div className="detail-fact">
                    <span>Bursa vizată</span>
                    <strong>{selected.exchange}</strong>
                  </div>
                  <div className="detail-fact">
                    <span>
                      {selected.date
                        ? "Începutul subscrierii"
                        : "Orizont de listare"}
                    </span>
                    <strong>{selected.dateLabel}</strong>
                  </div>
                  <div className="detail-fact">
                    <span>Prima zi de tranzacționare</span>
                    <strong>{selected.stage === "Listată" ? selected.dateLabel : "Neconfirmată"}</strong>
                  </div>
                </section>
                <section className="detail-section">
                  <h3>De ce merită cercetată</h3>
                  <p>{selected.opportunity}</p>
                </section>
                <section className="detail-section risk-section">
                  <h3>Riscuri & întrebări deschise</h3>
                  <p>{selected.risk}</p>
                  <p>
                    Analiza financiară și scorul de potențial nu sunt încă implementate.
                  </p>
                </section>
                <section className="detail-section">
                  <h3>Surse și istoric</h3>
                  <a className="research-discovery-link" href={`/dosare#${encodeURIComponent(selected.id)}`}>Compară semnalele colectate <ExternalLink size={14}/></a>
                  {(selected.documents || [{url:selected.sourceUrl,title:selected.sourceName,publishedAt:selected.publishedAt,checkedAt:selected.checkedAt}]).map(document => (
                    <div className="evidence" key={document.url}><FileText size={18} /><div>
                      <a href={document.url} target="_blank" rel="noreferrer">{document.title} <ExternalLink size={14} /></a>
                      <p>Publicat: {formatDate(document.publishedAt)}</p>
                      <p>Consultat manual: {formatDate(document.checkedAt)}</p>
                    </div></div>
                  ))}
                </section>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

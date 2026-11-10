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
import { type Company, type Source } from "@/lib/data";
type View =
  | "overview"
  | "companies"
  | "calendar"
  | "watchlist"
  | "research"
  | "alerts"
  | "settings";
const navigation = [
  { id: "overview", label: "Privire de ansamblu", icon: LayoutDashboard },
  { id: "companies", label: "Companii", icon: Building2 },
  { id: "calendar", label: "Calendar IPO", icon: CalendarDays },
  { id: "watchlist", label: "Lista mea", icon: Bookmark },
  { id: "research", label: "Centrul de cercetare", icon: Radio },
] as const;
const titles: Record<View, string> = {
  overview: "Privire de ansamblu",
  companies: "Universul companiilor",
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
export default function Dashboard({ companies: allCompanies, sources, error }: { companies: Company[]; sources: Source[]; error: string | null }) {
  const [archive, setArchive] = useState(false);
  const companies = allCompanies.filter(c => c.stage !== "Listată");
  const formatDate = (value: string) => new Intl.DateTimeFormat("ro-RO", {dateStyle: "medium", timeZone: "Europe/Bucharest"}).format(new Date(value));
  const stale = (c: Company) => Date.now() - new Date(c.publishedAt).getTime() > 90 * 86400000;
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState<View>("overview");
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
              typeof id === "string" && allCompanies.some((c) => c.id === id),
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
            (country === "Toate țările" || country === c.country) &&
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
    .slice(0, 4)
    .filter((c) => !onlyOfficial || c.official);
  const unread = alerts.filter((c) => !read.includes(c.id)).length;
  const table = (
    <section className="table-panel">
      <div className="section-heading">
        <div>
          <h2>
            {view === "watchlist" ? "Lista de urmărire" : archive ? "Arhiva listărilor" : "Companii pe radar"}{" "}
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
            aria-label="Filtrează după țară"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {["Toate țările", "SUA", "România"].map(
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
            <small>SUA & România · date publice</small>
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
                <span className="nav-count">{watch.length}</span>
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
              Dosare reale, revizuite manual. Automatizarea continuă este în pregătire.
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
                  ? "Semnale timpurii. Surse verificate. O perspectivă mai clară."
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
                  {
                    label: "Companii pe radar",
                    value: companies.length,
                    sub: "SUA & România",
                    icon: Building2,
                  },
                  {
                    label: "Documentație depusă",
                    value: companies.filter(
                      (c) => c.stage === "Documente depuse",
                    ).length,
                    sub: "Dovezi de nivel ridicat",
                    icon: FileText,
                  },
                  {
                    label: "Evenimente în calendar",
                    value: companies.filter((c) => c.date).length,
                    sub: "Date de subscriere confirmate",
                    icon: CalendarDays,
                  },
                  {
                    label: "În lista ta",
                    value: watch.length,
                    sub: "Perspective de urmărit",
                    icon: Bookmark,
                  },
                ].map((m, i) => (
                  <button
                    className="metric"
                    key={m.label}
                    onClick={() => {
                      navigate(
                        i === 2
                          ? "calendar"
                          : i === 3
                            ? "watchlist"
                            : "companies",
                      );
                      if (i === 1) setStage("Documente depuse");
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
              <div className="spotlight">
                <div className="spotlight-content">
                  <div className="spotlight-label">
                    <span className="spark">✳</span> ÎN PRIM-PLAN{" "}
                    <span>DOSARE REALE</span>
                  </div>
                  <h2>
                    Următorul capitol al AI
                    <br />
                    începe înainte de listare.
                  </h2>
                  <p>
                    Urmărește intențiile și documentele de listare.
                    <br className="desktop-break" /> Explorează semnalul,
                    dovezile și întrebările încă deschise.
                  </p>
                  <button
                    className="primary"
                    onClick={() => companies[0] ? setSelected(companies[0]) : navigate("research")}
                  >
                    Explorează compania <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="orbit-art" aria-hidden="true">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="orbit o3" />
                  <div className="orbit-core">
                    ai<span>RESEARCH</span>
                  </div>
                  <span className="orbit-node node1">
                    <FileText size={19} />
                  </span>
                  <span className="orbit-node node2">
                    <Activity size={19} />
                  </span>
                  <span className="orbit-node node3">
                    <Globe2 size={18} />
                  </span>
                  <div className="art-tag">
                    <span />
                    Documente depuse
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </div>
              <div className="content-grid">
                <div>{table}</div>
                <aside className="signal-panel">
                  <div className="section-heading">
                    <h2>Ultimele semnale</h2>
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
          {(view === "companies" || view === "watchlist") && table}
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
                    Dosarele publicate sunt revizuite manual. Colectorii pregătesc candidați pentru verificare; rularea periodică nu este activată. SEC a limitat accesul automat.
                  </p>
                </div>
                <span className="badge gray">
                  <span />
                  Revizuire manuală
                </span>
              </div>
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
                        {s.area} · {s.kind}<br />{s.detail}
                      </small>
                    </div>
                    <span className="source-frequency">
                      {s.checked_at ? formatDate(s.checked_at) : "Fără colectare reușită"}
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
                  <p>{unread} dosare necitite · data indică publicarea sursei</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setRead(alerts.map((c) => c.id))}
                >
                  <CheckCheck size={16} />
                  Marchează citite
                </button>
              </div>
              {alerts.map((c) => (
                <div
                  className={`alert-row ${!read.includes(c.id) ? "unread" : ""}`}
                  key={c.id}
                >
                  <Logo company={c} />
                  <button
                    className="alert-content"
                    onClick={() => {
                      setSelected(c);
                      setRead((r) => Array.from(new Set([...r, c.id])));
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
                    aria-label={`Marchează ${c.name} ${read.includes(c.id) ? "necitit" : "citit"}`}
                    onClick={() =>
                      setRead((r) =>
                        r.includes(c.id)
                          ? r.filter((x) => x !== c.id)
                          : [...r, c.id],
                      )
                    }
                  >
                    {read.includes(c.id) ? (
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
                    În notificări, afișează doar dosarele cu o sursă oficială.
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
                    Date publice revizuite manual. Lista nu acoperă toate IPO-urile. Actualizarea continuă nu este activată.
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
                  <h3>Sursa documentară</h3>
                  <div className="evidence"><FileText size={18} /><div>
                    <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceName} <ExternalLink size={14} /></a>
                    <p>Publicat: {formatDate(selected.publishedAt)}</p>
                    <p>Consultat manual: {formatDate(selected.checkedAt)}</p>
                    <small>{selected.signal}</small>
                  </div></div>
                </section>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export type Stage =
  | "Documente depuse"
  | "Intenție anunțată"
  | "Semnal preliminar"
  | "Ofertă programată";
export type Company = {
  id: string;
  name: string;
  monogram: string;
  color: string;
  country: string;
  flag: string;
  sector: string;
  exchange: string;
  stage: Stage;
  confidence: "Ridicată" | "Medie" | "Scăzută";
  priority: number;
  summary: string;
  signal: string;
  date: string | null;
  dateLabel: string;
  evidence: number;
  opportunity: string;
  risk: string;
};
// Entire dataset is fictional. No simulated listing claim describes an actual issuer.
export const companies: Company[] = [
  {
    id: "aether",
    name: "Aether Intelligence",
    monogram: "aı",
    color: "peach",
    country: "SUA",
    flag: "🇺🇸",
    sector: "Inteligență artificială",
    exchange: "Nasdaq",
    stage: "Documente depuse",
    confidence: "Ridicată",
    priority: 94,
    summary:
      "Infrastructură de inteligență artificială pentru companii. Dezvoltă modele specializate și instrumente de automatizare pentru echipe mari.",
    signal:
      "Un nou amendament la documentația de listare clarifică structura ofertei.",
    date: null,
    dateLabel: "Dată neconfirmată",
    evidence: 4,
    opportunity:
      "Cererea pentru automatizare și integrarea în fluxurile clienților pot susține venituri recurente.",
    risk: "Costuri ridicate de infrastructură, concurență puternică și dependență de furnizorii de calcul.",
  },
  {
    id: "nordwerk",
    name: "Nordwerk Robotics",
    monogram: "N",
    color: "blue",
    country: "Germania",
    flag: "🇩🇪",
    sector: "Robotică",
    exchange: "Frankfurt",
    stage: "Intenție anunțată",
    confidence: "Medie",
    priority: 88,
    summary:
      "Roboți modulari pentru automatizarea liniilor de producție europene, cu software propriu de control.",
    signal:
      "Conducerea explorează o listare pentru finanțarea extinderii europene.",
    date: null,
    dateLabel: "2027 · estimativ",
    evidence: 3,
    opportunity:
      "Automatizarea industrială și baza instalată pot genera venituri din servicii.",
    risk: "Cicluri lungi de vânzare și expunere la investițiile industriei auto.",
  },
  {
    id: "verdant",
    name: "Verdant Energy",
    monogram: "v",
    color: "mint",
    country: "SUA",
    flag: "🇺🇸",
    sector: "Energie",
    exchange: "NYSE",
    stage: "Ofertă programată",
    confidence: "Ridicată",
    priority: 86,
    summary:
      "Sisteme de stocare a energiei pentru rețele și operatori industriali.",
    signal: "Calendarul demonstrativ al ofertei include începutul subscrierii.",
    date: "2026-11-24",
    dateLabel: "24 nov. 2026 · demo",
    evidence: 5,
    opportunity:
      "Necesitatea echilibrării rețelelor poate susține proiecte de stocare pe termen lung.",
    risk: "Necesită investiții mari; marjele depind de costul bateriilor și de execuția proiectelor.",
  },
  {
    id: "carpathia",
    name: "Carpathia Systems",
    monogram: "cs",
    color: "lavender",
    country: "România",
    flag: "🇷🇴",
    sector: "Securitate cibernetică",
    exchange: "BVB",
    stage: "Intenție anunțată",
    confidence: "Medie",
    priority: 82,
    summary:
      "Platformă de securitate cibernetică pentru infrastructură critică și companii din Europa Centrală.",
    signal:
      "Un interviu al conducerii menționează intenția de accesare a pieței de capital.",
    date: null,
    dateLabel: "Dată neconfirmată",
    evidence: 2,
    opportunity:
      "Extinderea regională și contractele recurente reprezintă direcții de cercetare.",
    risk: "Concentrarea veniturilor în câțiva clienți și lichiditate potențial redusă.",
  },
  {
    id: "alpine",
    name: "Alpine Quantum",
    monogram: "aq",
    color: "sand",
    country: "Austria",
    flag: "🇦🇹",
    sector: "Tehnologie avansată",
    exchange: "Viena",
    stage: "Semnal preliminar",
    confidence: "Scăzută",
    priority: 76,
    summary:
      "Senzori cuantici și componente de precizie pentru cercetare și aplicații industriale.",
    signal:
      "Presa de specialitate discută opțiuni de finanțare; listarea nu este confirmată.",
    date: null,
    dateLabel: "Dată neconfirmată",
    evidence: 1,
    opportunity:
      "Proprietatea intelectuală și aplicațiile de nișă justifică monitorizarea.",
    risk: "Tehnologie în comercializare timpurie; nu există un angajament de listare.",
  },
  {
    id: "helix",
    name: "Helix Bio",
    monogram: "h",
    color: "rose",
    country: "Germania",
    flag: "🇩🇪",
    sector: "Biotehnologie",
    exchange: "Frankfurt",
    stage: "Documente depuse",
    confidence: "Ridicată",
    priority: 79,
    summary:
      "Platformă de diagnostic molecular pentru identificarea timpurie a bolilor.",
    signal:
      "Documentația demonstrativă descrie utilizarea fondurilor pentru validare clinică.",
    date: null,
    dateLabel: "T1 2027 · estimativ",
    evidence: 3,
    opportunity:
      "Parteneriatele de diagnostic ar putea accelera distribuția produsului.",
    risk: "Validare clinică, aprobări și necesar de finanțare înainte de profitabilitate.",
  },
];
export const sources = [
  {
    name: "SEC · EDGAR",
    area: "SUA",
    kind: "Registru oficial",
    url: "https://www.sec.gov/edgar/search/",
    interval: "5–15 min",
  },
  {
    name: "Bursa de Valori București",
    area: "România",
    kind: "Bursă",
    url: "https://www.bvb.ro/",
    interval: "15–30 min",
  },
  {
    name: "BaFin",
    area: "Germania",
    kind: "Autoritate",
    url: "https://www.bafin.de/",
    interval: "30 min",
  },
  {
    name: "Wiener Börse",
    area: "Austria",
    kind: "Bursă",
    url: "https://www.wienerborse.at/en/",
    interval: "30 min",
  },
];

export type Stage =
  | "Documente depuse"
  | "Intenție anunțată"
  | "Semnal preliminar"
  | "Ofertă programată"
  | "Listată";
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
  publishedAt: string;
  checkedAt: string;
  official: boolean;
  sourceUrl: string;
  sourceName: string;
  summary: string;
  signal: string;
  date: string | null;
  dateLabel: string;
  evidence: number;
  opportunity: string;
  risk: string;
};

export type Source = { id: string; name: string; area: string; kind: string; url: string; status: string; checked_at: string | null; detail: string };

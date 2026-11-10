export type Stage =
  | "Documente depuse"
  | "Intenție anunțată"
  | "Semnal preliminar"
  | "Ofertă programată"
  | "Listată"
  | "Roadshow lansat"
  | "Amânată";
export type Company = {
  id: string;
  name: string;
  monogram: string;
  color: string;
  country: string;
  regions?: string[];
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
  documents?: {url: string; title: string; publishedAt: string; checkedAt: string}[];
  summary: string;
  signal: string;
  date: string | null;
  dateLabel: string;
  evidence: number;
  opportunity: string;
  risk: string;
};

export type Source = { id: string; name: string; area: string; kind: string; url: string; status: string; checked_at: string | null; detail: string; last_attempt_at?: string | null; last_error?: string | null; consecutive_failures?: number; pending_count?: number; last_trigger?: string | null };

export type Scheduler = {enabled: boolean; cadence_minutes: number; configured_at: string};

export type Discovery = {url:string; title:string; source_name:string; area:string; published_at:string|null; discovered_at:string; last_seen_at:string};

export type CompanyAccessResearch = {
 contactSummary?:string;
 reviewedAt:string; status:string; conclusion:string;
 parties:{name:string;role:string;evidence:string;kind:string}[];
 contacts:{name:string;role:string;value:string;purpose:string;evidence:string;kind:string;url:string|null}[];
 privateAccess:string;romaniaAccess:string;minimum:string;nextSteps:string[];
 sources:{id:string;title:string;url:string;publishedAt:string|null;kind:string}[];
};
export type Stage =
  | "Calendar estimativ"
  | "Posibilă amânare"
  | "Documente depuse"
  | "Intenție anunțată"
  | "Semnal preliminar"
  | "Ofertă programată"
  | "Listată"
  | "Roadshow lansat"
  | "Amânată";
export type CompanyContext = {
 theme:string; focus:boolean;
 business:{description:string;products:string;customers:string;model:string;sourceUrl:string};
 listingEvidence:{sourceName:string;url:string;publishedDate:string|null;dateExplanation:string;statement:string;kind:string}[];
 nextCheckpoint:string; listingDate:string|null; estimatedListingDate:string|null;
};
export type Company = {
 context?:CompanyContext;
 accessResearch?:CompanyAccessResearch;
  aliases?: string[];
  sourceLabel?: string;
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

export type Discovery = {source_kind?:string;article_supported?:boolean;document_evidence?:DocumentEvidence|null;document_attempted_at?:string|null;document_error?:string|null;document_stale?:boolean;url:string; title:string; source_name:string; area:string; published_at:string|null; discovered_at:string; last_seen_at:string};

export type DocumentEvidence = {version:string;excerpt:string;excerpt_truncated:boolean;publication_date:string|null;indications:string[];paragraph_count:number};

export type StartupProfile={id:string;name:string;url:string;batch:string;status:string;stage:string;industry:string;location:string;description:string};

export type ResearchEvent={id:string;company_name:string;title:string;industry:string;region:string;keywords:string[];url:string;published_at:string|null;discovered_at:string;summary:string;listing_evidence:string;source_name:string};
export type ResearchActivity={runs:{run_key:string;finished_at:string;sources:number;errors:number;observed:number}[];events:Pick<ResearchEvent,'id'|'company_name'|'industry'|'region'|'discovered_at'>[];email:{accepted:number;last_accepted:string|null;pending:number;issues:number}};

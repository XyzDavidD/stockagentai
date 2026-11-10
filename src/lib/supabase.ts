import type { Company, Source } from "./data";
// Publishable key is intentionally public; RLS allows only curated public research.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kvssszorqmzmikmxcwll.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_5oKrzbO3POZ7qbXHKqixvg_mQ0wcgd6";
async function read(path: string) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
  return response.json();
}
export async function getResearch(): Promise<{companies: Company[]; sources: Source[]; error: string | null}> {
  try {
    const [rows, sources] = await Promise.all([read("companies?select=profile&published=eq.true&order=id"), read("research_sources?select=*&order=id")]);
    const companies = rows.map((r: {profile: Company}) => r.profile).sort((a: Company,b: Company) => b.publishedAt.localeCompare(a.publishedAt));
    return {companies, sources, error: null};
  } catch {
    return {companies: [], sources: [], error: "Datele Supabase nu sunt disponibile momentan. Reîncarcă pagina pentru a încerca din nou."};
  }
}

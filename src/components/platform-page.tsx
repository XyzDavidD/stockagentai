import access from '@/data/company-access.json';
import context from '@/data/company-context.json';
import reviewed from '@/data/researched-companies.json';
import {mergeDossiers,eligibleCompany} from '@/lib/dossiers.mjs';
import type {Company,CompanyContext,CompanyAccessResearch} from '@/lib/data';
import Dashboard from '@/components/dashboard';
import {getResearch,getDiscoveries,getStartupDirectory,getResearchActivity,getResearchEvents} from '@/lib/supabase';
import type {View} from '@/lib/platform-routes';
export default async function PlatformPage({view='overview'}:{view?:View}){
 const [research,discovery,directory,activity,detected]=await Promise.all([getResearch(),getDiscoveries(),getStartupDirectory(),getResearchActivity(),getResearchEvents()]);
 const companies=mergeDossiers(research.companies,reviewed as Company[]).filter(eligibleCompany).map(c=>({...c,context:(context as Record<string,CompanyContext>)[c.id],accessResearch:(access as Record<string,CompanyAccessResearch>)[c.id]}));
 return <Dashboard detected={detected} activity={activity} {...research} companies={companies} initialView={view} evaluatedAt={new Date().toISOString()} discoveries={discovery.items} discoveryError={discovery.error} startups={directory.rows} startupError={directory.error}/>;
}

import CompanyResearch from '@/components/company-research';
import {getDiscoveries,getResearch} from '@/lib/supabase';
export const dynamic='force-dynamic';
export const metadata={title:'Dosare și semnale · stockagentai'};
export default async function Page(){
 const [discoveries,research]=await Promise.all([getDiscoveries(),getResearch()]);
 return <CompanyResearch items={discoveries.items} companies={research.companies} error={discoveries.error||research.error} evaluatedAt={new Date().toISOString()}/>;
}

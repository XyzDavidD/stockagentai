import Dashboard from "@/components/dashboard";
import {getResearch,getDiscoveries,getStartupDirectory} from "@/lib/supabase";
export const dynamic="force-dynamic";
export default async function Page(){
 const [research,discovery,directory]=await Promise.all([getResearch(),getDiscoveries(),getStartupDirectory()]);
 return <Dashboard {...research} discoveries={discovery.items} discoveryError={discovery.error} startups={directory.rows} startupError={directory.error}/>;
}

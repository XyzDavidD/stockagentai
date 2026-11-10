import Dashboard from '@/components/dashboard';
import {getResearch,getDiscoveries,getStartupDirectory} from '@/lib/supabase';
import type {View} from '@/lib/platform-routes';
export default async function PlatformPage({view='overview'}:{view?:View}){
 const [research,discovery,directory]=await Promise.all([getResearch(),getDiscoveries(),getStartupDirectory()]);
 return <Dashboard {...research} initialView={view} evaluatedAt={new Date().toISOString()} discoveries={discovery.items} discoveryError={discovery.error} startups={directory.rows} startupError={directory.error}/>;
}

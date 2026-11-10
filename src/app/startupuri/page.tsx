import StartupDirectory from '@/components/startup-directory';
import {getStartupDirectory} from '@/lib/supabase';
export const dynamic='force-dynamic';
export const metadata={title:'Registru startupuri YC · stockagentai'};
export default async function Page(){return <StartupDirectory {...await getStartupDirectory()}/>;}

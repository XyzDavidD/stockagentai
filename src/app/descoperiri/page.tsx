import Discoveries from '@/components/discoveries';
import { getDiscoveries } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Descoperiri · stockagentai'};
export default async function Page(){return <Discoveries {...await getDiscoveries()} />;}

import {getResearchEvent} from '@/lib/supabase';
import {notFound,redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,event=await getResearchEvent(id);if(!event)notFound();
 redirect(`/companii?companie=${encodeURIComponent(event.id)}`);
}

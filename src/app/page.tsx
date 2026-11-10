import Dashboard from "@/components/dashboard";
import { getResearch } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function Page() {
  const data = await getResearch();
  return <Dashboard {...data} />;
}

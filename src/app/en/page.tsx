import type { Metadata } from 'next';
import LandingPage from '@/components/landing-page';
export const metadata: Metadata = {
  title: "StockAgentAI | Research. Perspective. Dialogue.",
  description: "Company research across Europe and the United States. Meet the StockAgentAI representative and explore his academic credentials.",
  alternates: { canonical: "https://www.stockagentai.ro/en", languages: { ro: 'https://www.stockagentai.ro', en: 'https://www.stockagentai.ro/en', 'x-default': 'https://www.stockagentai.ro' } },
  openGraph: { title: "StockAgentAI | Research. Perspective. Dialogue.", description: "Company research across Europe and the United States. Meet the StockAgentAI representative and explore his academic credentials.", url: "https://www.stockagentai.ro/en", locale: "en_GB", alternateLocale: "ro_RO", type: 'website' },
};
export default function Page() { return <LandingPage locale="en" />; }

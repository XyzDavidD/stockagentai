import type { Metadata } from 'next';
import LandingPage from '@/components/landing-page';
export const metadata: Metadata = {
  title: "StockAgentAI | Cercetare. Perspectivă. Dialog.",
  description: "Cercetare despre companii din Europa și SUA. Descoperă StockAgentAI, reprezentantul său și documentele academice.",
  alternates: { canonical: "https://www.stockagentai.ro", languages: { ro: 'https://www.stockagentai.ro', en: 'https://www.stockagentai.ro/en', 'x-default': 'https://www.stockagentai.ro' } },
  openGraph: { title: "StockAgentAI | Cercetare. Perspectivă. Dialog.", description: "Cercetare despre companii din Europa și SUA. Descoperă StockAgentAI, reprezentantul său și documentele academice.", url: "https://www.stockagentai.ro", locale: "ro_RO", alternateLocale: "en_GB", type: 'website' },
};
export default function Page() { return <LandingPage locale="ro" />; }

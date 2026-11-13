import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "stockagentai — Înaintea următoarei listări",
  description:
    "Spațiul tău de cercetare pentru viitoarele listări. Surse publice, semnale documentate și colectare programată.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

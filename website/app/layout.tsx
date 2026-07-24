import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Arry Production – Școală de Muzică Premium',
  description: 'Descoperă talentul muzical din tine la Arry Production. Cursuri de pian, tobe, canto, chitară și solfegiu pentru copii, adolescenți și adulți.',
  keywords: ['scoala muzica', 'cursuri pian', 'cursuri tobe', 'canto', 'chitara', 'muzica copii', 'Arry Production'],
  openGraph: {
    title: 'Arry Production – Școală de Muzică Premium',
    description: 'Școala unde pasiunea pentru muzică devine performanță.',
    type: 'website',
    locale: 'ro_RO',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

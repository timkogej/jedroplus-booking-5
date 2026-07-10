import { Inter } from 'next/font/google';
import './styles/classic.css';

// Inter for everything — headings (700/800) and body (400/500/600)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito', // components use var(--font-nunito) for headings
  display: 'swap',
});

export default function ClassicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // --font-nunito-sans is aliased to --font-nunito so body components
    // using var(--font-nunito-sans) also resolve to Inter
    <div
      className={inter.variable}
      style={{ '--font-nunito-sans': 'var(--font-nunito)' } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

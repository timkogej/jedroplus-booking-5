import { Playfair_Display, Cormorant_Garamond, Oswald } from 'next/font/google';
import './styles/casino.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-oswald',
  display: 'swap',
});

export default function CasinoRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${playfair.variable} ${cormorant.variable} ${oswald.variable}`}>
      {children}
    </div>
  );
}

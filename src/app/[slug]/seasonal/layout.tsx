import { Quicksand, Playfair_Display, Mountains_of_Christmas, Creepster } from 'next/font/google';
import './styles/seasonal.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const mountainsOfChristmas = Mountains_of_Christmas({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-christmas',
  display: 'swap',
});

const creepster = Creepster({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-creepster',
  display: 'swap',
});

export default function SeasonalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${quicksand.variable} ${playfair.variable} ${mountainsOfChristmas.variable} ${creepster.variable}`}>
      {children}
    </div>
  );
}

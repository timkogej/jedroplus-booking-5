import { Inter, Mountains_of_Christmas, Creepster } from 'next/font/google';
import './styles/seasonal.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

// Holiday decorative fonts — kept for theming special events
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
    <div className={`${inter.variable} ${mountainsOfChristmas.variable} ${creepster.variable}`}>
      {children}
    </div>
  );
}

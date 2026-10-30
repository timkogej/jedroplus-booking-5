import { Inter } from 'next/font/google';
import '@/styles/playfair.css';
import './styles/elegant.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export default function ElegantRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} elegant-root`}>
      {children}
    </div>
  );
}

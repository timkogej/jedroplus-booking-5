import { Manrope } from 'next/font/google';
import './styles/modern.css';

// Manrope: geometric and calm, reads well light-on-dark.
const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export default function ModernRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Older and shared parts read --font-inter / --font-clash; modern.css points
  // both at Manrope.
  return <div className={`${manrope.variable} modern-root`}>{children}</div>;
}

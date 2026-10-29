import { Inter } from 'next/font/google';
import './styles/classic.css';

// Apple's own San Francisco on Apple devices, Inter everywhere else.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export default function ClassicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Older and shared components still read --font-nunito and
  // --font-nunito-sans; classic.css points both at the same stack.
  return <div className={`${inter.variable} classic-root`}>{children}</div>;
}

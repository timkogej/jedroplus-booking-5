import { Inter } from 'next/font/google';
import './styles/modern.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export default function ModernRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Clash Display — premium heading font from Fontshare (not on Google Fonts) */}
      <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
      />
      <div className={inter.variable}>
        {children}
      </div>
    </>
  );
}

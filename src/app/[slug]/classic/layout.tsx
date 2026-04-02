import { Nunito, Nunito_Sans } from 'next/font/google';
import './styles/classic.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export default function ClassicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} ${nunitoSans.variable}`}>
      {children}
    </div>
  );
}

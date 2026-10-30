import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
import { Cormorant_Garamond, Oswald } from 'next/font/google';
import '@/styles/playfair.css';
import './styles/casino.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-oswald',
  display: 'swap',
});

export default async function CasinoRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Seasonal / magazine / casino are Jedro Pro designs. On lower plans we send
  // the visitor to the company's standard booking page instead of showing a
  // design they are not paying for.
  if (!(await proDesignsAllowed(params.slug))) {
    redirect(`/${params.slug}`);
  }

  return (
    <div className={`${cormorant.variable} ${oswald.variable}`}>
      {children}
    </div>
  );
}

import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
import { Inter, Oswald } from 'next/font/google';
import '@/styles/playfair.css';
import './styles/casino.css';

const oswald = Oswald({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-oswald',
  display: 'swap',
});

// Easy-to-read text for descriptions, inputs and details.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
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
    <div className={`${oswald.variable} ${inter.variable} casino-root`}>
      {children}
    </div>
  );
}

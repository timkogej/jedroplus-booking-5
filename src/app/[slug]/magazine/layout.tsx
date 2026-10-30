import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
import { Source_Serif_4 } from 'next/font/google';
import '@/styles/playfair.css';
import './styles/magazine.css';

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
});

export default async function MagazineRootLayout({
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
    <div className={`${sourceSerif.variable}`}>
      {children}
    </div>
  );
}

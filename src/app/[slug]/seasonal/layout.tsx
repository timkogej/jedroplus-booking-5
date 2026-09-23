import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
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

export default async function SeasonalRootLayout({
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
    <div className={`${inter.variable} ${mountainsOfChristmas.variable} ${creepster.variable}`}>
      {children}
    </div>
  );
}

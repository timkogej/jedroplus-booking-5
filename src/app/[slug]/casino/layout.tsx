import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
import './styles/casino.css';

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
    <div>
      {children}
    </div>
  );
}

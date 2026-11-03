import { redirect } from 'next/navigation';
import { proDesignsAllowed } from '@/lib/plan.server';
import './styles/magazine.css';

export default async function MagazineRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Seasonal / magazine / casino are Jedro Pro designs. On lower plans we send
  // the visitor to the classic design instead of showing a design they are not
  // paying for. Not to /{slug}: that redirects to the main design, which can be
  // this very one, and the two redirects would loop.
  if (!(await proDesignsAllowed(params.slug))) {
    redirect(`/${params.slug}/classic`);
  }

  return (
    <div>
      {children}
    </div>
  );
}

import './styles/classic.css';

export default function ClassicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Older and shared components still read --font-nunito and
  // --font-nunito-sans; classic.css points both at the same stack.
  return <div className="classic-root">{children}</div>;
}

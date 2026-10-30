import './styles/modern.css';

export default function ModernRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Older and shared parts read --font-inter / --font-clash; modern.css points
  // both at Manrope.
  return <div className="modern-root">{children}</div>;
}

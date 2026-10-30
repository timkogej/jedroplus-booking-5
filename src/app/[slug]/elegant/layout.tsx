import './styles/elegant.css';

export default function ElegantRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="elegant-root">
      {children}
    </div>
  );
}

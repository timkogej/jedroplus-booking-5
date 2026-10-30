import type { Metadata, Viewport } from "next";
import "@/styles/fonts.css";
import "./globals.css";
import HtmlLang from "@/components/shared/HtmlLang";
import CalendarChooser from "@/components/shared/CalendarChooser";

export const metadata: Metadata = {
  // Absolute URLs for the link preview image.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://booking.jedroplus.com'),
  title: "Rezervacija termina",
  description: "Spletno naročanje na termin prek Jedro+.",
};

// Phones: no zoom when tapping a field or a button (iOS zooms into inputs
// under 16px and on double tap). Pinch zoom still works on iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body
        className="font-sans antialiased"
      >
        <HtmlLang />
        <CalendarChooser />
        {children}
      </body>
    </html>
  );
}

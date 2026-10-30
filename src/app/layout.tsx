import type { Metadata, Viewport } from "next";
import { Outfit, Libre_Baskerville, JetBrains_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import HtmlLang from "@/components/shared/HtmlLang";
import CalendarChooser from "@/components/shared/CalendarChooser";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
        className={`${nunitoSans.variable} ${outfit.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <HtmlLang />
        <CalendarChooser />
        {children}
      </body>
    </html>
  );
}

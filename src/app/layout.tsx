import type { Metadata } from "next";
import { Outfit, Libre_Baskerville, JetBrains_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import HtmlLang from "@/components/shared/HtmlLang";

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
  title: "Rezervacija termina",
  description: "Spletno naročanje na termin prek Jedro+.",
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
        {children}
      </body>
    </html>
  );
}

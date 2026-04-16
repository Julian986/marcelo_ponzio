import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { BRAND_LOGO_SRC } from "@/components/brand-logo";
import { HOME_HERO_IMAGE_URL } from "@/lib/home-hero-image";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marceloestilista.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MP Estilista",
    template: "%s | MP Estilista",
  },
  description: "Reserva tu turno con Marcelo Ponzio",
  icons: {
    icon: [
      { url: "/favicon-32.png?v=1", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=1", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png?v=1", sizes: "180x180" },
    shortcut: "/favicon-32.png?v=1",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "MP Estilista",
    title: "MP Estilista - Marcelo Ponzio",
    description: "Reserva tu turno online",
    images: [{ url: "/og-image.jpg?v=1", width: 1200, height: 630, alt: "MP Estilista" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg?v=1"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preload" href={BRAND_LOGO_SRC} as="image" />
        <link rel="preload" href={HOME_HERO_IMAGE_URL} as="image" />
      </head>
      <body
        className={`${montserrat.variable} ${playfair.variable} min-h-screen bg-[#111111] text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

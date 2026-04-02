import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Marcelo Ponzio Estilista",
  description:
    "Peluquería y estilismo en Bahía Blanca. Color, corte, peinado y tratamientos capilares. Reservá tu turno en Marcelo Ponzio Estilista.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
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

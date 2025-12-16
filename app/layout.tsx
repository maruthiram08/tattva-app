import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Navigation } from "@/components/navigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: "Tattva - Ramayana AI",
  description: "Explore the intricate dharma, characters, and verses of the Ramayana through a text-grounded lens.",
  keywords: ["Ramayana", "Valmiki", "Sanskrit", "Dharma", "Hindu Scripture", "Adi Kavya"],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <div className="noise-bg"></div>
        <Navigation />
        {children}
      </body>
    </html>
  );
}

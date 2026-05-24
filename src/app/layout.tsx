import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UIProvider } from "@/components/UIProvider";

export const metadata: Metadata = {
  title: "Wif-Me – Pendamping Ibadah Umroh",
  description:
    "Temukan Muthawif terpercaya untuk perjalanan Umrah dan Haji Anda. Booking langsung, transparan, dan aman.",
  keywords: ["muthawif", "umrah mandiri", "haji", "makkah", "madinah", "booking muthawif"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wif-Me",
  },
  openGraph: {
    title: "Wif-Me – Temukan Muthawif Terpercaya",
    description: "Platform Pendamping Ibadah Umroh profesional untuk jamaah Umrah dan Haji mandiri.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B6B4A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><UIProvider>{children}</UIProvider></body>
    </html>
  );
}

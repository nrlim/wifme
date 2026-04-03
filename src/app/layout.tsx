import type { Metadata } from "next";
import "./globals.css";
import { UIProvider } from "@/components/UIProvider";

export const metadata: Metadata = {
  title: "Wif-Me – Marketplace Muthawif & Umrah Mandiri",
  description:
    "Temukan Muthawif terpercaya untuk perjalanan Umrah dan Haji Anda. Booking langsung, transparan, dan aman.",
  keywords: ["muthawif", "umrah mandiri", "haji", "makkah", "madinah", "booking muthawif"],
  openGraph: {
    title: "Wif-Me – Temukan Muthawif Terpercaya",
    description: "Platform marketplace Muthawif profesional untuk jamaah Umrah dan Haji mandiri.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body><UIProvider>{children}</UIProvider></body>
    </html>
  );
}

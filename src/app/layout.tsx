import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Günübirlik İş Bul — Konum Bazlı İş Platformu",
  description: "Türkiye'nin günübirlik iş bulma platformu. İnşaat, restoran, temizlik, nakliyat ve daha fazlası. Konumunu seç, hemen iş bul.",
  keywords: ["günübirlik iş", "günlük iş", "iş bulma", "konum bazlı iş", "part time", "geçici iş"],
  authors: [{ name: "Günübirlik İş Bul" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Günübirlik İş Bul",
    description: "Konum bazlı günübirlik iş bulma platformu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import ErudaInit from "@/components/eruda-init";
import OneSignalInit from "@/components/onesignal-init";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gunubirlik.space-z.ai"),
  title: {
    default: "Günübirlik — Günlük İş, Part-Time & Acil Yevmiyeli İş İlanları",
    template: "%s | Günübirlik",
  },
  description:
    "Türkiye'nin güvenilir konum bazlı günübirlik ve part-time iş platformu. Trabzon, İstanbul, Ankara ve tüm şehirlerde anında yevmiyeli iş bul, hızlıca başvur, aynı gün güvenle kazan.",
  keywords: [
    "günübirlik iş",
    "günlük iş ilanları",
    "part time iş",
    "yevmiyeli iş",
    "öğrenci ek iş",
    "trabzon günlük iş",
    "istanbul günlük iş",
    "ankara part time iş",
    "acil işçi bul",
    "garson günlük iş",
    "inşaat yevmiye",
    "günlük temizlik işi",
    "hızlı para kazanma",
    "güvenli emanet ödeme",
    "günübirlik iş bul",
  ],
  authors: [{ name: "Günübirlik Platformu", url: "https://gunubirlik.space-z.ai" }],
  creator: "Günübirlik",
  publisher: "Günübirlik",
  icons: {
    icon: [
      { url: "/favicon-32.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=5", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png?v=5", sizes: "64x64", type: "image/png" },
      { url: "/icon.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/logo.png?v=5", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=5", sizes: "any" },
    ],
    shortcut: "/favicon-32.png?v=5",
    apple: [
      { url: "/apple-touch-icon.png?v=5", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Günübirlik — Konum Bazlı Günlük ve Part-Time İş İlanları",
    description:
      "Trabzon, İstanbul ve tüm Türkiye'de günlük yevmiyeli iş fırsatları. Anında başvur, emanet ödeme güvencesiyle aynı gün kazan.",
    url: "https://gunubirlik.space-z.ai",
    siteName: "Günübirlik",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Günübirlik Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Günübirlik — Günlük ve Part-Time İş Bulma Platformu",
    description: "Konumuna en yakın günübirlik işleri haritada gör, hemen başvur, güvenle kazan.",
    creator: "@gunubirlikapp",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { OrganizationSchema, WebSiteSchema } from "@/components/shared/seo-schema";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Favicon & Web App Icons - Enlarged, Crisp & High-Priority */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=5" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=5" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png?v=5" />
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=5" />

        {/* Global SEO Structured Data */}
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SonnerToaster />
          <ErudaInit />
          <OneSignalInit />
        </ThemeProvider>
      </body>
    </html>
  );
}

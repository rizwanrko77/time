import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://time.rkospl.com'),
  title: {
    default: "TIME by RKOSPL - Allocate, track and share your availability with ease",
    template: "%s | TIME by RKOSPL",
  },
  description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page so others can see when you're free.",
  keywords: ["time management", "availability", "time tracking", "scheduling", "freelancer tools"],
  authors: [{ name: "RKOSPL", url: "https://rkospl.com" }],
  creator: "RKOSPL",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://time.rkospl.com",
    siteName: "TIME by RKOSPL",
    title: "TIME by RKOSPL - Allocate, track and share your availability with ease",
    description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page so others can see when you're free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TIME by RKOSPL - Allocate, track and share your availability with ease",
    description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/app-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="h-full">{children}</body>
    </html>
  );
}

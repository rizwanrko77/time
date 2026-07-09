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
  metadataBase: new URL('https://time.iamrizwan.com'),
  title: {
    default: "TIME - Allocate, track and share your availability with ease",
    template: "%s | TIME",
  },
  description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page so others can see when you're free.",
  keywords: ["time management", "availability", "time tracking", "scheduling", "freelancer tools"],
  authors: [{ name: "Rizwan", url: "https://iamrizwan.com" }],
  creator: "Rizwan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://time.iamrizwan.com",
    siteName: "TIME",
    title: "TIME - Allocate, track and share your availability with ease",
    description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page so others can see when you're free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TIME - Allocate, track and share your availability with ease",
    description: "Allocate your time across commitments, track hours with a built-in timer, and share a live availability page.",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}

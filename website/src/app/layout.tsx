import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { cloudinaryImage } from "@/lib/cloudinary/assets";
import { SiteAppearanceSync } from "@/components/site-appearance-sync";
import { GoogleAnalytics } from "@/components/google-analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://kitaristudios.web.app";
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kitari Studio",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description:
    "Kitari Studio builds thoughtful brands, websites, mobile apps, and digital products for startups and growing businesses.",
  email: "hello@kitaristudio.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Malang",
    addressCountry: "ID",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kitari Studio",
    template: "%s | Kitari Studio",
  },
  alternates: { canonical: "/" },
  description:
    "Kitari Studio builds thoughtful brands, websites, mobile apps, and digital products for startups and growing businesses.",
  openGraph: {
    title: "Kitari Studio — Brands and Digital Products",
    description:
      "Thoughtful design, development, and creative solutions for growing businesses.",
    type: "website",
    siteName: "Kitari Studio",
    url: siteUrl,
    images: [
      {
        url: cloudinaryImage("/images/rectangle-25.png"),
        alt: "Kitari Studio website design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kitari Studio — Brands and Digital Products",
    description:
      "Thoughtful design, development, and creative solutions for growing businesses.",
    images: [cloudinaryImage("/images/rectangle-25.png")],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteAppearanceSync />
        <GoogleAnalytics />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}

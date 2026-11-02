import type { Metadata } from "next";
import { Caveat, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./admin.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-admin-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-admin-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${instrumentSans.variable} ${caveat.variable} admin-root`}>
      {children}
    </div>
  );
}

import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Clash Damage Calculator",
    template: "%s | Clash Damage Calculator",
  },
  description:
    "An unofficial Clash of Clans damage planning tool for comparing upgrades and attacks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="tool-grid flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}


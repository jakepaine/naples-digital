import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BrandFrame, Nav } from "@naples/ui";
import "./globals.css";

const heading = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "239 Live — Sponsor Pitch Builder",
  description: "Generate a branded sponsorship one-pager in 30 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <BrandFrame>
          <Nav active="sponsorPitch" />
          {children}
        </BrandFrame>
      </body>
    </html>
  );
}

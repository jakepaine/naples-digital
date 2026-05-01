import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BrandFrame } from "@naples/ui";
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
  title: "239 Live — Sponsor Analytics",
  description: "Private analytics portal for 239 Live sponsors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <BrandFrame>{children}</BrandFrame>
      </body>
    </html>
  );
}

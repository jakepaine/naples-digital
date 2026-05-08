import type { Metadata } from "next";
import { Inter_Tight, Inter } from "next/font/google";
import { BrandFrame, NaplesNav } from "@naples/ui";
import "./globals.css";

const heading = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Naples Digital — Software infrastructure for service businesses",
  description: "Sales, content, and operations on a single platform. Bring your service business online with one integration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <BrandFrame>
          <NaplesNav />
          {children}
        </BrandFrame>
      </body>
    </html>
  );
}

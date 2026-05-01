import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { BrandFrame, Nav } from "@naples/ui";
import "./globals.css";

const heading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "239 Live System",
  description: "Naples Digital × 239 Live — Southwest Florida's Media Home",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <BrandFrame>
          <Nav active="agency" />
          {children}
        </BrandFrame>
      </body>
    </html>
  );
}

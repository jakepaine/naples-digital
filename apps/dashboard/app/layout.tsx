import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BrandFrame, Nav } from "@naples/ui";
import { Sidebar } from "@/components/Sidebar";
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
  title: "Kevin's Dashboard · 239 Live",
  description: "Operations hub for the entire 239 Live business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <BrandFrame>
          <Nav active="dashboard" />
          <div className="flex">
            <Sidebar />
            <div className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-x-hidden">
              {children}
            </div>
          </div>
        </BrandFrame>
      </body>
    </html>
  );
}

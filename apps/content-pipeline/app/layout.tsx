import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BrandFrame, Nav, TenantBrandProvider } from "@naples/ui";
import { getServerTenant } from "@naples/db/next";
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
  title: "Content Pipeline",
  description: "Multi-tenant podcast pipeline — upload, transcribe, clip, render.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getServerTenant();
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <TenantBrandProvider value={{
          tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, brand: tenant.brand,
        }}>
          <BrandFrame>
            <Nav active="content" />
            {children}
          </BrandFrame>
        </TenantBrandProvider>
      </body>
    </html>
  );
}

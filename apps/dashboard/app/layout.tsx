import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BrandFrame, TenantBrandProvider } from "@naples/ui";
import { getServerTenant } from "@naples/db/next";
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
  title: "Operator Dashboard · Naples Digital",
  description: "Multi-tenant operations hub",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getServerTenant();
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <TenantBrandProvider value={{
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
          brand: tenant.brand,
        }}>
          <BrandFrame>
            <div className="flex">
              <Sidebar />
              <div className="min-h-screen flex-1 overflow-x-hidden">
                {children}
              </div>
            </div>
          </BrandFrame>
        </TenantBrandProvider>
      </body>
    </html>
  );
}

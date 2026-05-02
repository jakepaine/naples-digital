"use client";
import { createContext, useContext, type ReactNode } from "react";

export type TenantBrand = {
  logo_url?: string;
  primary_color?: string;
  font_display?: string;
  font_body?: string;
  caption_style?: string;
};

export type TenantBrandValue = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  brand: TenantBrand;
};

const DEFAULT_BRAND: TenantBrand = {
  primary_color: "#E8192C",
  font_display: "Bebas Neue",
  font_body: "Inter",
  caption_style: "broadcast",
};

const TenantBrandContext = createContext<TenantBrandValue>({
  tenantId: "",
  tenantSlug: "239live",
  tenantName: "239 Live",
  brand: DEFAULT_BRAND,
});

export function TenantBrandProvider({
  value,
  children,
}: {
  value: TenantBrandValue;
  children: ReactNode;
}) {
  const brand = { ...DEFAULT_BRAND, ...value.brand };
  return (
    <TenantBrandContext.Provider value={{ ...value, brand }}>
      <div
        data-tenant={value.tenantSlug}
        style={{
          // CSS vars consumed by tailwind-preset.ts (gold/live tokens) and any inline styles
          "--brand-primary": brand.primary_color,
          "--brand-font-display": brand.font_display,
          "--brand-font-body": brand.font_body,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </TenantBrandContext.Provider>
  );
}

export function useTenantBrand(): TenantBrandValue {
  return useContext(TenantBrandContext);
}

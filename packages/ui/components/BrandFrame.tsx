import { ReactNode } from "react";

export function BrandFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg font-body text-cream antialiased">
      {children}
    </div>
  );
}

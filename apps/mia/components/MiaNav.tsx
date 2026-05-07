"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Building2, MapPin, Map, Users, Wallet, Inbox, LayoutDashboard } from "lucide-react";

const ACCENT = "#8A6BB8"; // MIA violet (mirrors tenants.brand.accent_color)

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/deals", label: "On-market", icon: Building2 },
  { href: "/off-market", label: "Off-market", icon: MapPin },
  { href: "/submarkets", label: "Submarkets", icon: Map },
  { href: "/students", label: "Students", icon: Users },
  { href: "/investors", label: "Investors", icon: Wallet },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

export function MiaNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/login")) return null;
  return (
    <nav className="border-b border-card-border bg-bg/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full" style={{ background: ACCENT }} />
          <div className="font-heading text-2xl tracking-broadcast text-cream">MIA</div>
          <div className="hidden text-[10px] uppercase tracking-[0.18em] text-muted md:inline">
            Acquisition Tools
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                  active ? "text-cream" : "text-muted hover:text-cream"
                )}
                style={active ? { borderBottom: `2px solid ${ACCENT}` } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Video,
  CircleDollarSign,
  Mail,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useTenantBrand } from "@naples/ui";

const ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/crm", label: "Lead Management", icon: Users },
  { href: "/content", label: "Content Pipeline", icon: Video },
  { href: "/revenue", label: "Revenue & Commissions", icon: CircleDollarSign },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  const { tenantName, brand } = useTenantBrand();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-card-border bg-bg lg:block">
      <div className="px-6 py-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Operations</div>
        <div className="mt-1 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5"
            style={{ background: brand.primary_color }}
          />
          <div className="font-heading text-xl text-cream">{tenantName}</div>
        </div>
        <div className="mt-1 text-xs" style={{ color: brand.primary_color }}>Operator Dashboard</div>
      </div>
      <nav className="px-3 pb-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-card text-gold"
                  : "text-muted hover:bg-card hover:text-cream"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, FileSignature, Receipt, Film } from "lucide-react";

interface Props {
  email: string;
  unsigned: number;
  openInvoices: number;
}

export function PortalNav({ email, unsigned, openInvoices }: Props) {
  const pathname = usePathname();
  const base = `/portal/${email}`;
  const items = [
    { href: base, label: "Overview", icon: LayoutDashboard, badge: 0 },
    { href: `${base}/contracts`, label: "Contracts", icon: FileSignature, badge: unsigned },
    { href: `${base}/invoices`, label: "Invoices", icon: Receipt, badge: openInvoices },
    { href: `${base}/content`, label: "Content", icon: Film, badge: 0 },
  ];
  return (
    <nav className="mx-auto max-w-7xl px-6">
      <div className="flex gap-1 border-t border-card-border/40 pt-1">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== base && pathname?.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "relative flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-wider transition-colors",
                active ? "text-cream" : "text-muted hover:text-cream"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {it.label}
              {it.badge > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-live px-1 text-[9px] font-bold text-bg">
                  {it.badge}
                </span>
              )}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-live" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

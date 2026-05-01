"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { APP_URLS } from "@naples/mock-data";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/shows", label: "Shows" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border bg-bg-deep/95 backdrop-blur supports-[backdrop-filter]:bg-bg-deep/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          <span className="font-heading text-xl tracking-broadcast text-cream">
            239<span className="text-live"> </span>LIVE
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted md:inline">
            Naples · Est. 2024
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    "relative px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                    active ? "text-cream" : "text-muted hover:text-cream"
                  )}
                >
                  {l.label}
                  {active && <span className="absolute bottom-0 left-3 right-3 h-px bg-live" />}
                </Link>
              );
            })}
          </div>
          <Link
            href={APP_URLS.booking}
            className="ml-2 inline-flex items-center bg-live px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-bg transition-colors hover:bg-cream"
          >
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

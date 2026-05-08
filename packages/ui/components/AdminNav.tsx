"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ActiveKey = "tenants" | "modules" | "backlog";

interface AdminNavProps {
  /** Override auto-detection from pathname. */
  active?: ActiveKey;
  /** Which app this nav is rendering in. Used as fallback when pathname doesn't disambiguate (backlog has no path-based hint). */
  app?: "admin-console" | "backlog";
}

const ADMIN_CONSOLE_URL = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || "https://admin-console-production-12e2.up.railway.app";
const BACKLOG_URL = process.env.NEXT_PUBLIC_BACKLOG_URL || "https://backlog-production-2a84.up.railway.app";

const LINKS: { key: ActiveKey; label: string; href: string }[] = [
  { key: "tenants", label: "Tenants", href: ADMIN_CONSOLE_URL },
  { key: "modules", label: "Modules", href: `${ADMIN_CONSOLE_URL}/modules` },
  { key: "backlog", label: "Backlog", href: BACKLOG_URL },
];

function detectActive(pathname: string | null, app: AdminNavProps["app"]): ActiveKey | undefined {
  if (app === "backlog") return "backlog";
  if (!pathname) return undefined;
  if (pathname.startsWith("/modules")) return "modules";
  if (pathname === "/" || pathname.startsWith("/tenants")) return "tenants";
  return undefined;
}

export function AdminNav({ active, app }: AdminNavProps) {
  const pathname = usePathname();
  const resolved = active ?? detectActive(pathname, app);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href={ADMIN_CONSOLE_URL} className="group flex items-center gap-3">
          <span className="font-heading text-xl tracking-broadcast text-cream">
            Naples<span className="text-gold"> </span>Digital
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted md:inline">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = resolved === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                className={`relative px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  isActive ? "text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

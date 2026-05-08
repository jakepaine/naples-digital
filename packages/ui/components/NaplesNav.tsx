"use client";
import Link from "next/link";

interface NaplesNavProps {
  active?: "home" | "pricing" | "modules" | "contact";
}

const ADMIN_CONSOLE_URL = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || "https://admin-console-production-12e2.up.railway.app";
const CLIENT_PORTAL_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "https://client-portal-production-0b14.up.railway.app";

const LINKS: { key: NonNullable<NaplesNavProps["active"]>; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "modules", label: "Modules", href: "/modules" },
  { key: "contact", label: "Contact", href: "/contact" },
];

export function NaplesNav({ active }: NaplesNavProps) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-heading text-2xl tracking-broadcast text-cream">
            Naples<span className="text-gold"> </span>Digital
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
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
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={CLIENT_PORTAL_URL}
            className="hidden border border-card-border px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-cream transition-colors hover:border-gold hover:text-gold md:inline-block"
          >
            Tenant Login
          </a>
          <a
            href={ADMIN_CONSOLE_URL}
            className="border border-gold bg-gold px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-bg transition-colors hover:bg-gold-dim hover:border-gold-dim"
          >
            Admin Login
          </a>
        </div>
      </div>
    </nav>
  );
}

"use client";
import Link from "next/link";

interface NaplesNavProps {
  active?: "home" | "pricing" | "modules" | "contact";
}

const ADMIN_CONSOLE_URL = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || "https://admin-console-production-12e2.up.railway.app";
const CLIENT_PORTAL_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "https://client-portal-production-0b14.up.railway.app";

const LINKS: { key: NonNullable<NaplesNavProps["active"]>; label: string; href: string }[] = [
  { key: "modules", label: "Products", href: "/modules" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "contact", label: "Company", href: "/contact" },
];

export function NaplesNav({ active }: NaplesNavProps) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border/60 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-grad-amber via-gold to-grad-bronze shadow-soft">
            <span className="font-heading text-sm font-bold text-white">N</span>
          </div>
          <span className="font-heading text-[15px] font-semibold tracking-tight text-cream">
            Naples Digital
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-cream"
                    : "text-body hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <a
            href={CLIENT_PORTAL_URL}
            className="hidden text-sm font-medium text-body transition-colors hover:text-cream md:inline-block"
          >
            Sign in
          </a>
          <a
            href="mailto:jake@naples.digital?subject=Naples Digital Demo"
            className="group inline-flex items-center gap-1 rounded-full bg-cream px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-ink-deep hover:shadow-soft"
          >
            Contact sales
            <svg
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href={ADMIN_CONSOLE_URL}
            className="hidden text-xs text-faint transition-colors hover:text-gold lg:inline-block"
            title="Operator login"
          >
            Admin
          </a>
        </div>
      </div>
    </nav>
  );
}

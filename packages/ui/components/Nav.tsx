import Link from "next/link";
import { APP_URLS } from "@naples/mock-data";

interface NavProps {
  active?: "site" | "booking" | "dashboard" | "agency" | "outreach" | "crm" | "content";
}

const LINKS: { key: NonNullable<NavProps["active"]>; label: string; href: string }[] = [
  { key: "site", label: "Studio", href: APP_URLS.site },
  { key: "booking", label: "Book", href: APP_URLS.booking },
  { key: "dashboard", label: "Dashboard", href: APP_URLS.dashboard },
  { key: "crm", label: "CRM", href: APP_URLS.crm },
  { key: "content", label: "Content", href: APP_URLS.content },
  { key: "outreach", label: "Outreach", href: APP_URLS.outreach },
  { key: "agency", label: "Naples Digital", href: APP_URLS.agency },
];

export function Nav({ active }: NavProps) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          href={APP_URLS.site}
          className="font-heading text-base tracking-[0.18em] text-cream"
        >
          239<span className="text-gold"> · </span>LIVE SYSTEM
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const isActive = active === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-gold"
                    : "text-muted hover:text-cream"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

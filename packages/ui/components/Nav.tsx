import Link from "next/link";
import { APP_URLS } from "@naples/mock-data";

interface NavProps {
  active?: "site" | "booking" | "dashboard" | "agency" | "outreach" | "crm" | "content" | "sponsorPitch" | "sponsorAnalytics";
}

const LINKS: { key: NonNullable<NavProps["active"]>; label: string; href: string }[] = [
  { key: "site", label: "Studio", href: APP_URLS.site },
  { key: "booking", label: "Book", href: APP_URLS.booking },
  { key: "dashboard", label: "Dashboard", href: APP_URLS.dashboard },
  { key: "crm", label: "Leads", href: APP_URLS.crm },
  { key: "content", label: "Content", href: APP_URLS.content },
  { key: "outreach", label: "Outreach", href: APP_URLS.outreach },
  { key: "sponsorPitch", label: "Sponsor Pitch", href: APP_URLS.sponsorPitch },
  { key: "agency", label: "Naples Digital", href: APP_URLS.agency },
];

export function Nav({ active }: NavProps) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-card-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href={APP_URLS.site} className="group flex items-center gap-3">
          {/* LIVE tally indicator — red blinking dot, broadcast tradition */}
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          <span className="font-heading text-xl tracking-broadcast text-cream">
            239<span className="text-live"> </span>LIVE
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted md:inline">
            Broadcast System
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const isActive = active === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                className={`relative px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  isActive
                    ? "text-cream"
                    : "text-muted hover:text-cream"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-live" />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

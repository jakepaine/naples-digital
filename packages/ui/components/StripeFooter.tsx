import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Products",
    links: [
      { label: "All modules", href: "/modules" },
      { label: "Pricing", href: "/pricing" },
      { label: "CRM", href: "/modules#sales" },
      { label: "Booking", href: "/modules#sales" },
      { label: "Outreach", href: "/modules#sales" },
      { label: "Content engine", href: "/modules#content" },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { label: "Podcast networks", href: "/modules#vertical" },
      { label: "Real estate", href: "/modules#vertical" },
      { label: "Event businesses", href: "/modules#vertical" },
      { label: "Service firms", href: "/modules#vertical" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/contact" },
      { label: "Support", href: "mailto:jake@naples.digital" },
      { label: "Status", href: "/contact" },
      { label: "Roadmap", href: "/modules" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/contact" },
      { label: "Customers", href: "/contact" },
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "https://client-portal-production-0b14.up.railway.app" },
    ],
  },
];

export function StripeFooter() {
  return (
    <footer className="border-t border-card-border bg-bg-deep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Top: logo + columns */}
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-grad-amber via-gold to-grad-bronze shadow-soft">
                <span className="font-heading text-sm font-bold text-white">N</span>
              </div>
              <span className="font-heading text-[15px] font-semibold tracking-tight text-cream">
                Naples Digital
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-body">
              Software infrastructure for service businesses. Sales, content, and operations on a single platform.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:jake@naples.digital"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-card-border text-body transition-colors hover:border-gold hover:text-gold"
                aria-label="Email"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-cream">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("http") || l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="text-sm text-body transition-colors hover:text-cream">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-sm text-body transition-colors hover:text-cream">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: fine print */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-card-border py-8 text-xs text-faint">
          <div>© {new Date().getFullYear()} Naples Digital · Purity Goat LLC · Naples, FL</div>
          <div className="flex flex-wrap gap-5">
            <Link href="/contact" className="hover:text-cream">Privacy</Link>
            <Link href="/contact" className="hover:text-cream">Terms</Link>
            <a href="mailto:jake@naples.digital" className="hover:text-cream">jake@naples.digital</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

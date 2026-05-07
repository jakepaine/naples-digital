import { Card, Badge } from "@naples/ui";

export function StubPage({
  title,
  subtitle,
  bullets,
  next,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  next: string;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-8">
      <header className="mb-6 flex items-center gap-3">
        <h1 className="font-heading text-5xl tracking-broadcast text-cream">{title}</h1>
        <Badge tone="muted">soon</Badge>
      </header>
      <div className="mb-6 h-px w-16" style={{ background: "#8A6BB8" }} />
      <Card>
        <div className="text-sm text-cream">{subtitle}</div>
        <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted">What this will do</div>
        <ul className="mt-2 space-y-1 text-sm text-cream/80">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: "#8A6BB8" }}>·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 text-[10px] uppercase tracking-[0.18em] text-muted">Next session</div>
        <p className="mt-1 text-xs text-muted">{next}</p>
      </Card>
    </main>
  );
}

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">239 Live · Sponsor Portal</div>
      <h1 className="mt-3 font-heading text-4xl text-cream">Private Analytics</h1>
      <div className="mx-auto mt-3 h-px w-16 bg-gold" />
      <p className="mt-6 text-sm text-cream/70">
        This is the sponsor-only analytics portal for 239 Live Studios. Each sponsor
        receives a private magic link from Kevin that opens to their personalized
        dashboard with weekly impressions, clip plays, and brand mentions.
      </p>
      <p className="mt-4 text-xs text-muted">
        If you have a magic link, it looks like <code className="text-gold/80">/s/&lt;token&gt;</code>.
        If you're a 239 Live partner and don't have one yet, ask Kevin.
      </p>
    </main>
  );
}

"use client";
import { useState } from "react";
import { Card, Button, Badge } from "@naples/ui";
import { Sparkles, Copy, Check, Mail } from "lucide-react";

const BUSINESS_TYPES = [
  "Real Estate Agent",
  "Financial Advisor",
  "Local Restaurant",
  "Corporate Business",
  "Content Creator",
  "Podcaster",
  "Event Company",
  "Luxury Brand",
  "Home Builder",
  "Private Equity",
  "Yacht Charter",
];

const OUTREACH_GOALS = [
  "Studio Rental Client",
  "Bronze Sponsor $300/show",
  "Silver Sponsor $500/show",
  "Gold Sponsor $1,000/show",
];

interface Email {
  subject: string;
  body: string;
}

interface Sequence {
  email1: Email;
  email2: Email;
  email3: Email;
  source?: string;
}

export function Generator() {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [outreachGoal, setOutreachGoal] = useState(OUTREACH_GOALS[0]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<number>(0);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setLoading(true);
    setSequence(null);
    setRevealed(0);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), businessType, outreachGoal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Sequence = await res.json();
      setSequence(data);
      // Stagger the email reveal for a "streaming in" feel.
      [1, 2, 3].forEach((n) => {
        setTimeout(() => setRevealed(n), n * 600);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
          <Sparkles className="h-3 w-3 text-gold" /> Naples Digital × Anthropic Claude Sonnet 4.6
        </div>
        <h1 className="font-heading text-5xl text-cream md:text-6xl">AI Outreach Engine</h1>
        <div className="mx-auto mt-3 h-px w-16 bg-gold" />
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted">
          Type a business name. Watch the system build a complete outreach sequence — personalized to the
          industry, the SWFL market, and the 239 Live offer stack.
        </p>
      </header>

      <Card className="mt-10">
        <form onSubmit={handleGenerate} className="grid gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Naples Luxury Realty"
              className="mt-2 w-full border border-card-border bg-bg px-4 py-3 text-cream placeholder:text-muted focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-2 w-full border border-card-border bg-bg px-4 py-3 text-cream focus:border-gold focus:outline-none"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted">Outreach Goal</label>
              <select
                value={outreachGoal}
                onChange={(e) => setOutreachGoal(e.target.value)}
                className="mt-2 w-full border border-card-border bg-bg px-4 py-3 text-cream focus:border-gold focus:outline-none"
              >
                {OUTREACH_GOALS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading || !businessName.trim()} size="lg" className="mt-2 w-full">
            {loading ? "Building your sequence..." : "Generate Sequence"}
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" style={{ animationDelay: "0s" }} />
            <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" style={{ animationDelay: "0.2s" }} />
            <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" style={{ animationDelay: "0.4s" }} />
          </div>
          <span className="text-sm text-muted">Researching {businessName} · drafting sequence...</span>
        </div>
      )}

      {error && (
        <div className="mt-10 border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
          Error: {error}
        </div>
      )}

      {sequence && (
        <div className="mt-10 space-y-6">
          {[1, 2, 3].map((n) => {
            const email = sequence[`email${n}` as keyof Sequence] as Email;
            const day = [1, 4, 8][n - 1];
            const visible = revealed >= n;
            return (
              <div
                key={n}
                className={`transition-all duration-500 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <EmailCard email={email} day={day} index={n} />
              </div>
            );
          })}
          {sequence.source && revealed >= 3 && (
            <div className="text-center text-[11px] text-muted">
              {sequence.source === "anthropic" && (
                <Badge tone="gold">Generated live by Claude Sonnet 4.6</Badge>
              )}
              {sequence.source === "mock" && (
                <Badge tone="muted">Generated by deterministic template engine</Badge>
              )}
              {sequence.source === "mock-fallback" && (
                <Badge tone="amber">Template fallback — Claude API unreachable</Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmailCard({ email, day, index }: { email: Email; day: number; index: number }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-gold bg-gold/10 text-[10px] font-medium uppercase tracking-wider text-gold">
            D{day}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted">Email {index} · Day {day}</div>
            <div className="font-heading text-lg text-gold">{email.subject}</div>
          </div>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded border border-card-border px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-gold hover:text-gold"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Email"}
        </button>
      </div>
      <div className="mt-5 whitespace-pre-line border-t border-card-border pt-5 text-sm leading-relaxed text-cream">
        {email.body}
      </div>
    </Card>
  );
}

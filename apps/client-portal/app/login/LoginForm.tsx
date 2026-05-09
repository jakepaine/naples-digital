"use client";

import { useState } from "react";
import { Button } from "@naples/ui";
import { Mail, ArrowRight } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-auth";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const sb = createBrowserSupabase();
      const callback = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      const { error: err } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callback },
      });
      if (err) throw err;
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✓ Check <span className="font-mono">{email}</span> for your magic link.
        It expires in 1 hour.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 w-full">
      <label className="text-[10px] uppercase tracking-[0.18em] text-muted">
        Email on file
      </label>
      <div className="mt-2 flex items-center gap-2 border border-card-border bg-bg px-3 py-3">
        <Mail className="h-4 w-4 text-muted" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          required
          className="w-full bg-transparent text-sm text-cream placeholder:text-muted/60 focus:outline-none"
          autoComplete="email"
          autoFocus
        />
      </div>
      <Button type="submit" disabled={busy || !email.trim()} className="mt-4 w-full">
        {busy ? "Sending…" : "Send magic link"}{" "}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
    </form>
  );
}

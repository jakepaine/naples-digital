"use client";
import { useState } from "react";
import { Button } from "@naples/ui";

export function LoginForm() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Invalid password");
        setBusy(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("from") ?? "/";
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Operator password"
        autoFocus
        className="w-full border border-card-border bg-bg/60 px-4 py-3 text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
      />
      {err && <div className="text-xs text-rose-400">{err}</div>}
      <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Enter Console"}</Button>
    </form>
  );
}

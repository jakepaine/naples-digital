"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@naples/ui";

export function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primary, setPrimary] = useState("#E8192C");
  const [plan, setPlan] = useState<"starter" | "pro" | "agency">("starter");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoSlug(v: string) {
    setName(v);
    if (!slug) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          plan,
          brand: { primary_color: primary, font_display: "Bebas Neue", font_body: "Inter" },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Failed to create");
        setBusy(false);
        return;
      }
      const j = await res.json();
      router.push(`/tenants/${j.tenant.id}`);
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <div className="space-y-5">
          <Field label="Company name">
            <input
              required
              value={name}
              onChange={(e) => autoSlug(e.target.value)}
              placeholder="Bonita Bay Group"
              className="w-full border border-card-border bg-bg/60 px-4 py-3 text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
          </Field>
          <Field label="URL slug" hint="lowercase, dashes; used in subdomain and /t/<slug>/ URLs">
            <input
              required
              pattern="[a-z0-9][a-z0-9-]*"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="bonitabay"
              className="w-full border border-card-border bg-bg/60 px-4 py-3 font-mono text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
          </Field>
          <Field label="Brand primary color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-16 cursor-pointer border border-card-border bg-bg/60"
              />
              <input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 border border-card-border bg-bg/60 px-4 py-3 font-mono text-sm text-cream focus:border-gold/60 focus:outline-none"
              />
            </div>
          </Field>
          <Field label="Plan">
            <div className="grid grid-cols-3 gap-2">
              {(["starter","pro","agency"] as const).map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPlan(p)}
                  className={`border px-4 py-3 text-sm uppercase tracking-wider ${plan === p ? "border-gold bg-gold/10 text-gold" : "border-card-border text-cream/70"}`}
                >{p}</button>
              ))}
            </div>
          </Field>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </div>
      </Card>
      <div className="mt-6"><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create tenant"}</Button></div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

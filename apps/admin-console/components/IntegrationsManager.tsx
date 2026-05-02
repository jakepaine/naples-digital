"use client";
import { useState } from "react";
import { Card, Badge, Button } from "@naples/ui";

type Vendor = { kind: string; label: string; category: string; help: string };
type Existing = { id: string; kind: string; status: string; secret_ref: string | null; config: Record<string, unknown>; last_verified_at: string | null } | null;

export function IntegrationsManager({
  tenantId,
  vendor,
  existing,
}: {
  tenantId: string;
  vendor: Vendor;
  existing: Existing;
}) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [extraConfig, setExtraConfig] = useState("");
  const [status, setStatus] = useState(existing?.status ?? "pending");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true); setErr(null);
    try {
      const config = extraConfig.trim() ? JSON.parse(extraConfig) : (existing?.config ?? {});
      const res = await fetch(`/api/tenants/${tenantId}/integrations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: vendor.kind,
          secret: secret || undefined,
          config,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed to save");
        setBusy(false);
        return;
      }
      setStatus(j.integration.status);
      setSecret("");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  const tone = status === "verified" ? "emerald" as const
    : status === "failed" ? "rose" as const
    : status === "disabled" ? "muted" as const
    : "amber" as const;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-heading text-xl tracking-broadcast text-cream">{vendor.label}</div>
              <Badge tone={tone}>{status}</Badge>
              <span className="text-[10px] uppercase tracking-wider text-muted">{vendor.category}</span>
            </div>
            <div className="mt-1 text-xs text-muted">{vendor.help}</div>
            {existing && existing.last_verified_at && (
              <div className="mt-1 text-[11px] text-muted">Last verified {new Date(existing.last_verified_at).toLocaleString()}</div>
            )}
          </div>
        </div>
        <Button onClick={() => setOpen(o => !o)}>{existing ? "Update" : "Configure"}</Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-card-border pt-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted">API key</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={existing?.secret_ref ? "•••••••••••• (set — paste new value to replace)" : "paste key…"}
              className="w-full border border-card-border bg-bg/60 px-3 py-2 font-mono text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted">Extra config (JSON, optional)</label>
            <textarea
              rows={3}
              value={extraConfig}
              onChange={(e) => setExtraConfig(e.target.value)}
              placeholder='{"campaign_id": "...", "workspace": "..."}'
              className="w-full border border-card-border bg-bg/60 px-3 py-2 font-mono text-xs text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
          </div>
          {err && <div className="text-xs text-rose-400">{err}</div>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button onClick={() => { setOpen(false); setErr(null); }} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

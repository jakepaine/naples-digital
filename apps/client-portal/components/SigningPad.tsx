"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@naples/ui";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

interface Props {
  contractId: string;
  email: string;
  defaultName: string;
}

export function SigningPad({ contractId, email, defaultName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [adopted, setAdopted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 3)
    .join("");

  async function adopt() {
    if (!name.trim()) return;
    setAdopted(true);
  }

  async function sign() {
    if (!adopted || signing) return;
    setSigning(true);
    try {
      await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, initials, typed: name }),
      });
      setDone(true);
      // Refresh server-rendered contract page
      setTimeout(() => router.refresh(), 600);
    } catch {
      // ignore
    } finally {
      setSigning(false);
    }
  }

  if (done) {
    return (
      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald" />
          <div>
            <div className="font-heading text-2xl tracking-broadcast text-cream">Contract Signed</div>
            <div className="mt-1 text-xs text-muted">Both parties have been notified. Refreshing…</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.18em] text-live">Step 1 · Adopt Your Signature</div>
      <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Sign Electronically</h2>
      <p className="mt-2 text-xs text-muted">
        Type your full legal name. We'll generate your signature and initials. By adopting,
        you agree your typed signature is the legal equivalent of a handwritten one (ESIGN Act).
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">Full Legal Name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setAdopted(false); }}
            className="mt-1.5 w-full border border-card-border bg-bg px-3 py-2.5 text-sm text-cream focus:border-live focus:outline-none"
            placeholder="e.g., David Kessler"
          />
          <div className="mt-3 border border-card-border bg-bg/60 p-6 text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted">Signature Preview</div>
            <div className="mt-2 font-signature text-5xl text-cream">
              {name || "Your name"}
            </div>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted">Initials</label>
          <div className="mt-1.5 flex h-[42px] items-center border border-card-border bg-bg px-3 text-sm text-cream">
            {initials || "—"}
          </div>
          <div className="mt-3 flex h-[124px] items-center justify-center border border-card-border bg-bg/60 p-4 text-center">
            <div className="font-signature text-4xl text-cream">{initials || "??"}</div>
          </div>
        </div>
      </div>

      {!adopted ? (
        <div className="mt-6 flex justify-end">
          <Button onClick={adopt} disabled={!name.trim()}>
            <Sparkles className="mr-2 h-4 w-4" /> Adopt and Continue
          </Button>
        </div>
      ) : (
        <div className="mt-8 border-t border-card-border pt-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Step 2 · Click to Sign</div>
          <p className="mt-2 text-xs text-muted">
            By clicking the button below, you certify you've read and agree to all terms in this agreement.
          </p>
          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
              <ShieldCheck className="h-4 w-4 text-live" />
              ESIGN Act compliant · audit trail logged
            </div>
            <Button onClick={sign} disabled={signing} className="w-full sm:w-auto">
              {signing ? "Signing…" : "Click to Sign"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

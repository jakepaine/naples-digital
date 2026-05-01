"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@naples/ui";
import { CreditCard, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  invoiceId: string;
  amount: number;
  number: string;
}

export function PayInvoice({ invoiceId, amount, number }: Props) {
  const router = useRouter();
  const [num, setNum] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("04/29");
  const [cvc, setCvc] = useState("123");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function pay() {
    setSubmitting(true);
    try {
      // Simulate Stripe charge latency
      await new Promise((r) => setTimeout(r, 1200));
      await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "card" }),
      });
      setDone(true);
      setTimeout(() => router.refresh(), 600);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald" />
          <div>
            <div className="font-heading text-2xl tracking-broadcast text-cream">Payment Received</div>
            <div className="mt-1 text-xs text-muted">${amount.toLocaleString()} · {number} · refreshing receipt…</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Pay Now</div>
          <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Secure Checkout</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
          <Lock className="h-3 w-3 text-live" /> Powered by Stripe
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Field label="Card Number">
          <div className="flex items-center gap-2 border border-card-border bg-bg px-3 py-2.5">
            <CreditCard className="h-4 w-4 text-muted" />
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              className="w-full bg-transparent text-sm text-cream focus:outline-none"
              placeholder="4242 4242 4242 4242"
            />
            <div className="text-[10px] uppercase tracking-wider text-muted">Visa</div>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiration">
            <input
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              className={inputCls}
              placeholder="MM/YY"
            />
          </Field>
          <Field label="CVC">
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className={inputCls}
              placeholder="123"
            />
          </Field>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <ShieldCheck className="h-4 w-4 text-live" />
          PCI-compliant · ACH and wire also available
        </div>
        <Button
          onClick={pay}
          disabled={submitting}
          className={clsx("w-full sm:w-auto")}
        >
          {submitting ? "Processing…" : `Pay $${amount.toLocaleString()}`}
        </Button>
      </div>
    </Card>
  );
}

const inputCls = "w-full border border-card-border bg-bg px-3 py-2.5 text-sm text-cream focus:border-live focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Card, Button } from "@naples/ui";
import { X } from "lucide-react";

export function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [goal, setGoal] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email: email || undefined,
          type: type || undefined,
          goal: goal || undefined,
          value: value ? Number(value) : 0,
          source: "Manual",
        }),
      });
      if (!res.ok) {
        setErr((await res.json().catch(() => ({}))).error ?? "Create failed");
        setBusy(false);
        return;
      }
      const j = await res.json();
      onCreated(j.lead.id);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-gold">New Lead</div>
              <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Add to Pipeline</h2>
            </div>
            <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input label="Name" value={name} onChange={setName} required />
            <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="optional" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Type" value={type} onChange={setType} placeholder="Real Estate" />
              <Input label="Deal value $" value={value} onChange={setValue} type="number" placeholder="2500" />
            </div>
            <Input label="Goal" value={goal} onChange={setGoal} placeholder="Studio Rental" />
            {err && <div className="text-xs text-rose-400">{err}</div>}
            <div className="pt-2"><Button type="submit" disabled={busy || !name}>{busy ? "Saving…" : "Add Lead"}</Button></div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border border-card-border bg-bg/60 px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
      />
    </div>
  );
}

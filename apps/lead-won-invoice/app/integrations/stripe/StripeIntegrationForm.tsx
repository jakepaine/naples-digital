"use client";

import { useState } from "react";

interface InitialState {
  configured: boolean;
  status: string | null;
  last_verified_at: string | null;
  has_webhook_secret: boolean;
}

export function StripeIntegrationForm({
  initialState,
}: {
  initialState: InitialState;
}) {
  const [secret, setSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState(initialState);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret,
          webhook_secret: webhookSecret || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "save failed");
      setResult(`Saved (${json.mode} mode).`);
      setSecret("");
      setWebhookSecret("");
      setState({
        configured: true,
        status: "verified",
        last_verified_at: new Date().toISOString(),
        has_webhook_secret: !!webhookSecret,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {state.configured && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <div>
            <span className="font-semibold">Connected.</span> Status:{" "}
            <span className="font-mono">{state.status}</span>
            {state.has_webhook_secret && " · webhook secret configured"}
          </div>
          {state.last_verified_at && (
            <div className="text-xs text-emerald-700 mt-1">
              Last verified {new Date(state.last_verified_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        <label className="block text-sm">
          <span className="font-semibold">Stripe Secret Key</span>
          <input
            type="password"
            placeholder="sk_live_… or sk_test_…"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">
            Webhook Signing Secret <span className="text-gray-500">(optional, for invoice.paid)</span>
          </span>
          <input
            type="password"
            placeholder="whsec_…"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button
          type="submit"
          disabled={busy || secret.length < 20}
          className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
        >
          {busy ? "Saving…" : state.configured ? "Rotate key" : "Save"}
        </button>
        {result && (
          <div className="text-sm text-emerald-700">{result}</div>
        )}
        {error && <div className="text-sm text-red-700">{error}</div>}
      </form>
    </div>
  );
}

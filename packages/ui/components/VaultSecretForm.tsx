"use client";

import * as React from "react";

export interface VaultSecretField {
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  /** Optional regex the value must match (validated client-side). */
  pattern?: RegExp;
  required?: boolean;
}

export interface VaultSecretFormProps {
  /** Display name of the integration ("Stripe", "Anymailfinder", etc.) */
  vendorName: string;
  /** Endpoint that accepts POST { secret, ...extraFields } and writes via set_tenant_secret */
  endpoint: string;
  /** Primary secret field metadata (label, placeholder, validation) */
  primary: VaultSecretField;
  /** Extra optional fields stored in tenant_integrations.config */
  extras?: VaultSecretField[];
  /** Whether the form should display "Rotate key" instead of "Save" (already configured) */
  alreadyConfigured?: boolean;
  /** Callback after successful save — page typically reloads to refresh status */
  onSaved?: (response: any) => void;
}

/**
 * Generic paste-in-secret form for any vendor whose connection model is
 * "give us your API key, we'll store it in Vault." Used for Stripe (today),
 * Anymailfinder, PhantomBuster, Bland.ai, etc. (future).
 *
 * For OAuth-based integrations (Gmail, future LinkedIn/Twitter), use a
 * separate connect flow — this form is paste-in only.
 */
export function VaultSecretForm({
  vendorName,
  endpoint,
  primary,
  extras = [],
  alreadyConfigured = false,
  onSaved,
}: VaultSecretFormProps) {
  const [primaryValue, setPrimaryValue] = React.useState("");
  const [extraValues, setExtraValues] = React.useState<Record<string, string>>(
    Object.fromEntries(extras.map((e) => [e.name, ""])),
  );
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function setExtra(name: string, value: string) {
    setExtraValues((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): string | null {
    if (primary.required !== false && !primaryValue) {
      return `${primary.label} is required`;
    }
    if (primary.pattern && primaryValue && !primary.pattern.test(primaryValue)) {
      return `${primary.label} does not match required format`;
    }
    for (const extra of extras) {
      const v = extraValues[extra.name];
      if (extra.required && !v) return `${extra.label} is required`;
      if (extra.pattern && v && !extra.pattern.test(v)) {
        return `${extra.label} does not match required format`;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const body: Record<string, any> = { secret: primaryValue };
      for (const extra of extras) {
        if (extraValues[extra.name]) body[extra.name] = extraValues[extra.name];
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "save failed");
      setResult(`Saved.${json.mode ? ` (${json.mode} mode)` : ""}`);
      setPrimaryValue("");
      setExtraValues(Object.fromEntries(extras.map((e) => [e.name, ""])));
      onSaved?.(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="font-semibold">{primary.label}</span>
        <input
          type="password"
          placeholder={primary.placeholder}
          value={primaryValue}
          onChange={(e) => setPrimaryValue(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
          required={primary.required !== false}
        />
        {primary.helper && (
          <span className="text-xs text-gray-500 mt-1 block">{primary.helper}</span>
        )}
      </label>
      {extras.map((extra) => (
        <label key={extra.name} className="block text-sm">
          <span className="font-semibold">
            {extra.label}{" "}
            {!extra.required && (
              <span className="text-gray-500">(optional)</span>
            )}
          </span>
          <input
            type="password"
            placeholder={extra.placeholder}
            value={extraValues[extra.name] ?? ""}
            onChange={(e) => setExtra(extra.name, e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {extra.helper && (
            <span className="text-xs text-gray-500 mt-1 block">{extra.helper}</span>
          )}
        </label>
      ))}
      <button
        type="submit"
        disabled={busy || (primary.required !== false && !primaryValue)}
        className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
      >
        {busy
          ? "Saving…"
          : alreadyConfigured
            ? `Rotate ${vendorName} key`
            : `Save ${vendorName} key`}
      </button>
      {result && <div className="text-sm text-emerald-700">{result}</div>}
      {error && <div className="text-sm text-red-700">{error}</div>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { IntegrationStatusCard } from "@naples/ui";

interface Props {
  oauthAppConfigured: boolean;
  connection: {
    configured: boolean;
    status: string | null;
    email_address: string | null;
    last_verified_at: string | null;
  };
}

export function GmailSettingsForm({ oauthAppConfigured, connection }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDisconnect() {
    setBusy("disconnect");
    setError(null);
    try {
      const res = await fetch("/api/integrations/gmail", { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "disconnect failed");
      }
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  async function handleSync() {
    setBusy("sync");
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "gmail", maxResults: 25 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message ?? j.error ?? "sync failed");
      setInfo(
        `Pulled ${j.fetched ?? 0} from Gmail, ingested ${j.ingested ?? 0}.${j.errors?.length ? ` ${j.errors.length} error(s).` : ""}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!oauthAppConfigured) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        <div className="font-semibold">OAuth app not configured.</div>
        <div>
          You haven't set up the platform-level Google Cloud OAuth app yet.
          Follow the setup steps below, add the keys to Doppler, redeploy, and
          come back.
        </div>
      </div>
    );
  }

  if (connection.configured) {
    return (
      <div className="space-y-3">
        <IntegrationStatusCard
          name="Gmail"
          configured={true}
          status={connection.status}
          lastVerifiedAt={connection.last_verified_at}
          accountIdentifier={connection.email_address}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={!!busy}
            className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
          >
            {busy === "sync" ? "Syncing…" : "Pull last 7 days now"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={!!busy}
            className="px-4 py-2 border border-red-300 text-red-700 rounded text-sm disabled:opacity-50"
          >
            {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
        {info && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {info}
          </div>
        )}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <a
        href="/api/integrations/gmail/auth"
        className="inline-block px-4 py-2 bg-black text-white rounded text-sm"
      >
        Connect Gmail
      </a>
      <p className="text-xs text-gray-500">
        Opens Google's consent screen. We request{" "}
        <span className="font-mono">gmail.modify</span> scope (read + apply
        labels + archive). No send access.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { IntegrationStatusCard, VaultSecretForm } from "@naples/ui";
import type { ScrapeSourceKey } from "@/lib/sources/types";
import { SOURCE_VAULT_KIND } from "@/lib/sources";

const VENDORS: {
  key: ScrapeSourceKey;
  name: string;
  helper: string;
  acquireUrl: string;
}[] = [
  {
    key: "apify",
    name: "Apify",
    helper:
      "Same Apify token used by Competitor Spy and Lead Enrichment's LinkedIn discovery.",
    acquireUrl: "https://console.apify.com/settings/integrations",
  },
  {
    key: "apollo",
    name: "Apollo",
    helper:
      "Bulk-search via /api/v1/mixed_people/search. Free tier credits cap quickly — paid plan recommended for sustained scraping.",
    acquireUrl: "https://app.apollo.io/#/settings/integrations/api",
  },
  {
    key: "phantombuster",
    name: "PhantomBuster",
    helper:
      "Agent-based — uses your existing Phantoms. The agent_id in the job's params decides which Phantom runs.",
    acquireUrl: "https://app.phantombuster.com/api-keys",
  },
  {
    key: "vayne",
    name: "Vayne",
    helper:
      "Paste-a-Sales-Nav-URL workflow. Bring your own Vayne API key.",
    acquireUrl: "https://app.vayne.io/settings/api",
  },
];

export function IntegrationsPanel({
  initialStatus,
  onChange,
}: {
  initialStatus: Record<ScrapeSourceKey, boolean>;
  onChange: (next: Record<ScrapeSourceKey, boolean>) => void;
}) {
  const [status, setStatus] = useState(initialStatus);

  function markConfigured(key: ScrapeSourceKey) {
    setStatus((prev) => {
      const next = { ...prev, [key]: true };
      onChange(next);
      return next;
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <p className="text-sm text-gray-600">
        Each source is independent. Connect at least one — the rest stay in
        stub mode and the chain still runs end-to-end so you can preview
        shape. Keys live encrypted in Supabase Vault.
      </p>

      {VENDORS.map((v) => (
        <section key={v.key} className="space-y-3">
          <h2 className="text-lg font-semibold">{v.name}</h2>
          <IntegrationStatusCard
            name={v.name}
            configured={!!status[v.key]}
            status={status[v.key] ? "verified" : null}
          />
          <VaultSecretForm
            vendorName={v.name}
            endpoint={`/api/integrations/${SOURCE_VAULT_KIND[v.key]}`}
            primary={{
              name: "secret",
              label: `${v.name} API key`,
              placeholder: "Paste your API key…",
              helper: v.helper,
            }}
            alreadyConfigured={!!status[v.key]}
            onSaved={() => markConfigured(v.key)}
          />
          <div className="text-xs text-gray-500">
            Get your key:{" "}
            <a
              href={v.acquireUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {v.acquireUrl}
            </a>
          </div>
        </section>
      ))}
    </div>
  );
}

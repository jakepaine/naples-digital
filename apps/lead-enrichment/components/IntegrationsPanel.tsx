"use client";

import { useState } from "react";
import { IntegrationStatusCard, VaultSecretForm } from "@naples/ui";
import type { EnrichmentSourceKey } from "@/lib/sources/types";
import { SOURCE_VAULT_KIND } from "@/lib/sources";

interface VendorMeta {
  key: EnrichmentSourceKey;
  vaultKind: string;
  name: string;
  helper: string;
  acquireUrl: string;
}

const VENDORS: VendorMeta[] = [
  {
    key: "apollo",
    vaultKind: SOURCE_VAULT_KIND.apollo,
    name: "Apollo",
    helper:
      "From Apollo Dashboard → Settings → Integrations → API. Free tier covers 10k credits/month — usually enough to evaluate.",
    acquireUrl: "https://app.apollo.io/#/settings/integrations/api",
  },
  {
    key: "anymailfinder",
    vaultKind: SOURCE_VAULT_KIND.anymailfinder,
    name: "AnyMailFinder",
    helper:
      "From AnyMailFinder Dashboard → Settings → API. Verifier-grade — best when paired with Apollo's discovery.",
    acquireUrl: "https://app.anymailfinder.com/settings/api",
  },
  {
    key: "hunter",
    vaultKind: SOURCE_VAULT_KIND.hunter,
    name: "Hunter",
    helper:
      "From Hunter → API. Hunter's score field is 0-100; we honor it directly for confidence.",
    acquireUrl: "https://hunter.io/api-keys",
  },
  {
    key: "apify_linkedin",
    vaultKind: SOURCE_VAULT_KIND.apify_linkedin,
    name: "Apify (LinkedIn)",
    helper:
      "From Apify Console → Settings → Integrations. The same Apify token used by Competitor Spy. We call apify/linkedin-profile-scraper by default — override with APIFY_ACTOR_LINKEDIN_PROFILE.",
    acquireUrl: "https://console.apify.com/settings/integrations",
  },
];

export function IntegrationsPanel({
  initialStatus,
  onChange,
}: {
  initialStatus: Record<EnrichmentSourceKey, boolean>;
  onChange: (next: Record<EnrichmentSourceKey, boolean>) => void;
}) {
  const [status, setStatus] = useState(initialStatus);

  function markConfigured(key: EnrichmentSourceKey) {
    setStatus((prev) => {
      const next = { ...prev, [key]: true };
      onChange(next);
      return next;
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <p className="text-sm text-gray-600">
        Each source is independent. You can connect one and run with the rest in
        stub mode, or connect all four for the full chain. Keys are stored
        encrypted in Supabase Vault — we never log them.
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
            endpoint={`/api/integrations/${v.vaultKind}`}
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

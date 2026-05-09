"use client";

import { useState } from "react";
import {
  IntegrationStatusCard,
  VaultSecretForm,
} from "@naples/ui";

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
  const [state, setState] = useState(initialState);

  return (
    <div className="space-y-4">
      <IntegrationStatusCard
        name="Stripe"
        configured={state.configured}
        status={state.status}
        lastVerifiedAt={state.last_verified_at}
        detail={state.has_webhook_secret ? "webhook secret configured" : null}
      />
      <VaultSecretForm
        vendorName="Stripe"
        endpoint="/api/integrations/stripe"
        primary={{
          name: "secret",
          label: "Stripe Secret Key",
          placeholder: "sk_live_… or sk_test_…",
          pattern: /^sk_(live|test)_/,
          helper:
            "From Stripe Dashboard → Developers → API keys. Stored encrypted in Supabase Vault.",
        }}
        extras={[
          {
            name: "webhook_secret",
            label: "Webhook Signing Secret",
            placeholder: "whsec_…",
            helper:
              "From Stripe Dashboard → Webhooks → your endpoint → Signing secret. Required for invoice.paid event verification.",
          },
        ]}
        alreadyConfigured={state.configured}
        onSaved={(json) => {
          setState({
            configured: true,
            status: "verified",
            last_verified_at: new Date().toISOString(),
            has_webhook_secret: state.has_webhook_secret || !!json.has_webhook_secret,
          });
        }}
      />
    </div>
  );
}

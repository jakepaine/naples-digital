"use client";

import * as React from "react";

export interface IntegrationStatusCardProps {
  /** Display name of the integration ("Stripe", "Gmail", "Resend", etc.) */
  name: string;
  /** True if a tenant_integrations row exists for this vendor */
  configured: boolean;
  /** Status from tenant_integrations.status (typically 'verified', 'pending', etc.) */
  status?: string | null;
  /** ISO timestamp from tenant_integrations.last_verified_at */
  lastVerifiedAt?: string | null;
  /** Optional account identifier — for OAuth integrations (e.g. connected Gmail address) */
  accountIdentifier?: string | null;
  /** Optional extra info line (e.g. "webhook secret configured") */
  detail?: string | null;
}

/**
 * Standard "this integration is connected" card surface — used at the top of
 * every per-vendor settings page. Color-coded by configured state.
 */
export function IntegrationStatusCard(props: IntegrationStatusCardProps) {
  if (!props.configured) {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="font-semibold text-gray-700">
          {props.name} not connected
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Use the form below to connect.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm">
      <div className="font-semibold text-emerald-900">{props.name} connected</div>
      {props.accountIdentifier && (
        <div className="font-mono text-emerald-900 mt-1">
          {props.accountIdentifier}
        </div>
      )}
      <div className="text-xs text-emerald-700 mt-1">
        {props.status && (
          <>
            Status: <span className="font-mono">{props.status}</span>
          </>
        )}
        {props.lastVerifiedAt && (
          <>
            {props.status && " · "}
            last verified {new Date(props.lastVerifiedAt).toLocaleString()}
          </>
        )}
      </div>
      {props.detail && (
        <div className="text-xs text-emerald-700 mt-1">{props.detail}</div>
      )}
    </div>
  );
}

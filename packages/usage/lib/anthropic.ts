import { getTenantIntegration } from "@naples/db";
import type { UsageAdapter, UsageSnapshot, UsageWindow } from "./types";
import { computeAnthropicCost } from "./pricing";

// Anthropic Admin API base. Org-wide; per-tenant attribution comes from
// the Workspace ID stored in the tenant's "anthropic_workspace" config
// (set when the tenant is provisioned).
const ADMIN_API_BASE = "https://api.anthropic.com/v1/organizations";

type AnthropicUsageBucket = {
  starts_at: string;
  ends_at: string;
  results: Array<{
    workspace_id?: string | null;
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>;
};

type AnthropicUsageResponse = {
  data: AnthropicUsageBucket[];
};

export function createAnthropicAdapter(): UsageAdapter {
  return {
    vendor: "anthropic",
    async fetchUsage(tenantId, window): Promise<UsageSnapshot | null> {
      const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
      if (!adminKey) return null;

      // Tenant must have an Anthropic Workspace provisioned. The workspace
      // ID lives in tenant_integrations.config.workspace_id under the
      // "anthropic" integration kind (one entry per tenant).
      const integration = await getTenantIntegration(tenantId, "anthropic");
      const workspaceId = (integration?.config?.workspace_id as string | undefined) ?? null;
      if (!workspaceId) return null;

      const params = new URLSearchParams({
        starting_at: window.start.toISOString(),
        ending_at: window.end.toISOString(),
        bucket_width: "1d",
        // Filter to this tenant's workspace only.
        "workspace_ids[]": workspaceId,
      });

      const res = await fetch(`${ADMIN_API_BASE}/usage_report/messages?${params.toString()}`, {
        headers: {
          "x-api-key": adminKey,
          "anthropic-version": "2023-06-01",
        },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as AnthropicUsageResponse;

      let totalTokens = 0;
      let totalCost = 0;
      for (const bucket of json.data ?? []) {
        for (const row of bucket.results ?? []) {
          if (row.workspace_id !== workspaceId) continue;
          const input = row.input_tokens ?? 0;
          const output = row.output_tokens ?? 0;
          const cacheCreate = row.cache_creation_input_tokens ?? 0;
          const cacheRead = row.cache_read_input_tokens ?? 0;
          totalTokens += input + output + cacheCreate + cacheRead;
          totalCost += computeAnthropicCost(row.model ?? "claude-sonnet-4-6", {
            input_tokens: input,
            output_tokens: output,
            cache_creation_input_tokens: cacheCreate,
            cache_read_input_tokens: cacheRead,
          });
        }
      }

      return {
        tenant_id: tenantId,
        vendor: "anthropic",
        period_start: window.start.toISOString(),
        period_end: window.end.toISOString(),
        units: totalTokens,
        unit_label: "tokens",
        cost_usd: Math.round(totalCost * 10000) / 10000,
        raw_payload: json as unknown as Record<string, unknown>,
      };
    },
  };
}

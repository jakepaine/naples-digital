-- 0028_sla_columns.sql
-- Speed-to-Lead SLA Dashboard — additive columns on cold_email_replies
-- to track the 5-minute response window per Saraev's #30:
--   "Leads that receive instant replies tend to convert at a far higher
--    rate—many studies and surveys show numbers around the 400% mark."
--
-- sla_responded_at         operator-marked or webhook-confirmed
-- sla_breach_alerted_at    when the escalation Slack ping fired
-- sla_target_seconds       per-row override (default 300 = 5min)
--
-- All optional. Existing rows untouched.

ALTER TABLE public.cold_email_replies
  ADD COLUMN IF NOT EXISTS sla_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breach_alerted_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_target_seconds integer NOT NULL DEFAULT 300
    CHECK (sla_target_seconds > 0);

CREATE INDEX IF NOT EXISTS cold_email_replies_sla_open_idx
  ON public.cold_email_replies(tenant_id, received_at DESC)
  WHERE sla_responded_at IS NULL
    AND intent IN ('interested','more_info');

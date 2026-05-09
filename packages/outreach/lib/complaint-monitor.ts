// Complaint-rate / bounce-rate / unsubscribe-rate monitor.
//
// Inputs: vendor account stats from Instantly or Smartlead. Output:
// alert decisions keyed against thresholds aligned with 2024 Google/
// Yahoo bulk-sender requirements:
//
//   complaint_rate >= 0.30%   CRITICAL — auto-pause campaigns
//   complaint_rate >= 0.10%   WARNING — Slack ping, no auto-pause
//   bounce_rate    >= 5.0%    CRITICAL — auto-pause + Slack
//   bounce_rate    >= 2.0%    WARNING
//   unsubscribe_rate >= 2.0%  WARNING (Saraev's calibration)
//   open_rate      <  20%     WARNING (DNS or warmup issue suspected)
//   reply_rate     <  0.4%    WARNING ("dead campaign" per Saraev #274)
//
// Caller is responsible for actually pausing the campaign vendor-side
// once we surface an auto-pause decision. We just decide; we don't
// directly call vendor APIs from this module — that lives in the
// vendor adapter.

export interface VendorAccountStats {
  source: "instantly" | "smartlead" | "manual";
  /** Total emails delivered (denominator for the rates). */
  delivered: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
  opens: number;
  replies: number;
  /** Per-campaign breakdown when available. */
  campaigns?: Array<{
    id: string;
    name: string;
    delivered: number;
    bounces: number;
    complaints: number;
    unsubscribes: number;
    opens: number;
    replies: number;
  }>;
}

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertKind =
  | "bounce_rate_high"
  | "complaint_rate_high"
  | "unsubscribe_rate_high"
  | "open_rate_low"
  | "reply_rate_low"
  | "dns_misconfigured"
  | "warmup_incomplete";

export interface DeliverabilityAlertCandidate {
  alert_kind: AlertKind;
  severity: AlertSeverity;
  metric_name: string;
  metric_value: number;
  threshold: number;
  message: string;
  campaign_id?: string;
  campaign_name?: string;
  /** True if the monitor wants the dispatcher to call the vendor's pause API. */
  recommend_auto_pause: boolean;
}

export const THRESHOLDS = {
  complaint_rate_critical: 0.003, // 0.30%
  complaint_rate_warning: 0.001, // 0.10%
  bounce_rate_critical: 0.05, // 5.00%
  bounce_rate_warning: 0.02, // 2.00%
  unsubscribe_rate_warning: 0.02, // 2.00%
  open_rate_warning: 0.2, // 20%
  reply_rate_warning: 0.004, // 0.40%
  // Don't alert on tiny denominators — noisy at low volume.
  min_delivered_for_alerting: 200,
} as const;

export function evaluateAccountStats(
  stats: VendorAccountStats,
): DeliverabilityAlertCandidate[] {
  const alerts: DeliverabilityAlertCandidate[] = [];
  if (stats.delivered >= THRESHOLDS.min_delivered_for_alerting) {
    alerts.push(...evaluateRates(stats, undefined, undefined));
  }
  for (const c of stats.campaigns ?? []) {
    if (c.delivered < THRESHOLDS.min_delivered_for_alerting) continue;
    alerts.push(
      ...evaluateRates(
        {
          source: stats.source,
          delivered: c.delivered,
          bounces: c.bounces,
          complaints: c.complaints,
          unsubscribes: c.unsubscribes,
          opens: c.opens,
          replies: c.replies,
        },
        c.id,
        c.name,
      ),
    );
  }
  return alerts;
}

function evaluateRates(
  s: VendorAccountStats,
  campaignId: string | undefined,
  campaignName: string | undefined,
): DeliverabilityAlertCandidate[] {
  const out: DeliverabilityAlertCandidate[] = [];
  const complaint_rate = safeRate(s.complaints, s.delivered);
  const bounce_rate = safeRate(s.bounces, s.delivered);
  const unsubscribe_rate = safeRate(s.unsubscribes, s.delivered);
  const open_rate = safeRate(s.opens, s.delivered);
  const reply_rate = safeRate(s.replies, s.delivered);
  const tag = campaignName
    ? `campaign "${campaignName}"`
    : "account-wide";

  if (complaint_rate >= THRESHOLDS.complaint_rate_critical) {
    out.push({
      alert_kind: "complaint_rate_high",
      severity: "critical",
      metric_name: "complaint_rate",
      metric_value: complaint_rate,
      threshold: THRESHOLDS.complaint_rate_critical,
      message: `${tag}: complaint rate ${(complaint_rate * 100).toFixed(2)}% ≥ 0.30% — pause and rewrite. 2024 Google rule: above this rate, sends get junked at scale.`,
      campaign_id: campaignId,
      campaign_name: campaignName,
      recommend_auto_pause: true,
    });
  } else if (complaint_rate >= THRESHOLDS.complaint_rate_warning) {
    out.push({
      alert_kind: "complaint_rate_high",
      severity: "warning",
      metric_name: "complaint_rate",
      metric_value: complaint_rate,
      threshold: THRESHOLDS.complaint_rate_warning,
      message: `${tag}: complaint rate ${(complaint_rate * 100).toFixed(2)}% ≥ 0.10% — review copy + targeting before it hits 0.30%.`,
      campaign_id: campaignId,
      campaign_name: campaignName,
      recommend_auto_pause: false,
    });
  }

  if (bounce_rate >= THRESHOLDS.bounce_rate_critical) {
    out.push({
      alert_kind: "bounce_rate_high",
      severity: "critical",
      metric_name: "bounce_rate",
      metric_value: bounce_rate,
      threshold: THRESHOLDS.bounce_rate_critical,
      message: `${tag}: bounce rate ${(bounce_rate * 100).toFixed(2)}% ≥ 5% — pause and re-verify list. Sender reputation actively damaging.`,
      campaign_id: campaignId,
      campaign_name: campaignName,
      recommend_auto_pause: true,
    });
  } else if (bounce_rate >= THRESHOLDS.bounce_rate_warning) {
    out.push({
      alert_kind: "bounce_rate_high",
      severity: "warning",
      metric_name: "bounce_rate",
      metric_value: bounce_rate,
      threshold: THRESHOLDS.bounce_rate_warning,
      message: `${tag}: bounce rate ${(bounce_rate * 100).toFixed(2)}% ≥ 2% — re-verify list quality.`,
      campaign_id: campaignId,
      campaign_name: campaignName,
      recommend_auto_pause: false,
    });
  }

  if (unsubscribe_rate >= THRESHOLDS.unsubscribe_rate_warning) {
    out.push({
      alert_kind: "unsubscribe_rate_high",
      severity: "warning",
      metric_name: "unsubscribe_rate",
      metric_value: unsubscribe_rate,
      threshold: THRESHOLDS.unsubscribe_rate_warning,
      message: `${tag}: unsubscribe rate ${(unsubscribe_rate * 100).toFixed(2)}% ≥ 2% — message-market fit is off.`,
      campaign_id: campaignId,
      campaign_name: campaignName,
      recommend_auto_pause: false,
    });
  }

  // Open / reply rates only fire when we know enough opens were possible.
  if (s.delivered >= THRESHOLDS.min_delivered_for_alerting * 2) {
    if (open_rate < THRESHOLDS.open_rate_warning) {
      out.push({
        alert_kind: "open_rate_low",
        severity: "warning",
        metric_name: "open_rate",
        metric_value: open_rate,
        threshold: THRESHOLDS.open_rate_warning,
        message: `${tag}: open rate ${(open_rate * 100).toFixed(1)}% < 20% — DNS/warmup or subject-line issue.`,
        campaign_id: campaignId,
        campaign_name: campaignName,
        recommend_auto_pause: false,
      });
    }
    if (reply_rate < THRESHOLDS.reply_rate_warning) {
      out.push({
        alert_kind: "reply_rate_low",
        severity: "warning",
        metric_name: "reply_rate",
        metric_value: reply_rate,
        threshold: THRESHOLDS.reply_rate_warning,
        message: `${tag}: reply rate ${(reply_rate * 100).toFixed(2)}% < 0.40% — Saraev's "dead campaign" threshold. Kill or rewrite.`,
        campaign_id: campaignId,
        campaign_name: campaignName,
        recommend_auto_pause: false,
      });
    }
  }

  return out;
}

function safeRate(num: number, den: number): number {
  if (!den || den <= 0) return 0;
  return num / den;
}

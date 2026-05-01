import { Card, Badge, Button } from "@naples/ui";
import { PRICING } from "@naples/mock-data";

export default function SettingsPage() {
  return (
    <main className="px-8 py-8">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Account</div>
        <h1 className="mt-1 font-heading text-4xl text-cream">Settings</h1>
        <div className="mt-1 h-px w-12 bg-gold" />
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Owner</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">Kevin · 239 Live</h2>
          <div className="mt-6 space-y-3 text-sm">
            <Field label="Studio Name" value="239 Live Studios" />
            <Field label="Location" value="Naples, FL" />
            <Field label="Owner" value="Kevin (passive / strategic)" />
            <Field label="General Manager" value="Operator (TBD)" />
            <Field label="Systems Partner" value="Naples Digital" />
          </div>
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Engagement</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">Naples Digital Terms</h2>
          <div className="mt-6 space-y-2 text-sm">
            <Field label="Active Plan" value={`Option A · Build Heavy`} />
            <Field label="Setup Fee" value={`$${PRICING.optionA.setup.toLocaleString()} (paid)`} />
            <Field label="Monthly Retainer" value={`$${PRICING.optionA.retainer.toLocaleString()}/mo`} />
            <Field label="Commission" value={`${(PRICING.optionA.commission * 100).toFixed(0)}% of new sponsor & client MRR`} />
            <Field label="Platform Pass-Through" value={`$${PRICING.platformLow}–${PRICING.platformHigh}/mo at cost`} />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Badge tone="emerald">Active</Badge>
            <span className="text-[11px] text-muted">Started Apr 1, 2025 · Renews monthly</span>
          </div>
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Integrations</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">Connected Systems</h2>
          <div className="mt-6 space-y-3">
            <Integration name="GoHighLevel CRM" status="connected" detail="Lead pipeline · 14 active leads" />
            <Integration name="Anthropic API" status="connected" detail="claude-sonnet-4-6 · outreach generator" />
            <Integration name="Apple Podcasts" status="pending" detail="Distribution feed · pending verification" />
            <Integration name="Spotify for Podcasters" status="pending" detail="Distribution feed · pending verification" />
            <Integration name="Stripe" status="connected" detail="Payments · sessions + memberships" />
            <Integration name="Buffer" status="connected" detail="Multi-platform clip distribution" />
          </div>
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Notifications</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">What gets pushed to Kevin</h2>
          <div className="mt-6 space-y-3 text-sm">
            <Toggle label="New booking confirmed" enabled />
            <Toggle label="Lead enters Proposal Sent" enabled />
            <Toggle label="Episode posted to all platforms" enabled />
            <Toggle label="Weekly P&L summary (every Monday)" enabled />
            <Toggle label="Outreach reply received" enabled />
            <Toggle label="Daily inbound activity digest" enabled={false} />
          </div>
          <div className="mt-6">
            <Button variant="ghost" size="sm">Manage Notification Channels</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-card-border/60 py-2">
      <div className="col-span-5 text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="col-span-7 text-cream">{value}</div>
    </div>
  );
}

function Integration({ name, status, detail }: { name: string; status: "connected" | "pending" | "disconnected"; detail: string }) {
  const tone = status === "connected" ? "emerald" : status === "pending" ? "amber" : "muted";
  const label = status === "connected" ? "Connected" : status === "pending" ? "Pending" : "Disconnected";
  return (
    <div className="flex items-center justify-between border-b border-card-border/60 py-2">
      <div>
        <div className="text-sm text-cream">{name}</div>
        <div className="text-[11px] text-muted">{detail}</div>
      </div>
      <Badge tone={tone}>{label}</Badge>
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-card-border/60 py-2">
      <span className="text-cream">{label}</span>
      <span
        className={`flex h-5 w-9 items-center rounded-full border transition-colors ${
          enabled ? "border-gold bg-gold/30" : "border-card-border bg-card"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full transition-transform ${
            enabled ? "translate-x-[18px] bg-gold" : "translate-x-0.5 bg-muted"
          }`}
        />
      </span>
    </div>
  );
}

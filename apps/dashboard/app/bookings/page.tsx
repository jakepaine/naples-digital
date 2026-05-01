import { Card, Badge } from "@naples/ui";
import { Kpi } from "@/components/Kpi";
import { listBookings } from "@naples/db";
import { CalendarCheck, CircleDollarSign, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await listBookings();
  const total = bookings.reduce((s, b) => s + b.revenue, 0);
  const monthBookings = bookings.filter((b) => b.date.startsWith("2025-05"));
  const monthTotal = monthBookings.reduce((s, b) => s + b.revenue, 0);
  const avg = bookings.length ? Math.round(total / bookings.length) : 0;

  return (
    <main className="px-8 py-8">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Operations Hub</div>
        <h1 className="mt-1 font-heading text-4xl text-cream">Bookings</h1>
        <div className="mt-1 h-px w-12 bg-gold" />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi label="Booked This Month" value={`${monthBookings.length}`} hint="May 2025" icon={<CalendarCheck className="h-4 w-4" />} />
        <Kpi label="Total Revenue (this month)" value={`$${monthTotal.toLocaleString()}`} delta={{ value: "+38% MoM", tone: "up" }} icon={<CircleDollarSign className="h-4 w-4" />} />
        <Kpi label="Avg Session Value" value={`$${avg.toLocaleString()}`} hint="all packages combined" icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <section className="mt-6">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">All Bookings</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">Studio Calendar</h2>
            </div>
            <div className="flex gap-2">
              <FilterChip label="All" active />
              <FilterChip label="Confirmed" />
              <FilterChip label="Pending" />
              <FilterChip label="Completed" />
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Package</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4 text-right">Revenue</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-card-border/50 hover:bg-card-border/20">
                    <td className="py-3 pr-4 text-cream">{b.client}</td>
                    <td className="py-3 pr-4 text-muted">{b.package}</td>
                    <td className="py-3 pr-4 text-muted">{b.date}</td>
                    <td className="py-3 pr-4 text-right text-gold">${b.revenue.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      {b.status === "confirmed" && <Badge tone="emerald">Confirmed</Badge>}
                      {b.status === "pending" && <Badge tone="amber">Pending</Badge>}
                      {b.status === "completed" && <Badge tone="muted">Completed</Badge>}
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-[11px] uppercase tracking-wider text-gold hover:text-cream">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </main>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
        active ? "border-gold bg-gold/15 text-gold" : "border-card-border text-muted hover:border-gold/40 hover:text-cream"
      }`}
    >
      {label}
    </button>
  );
}

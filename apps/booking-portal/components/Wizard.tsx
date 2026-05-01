"use client";
import { useState } from "react";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Mic2, Building2, Star, Calendar as CalendarIcon, Users, Mail, ChevronRight } from "lucide-react";
import clsx from "clsx";

const PACKAGES = [
  { id: "day", name: "Day Rate Session", price: "$150–400 / day", desc: "Solo creators, podcasters, brand shoots", icon: Camera },
  { id: "half", name: "Half Day Session", price: "$100–250 / 4hr", desc: "Quick shoots and short interviews", icon: Mic2 },
  { id: "real-estate", name: "Real Estate Session", price: "$300–600 / session", desc: "Listing tours and broker brand content", icon: Building2 },
  { id: "membership", name: "Monthly Studio Membership", price: "$1,500 / mo", desc: "Recurring shows · priority calendar", icon: Star },
  { id: "corporate", name: "Corporate Package", price: "$3,000–5,000 / mo", desc: "Full production · dedicated PM", icon: Users },
  { id: "event", name: "Event Night", price: "$500–2,000 / event", desc: "Up to 50 guests · catering optional", icon: Mic2 },
];

const SHOOT_TYPES = ["Podcast", "Video Interview", "Real Estate Listing", "Corporate Brand Content", "Event", "Other"];
const CREW_SIZES = ["Solo", "2–5", "6–10", "10+"];
const EQUIPMENT = ["Studio gear only", "Bringing my own", "Mixed"];

interface FormData {
  packageId: string;
  date: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  shootType: string;
  crewSize: string;
  equipment: string;
  notes: string;
}

export function Wizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({
    packageId: "",
    date: "",
    fullName: "",
    company: "",
    email: "",
    phone: "",
    shootType: SHOOT_TYPES[0],
    crewSize: CREW_SIZES[0],
    equipment: EQUIPMENT[0],
    notes: "",
  });

  const selectedPkg = PACKAGES.find((p) => p.id === data.packageId);

  function next() { setStep((s) => Math.min(4, s + 1)); }
  function back() { setStep((s) => Math.max(1, s - 1)); }
  function submitInfo(e: React.FormEvent) {
    e.preventDefault();
    next();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="text-center">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">239 Live Studios</div>
        <h1 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Book a Session</h1>
        <div className="mx-auto mt-3 h-px w-16 bg-gold" />
      </header>

      <ProgressBar step={step} />

      <div className="mt-8">
        {step === 1 && <PackageStep data={data} setData={setData} onNext={next} />}
        {step === 2 && <DateStep data={data} setData={setData} onNext={next} onBack={back} />}
        {step === 3 && <InfoStep data={data} setData={setData} onSubmit={submitInfo} onBack={back} />}
        {step === 4 && <ConfirmationStep data={data} pkg={selectedPkg} />}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const steps = ["Package", "Date", "Info", "Confirm"];
  return (
    <div className="mt-10">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((label, i) => {
          const num = i + 1;
          const active = num <= step;
          return (
            <div key={label} className="flex flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center border text-[11px] font-medium transition-colors",
                    active ? "border-gold bg-gold text-bg" : "border-card-border text-muted"
                  )}
                >
                  {num}
                </div>
                {i < 3 && (
                  <div className={clsx("ml-2 h-px flex-1", num < step ? "bg-gold" : "bg-card-border")} />
                )}
              </div>
              <div className={clsx("mt-2 text-[10px] uppercase tracking-wider", active ? "text-gold" : "text-muted")}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PackageStep({ data, setData, onNext }: { data: FormData; setData: (d: FormData) => void; onNext: () => void }) {
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Step 1 of 4</div>
      <h2 className="mt-1 font-heading text-2xl text-cream">Choose Your Package</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {PACKAGES.map((p) => {
          const Icon = p.icon;
          const selected = data.packageId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setData({ ...data, packageId: p.id })}
              className={clsx(
                "border p-4 text-left transition-colors",
                selected ? "border-gold bg-gold/5" : "border-card-border bg-bg hover:border-gold/40"
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={clsx("h-5 w-5", selected ? "text-gold" : "text-muted")} />
                {selected && <CheckCircle2 className="h-4 w-4 text-gold" />}
              </div>
              <div className="mt-3 font-heading text-lg text-cream">{p.name}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-gold">{p.price}</div>
              <div className="mt-2 text-xs text-cream/70">{p.desc}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <Button disabled={!data.packageId} onClick={onNext}>
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function DateStep({ data, setData, onNext, onBack }: { data: FormData; setData: (d: FormData) => void; onNext: () => void; onBack: () => void }) {
  // Mock calendar for May 2025. Booked dates in red, others in green.
  const BOOKED = new Set(["2025-05-01", "2025-05-08", "2025-05-15", "2025-05-22"]);
  const days = Array.from({ length: 31 }, (_, i) => `2025-05-${String(i + 1).padStart(2, "0")}`);
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Step 2 of 4</div>
      <h2 className="mt-1 font-heading text-2xl text-cream">Pick Your Date</h2>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-emerald" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-rose" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-gold" /> Selected</span>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-wider text-gold">May 2025</div>
        <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div key={d} className="text-[10px] uppercase text-muted">{d}</div>
          ))}
          {/* May 1 is a Thursday — pad 4 cells */}
          {Array.from({ length: 4 }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((d) => {
            const day = parseInt(d.split("-")[2], 10);
            const booked = BOOKED.has(d);
            const selected = data.date === d;
            return (
              <button
                key={d}
                type="button"
                disabled={booked}
                onClick={() => setData({ ...data, date: d })}
                className={clsx(
                  "border py-2.5 text-sm transition-colors",
                  selected
                    ? "border-gold bg-gold text-bg"
                    : booked
                      ? "cursor-not-allowed border-rose/30 bg-rose/10 text-rose/60 line-through"
                      : "border-emerald/30 bg-emerald/5 text-cream hover:border-gold hover:bg-gold/10"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button disabled={!data.date} onClick={onNext}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </Card>
  );
}

function InfoStep({ data, setData, onSubmit, onBack }: { data: FormData; setData: (d: FormData) => void; onSubmit: (e: React.FormEvent) => void; onBack: () => void }) {
  const valid = data.fullName.trim() && data.email.trim();
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Step 3 of 4</div>
      <h2 className="mt-1 font-heading text-2xl text-cream">Your Information</h2>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name *">
            <input required value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Company / Brand">
            <input value={data.company} onChange={(e) => setData({ ...data, company: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Email *">
            <input type="email" required value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Type of Shoot">
            <select value={data.shootType} onChange={(e) => setData({ ...data, shootType: e.target.value })} className={inputCls}>
              {SHOOT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Crew Size">
            <select value={data.crewSize} onChange={(e) => setData({ ...data, crewSize: e.target.value })} className={inputCls}>
              {CREW_SIZES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Equipment">
            <select value={data.equipment} onChange={(e) => setData({ ...data, equipment: e.target.value })} className={inputCls}>
              {EQUIPMENT.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea rows={3} value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} className={`${inputCls} resize-none`} placeholder="Anything else we should know about your shoot?" />
        </Field>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" type="button" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button type="submit" disabled={!valid}>Submit Booking <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </form>
    </Card>
  );
}

function ConfirmationStep({ data, pkg }: { data: FormData; pkg: ReturnType<typeof PACKAGES.find> }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border border-gold bg-gold/10">
            <CheckCircle2 className="h-6 w-6 text-gold" />
          </div>
          <div>
            <Badge tone="emerald">Confirmed Booking Request</Badge>
            <h2 className="mt-2 font-heading text-3xl text-cream">Booking Request Received</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-card-border pt-6 md:grid-cols-2">
          <Detail label="Package" value={pkg?.name || "—"} sub={pkg?.price} />
          <Detail label="Date" value={data.date || "—"} sub="May 2025" />
          <Detail label="Name" value={data.fullName} sub={data.company || undefined} />
          <Detail label="Email" value={data.email} sub={data.phone || undefined} />
          <Detail label="Shoot Type" value={data.shootType} sub={`${data.crewSize} crew · ${data.equipment.toLowerCase()}`} />
          <Detail label="Notes" value={data.notes || "—"} />
        </div>

        <div className="mt-8 border-t border-card-border pt-6">
          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-sm text-cream/80">
              We'll confirm your session within 2 hours. A calendar invite goes out the moment we
              lock the slot — no chasing, no follow-up emails to send.
            </p>
          </div>
        </div>
      </Card>

      {/* Mock confirmation email preview */}
      <Card>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gold" />
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Confirmation Email Preview</div>
        </div>
        <h3 className="mt-1 font-heading text-xl text-cream">Here's what you'll receive in your inbox</h3>
        <div className="mt-5 border border-card-border bg-bg">
          <div className="border-b border-card-border p-4 text-xs">
            <div className="text-muted">From <span className="text-cream">studio@239live.com</span></div>
            <div className="mt-1 text-muted">To <span className="text-cream">{data.email || "you@example.com"}</span></div>
            <div className="mt-1 text-muted">Subject <span className="text-cream">Your 239 Live booking — {pkg?.name}</span></div>
          </div>
          <div className="space-y-3 p-5 text-sm leading-relaxed text-cream/85">
            <p>Hi {data.fullName.split(" ")[0] || "there"},</p>
            <p>Thanks for booking 239 Live Studios. Here's your booking summary:</p>
            <div className="border-l-2 border-gold pl-4 text-cream/80">
              <div><strong className="text-gold">Package:</strong> {pkg?.name}</div>
              <div><strong className="text-gold">Date:</strong> {data.date}</div>
              <div><strong className="text-gold">Crew:</strong> {data.crewSize} · {data.equipment}</div>
            </div>
            <p>We'll confirm the exact start time within 2 hours. The studio is at 239 Live HQ, Naples FL — parking is free, gear is racked and ready.</p>
            <p>If anything changes on your end, just reply to this email.</p>
            <p>— Kevin & the 239 Live team</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <a href={APP_URLS.site}>
          <Button variant="ghost">Back to Studio</Button>
        </a>
        <a href={APP_URLS.crm}>
          <Button>View Lead in Pipeline <ChevronRight className="ml-2 h-4 w-4" /></Button>
        </a>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-card-border bg-bg px-3 py-2.5 text-sm text-cream focus:border-gold focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1.5 text-base text-cream">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

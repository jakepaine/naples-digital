"use client";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import { Card, Badge } from "@naples/ui";
import { LEAD_STAGES, Lead, LeadStage } from "@naples/mock-data";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import { AngleModal } from "./AngleModal";

export function Board({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [angleLeadId, setAngleLeadId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const leadId = String(e.active.id);
    const targetStage = String(e.over.id) as LeadStage;
    if (!LEAD_STAGES.includes(targetStage)) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage, daysInStage: 0 } : l))
    );
    // Persist to Supabase. Failure does not roll back — board stays usable.
    fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: targetStage, days_in_stage: 0 }),
    }).catch(() => {});
  }

  const totalPipeline = leads.reduce((s, l) => s + l.value, 0);
  const won = leads.filter((l) => l.stage === "Client Won");
  const wonValue = won.reduce((s, l) => s + l.value, 0);
  const commission = Math.round(wonValue * 0.10);

  return (
    <div className="px-6 py-12">
      <header className="mx-auto mb-8 max-w-7xl">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Sales Engine</div>
        <h1 className="mt-3 font-heading text-5xl text-cream">Lead Management</h1>
        <div className="mt-3 h-px w-16 bg-gold" />
        <p className="mt-4 max-w-2xl text-sm text-cream/70">
          Drag any lead between stages. Column totals update in real time. This board is the
          GoHighLevel-style replacement Naples Digital builds for every client.
        </p>
      </header>

      <section className="mx-auto mb-8 grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Pipeline Value" value={`$${totalPipeline.toLocaleString()}`} sub={`${leads.length} leads · 5 stages`} />
        <StatCard label="Won This Month" value={`$${wonValue.toLocaleString()}`} sub={`${won.length} clients signed`} tone="emerald" />
        <StatCard label="Commission Earned" value={`$${commission.toLocaleString()}`} sub="Naples Digital · 10%" tone="gold" />
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleStart} onDragEnd={handleEnd}>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {LEAD_STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              leads={leads.filter((l) => l.stage === stage)}
              onGenerateAngle={(id) => setAngleLeadId(id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId && <LeadCard lead={leads.find((l) => l.id === activeId)!} dragging />}
        </DragOverlay>
      </DndContext>

      {angleLeadId && (
        <AngleModal
          lead={leads.find((l) => l.id === angleLeadId)!}
          onClose={() => setAngleLeadId(null)}
        />
      )}
    </div>
  );
}

function Column({ stage, leads, onGenerateAngle }: { stage: LeadStage; leads: Lead[]; onGenerateAngle?: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((s, l) => s + l.value, 0);
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "border bg-card transition-colors",
        isOver ? "border-gold bg-card/80" : "border-card-border"
      )}
    >
      <div className="border-b border-card-border bg-bg/50 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-cream">{stage}</div>
          <div className="text-[11px] text-muted">{leads.length}</div>
        </div>
        <div className="mt-1 text-[11px] text-gold">${total.toLocaleString()}</div>
      </div>
      <div className="min-h-[400px] space-y-2 p-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onGenerateAngle={onGenerateAngle} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead, dragging, onGenerateAngle }: { lead: Lead; dragging?: boolean; onGenerateAngle?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const hidden = isDragging && !dragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "cursor-grab border bg-bg p-3 transition-opacity active:cursor-grabbing",
        hidden ? "opacity-0" : dragging ? "border-gold opacity-95 shadow-[0_8px_30px_rgba(0,0,0,0.4)]" : "border-card-border hover:border-gold/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-cream">{lead.name}</div>
        <TypeBadge type={lead.type} />
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-muted">{lead.goal}</div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gold">${lead.value.toLocaleString()}</span>
        <span className="text-[10px] text-muted">{lead.source}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <span>Day {lead.daysInStage}</span>
        {onGenerateAngle && !dragging && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onGenerateAngle(lead.id);
            }}
            className="flex items-center gap-1 border border-card-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-gold/60 hover:text-gold"
          >
            <Sparkles className="h-3 w-3" /> Angle
          </button>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  // Color-code by category: gold for sponsor goals, blue for rental, green for agency.
  // We're approximating by lead.type since stages differ from goals.
  const lower = type.toLowerCase();
  if (lower.includes("real estate") || lower.includes("local") || lower.includes("event") || lower.includes("luxury") || lower.includes("yacht") || lower.includes("home")) {
    return <Badge tone="sapphire">{shortType(type)}</Badge>;
  }
  if (lower.includes("financial") || lower.includes("equity") || lower.includes("corporate")) {
    return <Badge tone="gold">{shortType(type)}</Badge>;
  }
  return <Badge tone="emerald">{shortType(type)}</Badge>;
}

function shortType(t: string): string {
  if (t.length > 14) return t.split(" ")[0];
  return t;
}

function StatCard({ label, value, sub, tone = "cream" }: { label: string; value: string; sub: string; tone?: "cream" | "gold" | "emerald" }) {
  const valueColor = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl ${valueColor}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </Card>
  );
}

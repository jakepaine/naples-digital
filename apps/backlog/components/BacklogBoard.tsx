"use client";
import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { Plus, Sparkles, Trash2, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@naples/ui";
import type { BacklogItem, BacklogPriority, BacklogStatus } from "@naples/db";
import type { ClientTenant } from "@/app/page";
import { SuggestModal, type SuggestedItem } from "@/components/SuggestModal";

type View = {
  tenants: ClientTenant[];
  activeSlug: string;
  items: BacklogItem[];
};

const STATUS_LABELS: Record<BacklogStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const PRIORITY_LABELS: Record<BacklogPriority, string> = {
  P0: "P0 · urgent",
  P1: "P1 · high",
  P2: "P2 · normal",
  P3: "P3 · low",
};

const PRIORITY_TONE: Record<BacklogPriority, string> = {
  P0: "text-rose border-rose/40 bg-rose/10",
  P1: "text-amber border-amber/40 bg-amber/10",
  P2: "text-cream/70 border-card-border bg-bg/40",
  P3: "text-muted border-card-border bg-bg/40",
};

const STATUS_TONE: Record<BacklogStatus, string> = {
  backlog: "text-muted border-card-border bg-bg/40",
  in_progress: "text-sapphire border-sapphire/40 bg-sapphire/10",
  blocked: "text-rose border-rose/40 bg-rose/10",
  done: "text-emerald border-emerald/40 bg-emerald/10",
};

type Filters = {
  status: BacklogStatus | "all";
  priority: BacklogPriority | "all";
  tag: string | "all";
};

export function BacklogBoard({ initial }: { initial: View }) {
  const [activeSlug, setActiveSlug] = useState(initial.activeSlug);
  const [itemsByTenant, setItemsByTenant] = useState<Record<string, BacklogItem[]>>({
    [initial.activeSlug]: initial.items,
  });
  const [filters, setFilters] = useState<Filters>({ status: "all", priority: "all", tag: "all" });
  const [showSuggest, setShowSuggest] = useState(false);
  const [, startTransition] = useTransition();

  const activeTenant = initial.tenants.find((t) => t.slug === activeSlug) ?? initial.tenants[0];
  const items = itemsByTenant[activeSlug] ?? [];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filters.status !== "all" && i.status !== filters.status) return false;
      if (filters.priority !== "all" && i.priority !== filters.priority) return false;
      if (filters.tag !== "all" && !i.tags.includes(filters.tag)) return false;
      return true;
    });
  }, [items, filters]);

  const counts = useMemo(() => {
    const c = { backlog: 0, in_progress: 0, blocked: 0, done: 0 };
    items.forEach((i) => { c[i.status]++; });
    return c;
  }, [items]);

  async function switchTenant(slug: string) {
    setActiveSlug(slug);
    if (!itemsByTenant[slug]) {
      const res = await fetch(`/api/backlog?tenant=${slug}`, { cache: "no-store" });
      const json = await res.json();
      setItemsByTenant((m) => ({ ...m, [slug]: json.items ?? [] }));
    }
  }

  async function addItem(input: { title: string; priority: BacklogPriority; tags: string[] }) {
    const res = await fetch("/api/backlog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenant: activeSlug, ...input }),
    });
    if (!res.ok) return;
    const { item } = await res.json();
    setItemsByTenant((m) => ({ ...m, [activeSlug]: [item, ...(m[activeSlug] ?? [])] }));
  }

  async function patchItem(id: string, patch: Partial<BacklogItem>) {
    // Optimistic
    setItemsByTenant((m) => ({
      ...m,
      [activeSlug]: (m[activeSlug] ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
    const res = await fetch(`/api/backlog/${id}?tenant=${activeSlug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { item } = await res.json();
      setItemsByTenant((m) => ({
        ...m,
        [activeSlug]: (m[activeSlug] ?? []).map((i) => (i.id === id ? item : i)),
      }));
    }
  }

  async function deleteItem(id: string) {
    setItemsByTenant((m) => ({
      ...m,
      [activeSlug]: (m[activeSlug] ?? []).filter((i) => i.id !== id),
    }));
    await fetch(`/api/backlog/${id}?tenant=${activeSlug}`, { method: "DELETE" });
  }

  async function acceptSuggestions(picked: SuggestedItem[]) {
    setShowSuggest(false);
    if (picked.length === 0) return;
    // Insert serially to keep UI responsive and ordered
    for (const s of picked) {
      const res = await fetch("/api/backlog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant: activeSlug, ...s, source: "suggest" }),
      });
      if (res.ok) {
        const { item } = await res.json();
        setItemsByTenant((m) => ({ ...m, [activeSlug]: [item, ...(m[activeSlug] ?? [])] }));
      }
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Naples Digital</div>
          <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Backlog</h1>
          <div className="mt-3 h-px w-16 bg-gold" />
        </div>
        <Button variant="ghost" onClick={() => setShowSuggest(true)}>
          <Sparkles className="-ml-1 mr-2 inline h-4 w-4" /> Suggest
        </Button>
      </header>

      {/* Tenant tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-card-border">
        {initial.tenants.map((t) => {
          const active = t.slug === activeSlug;
          return (
            <button
              key={t.id}
              onClick={() => startTransition(() => switchTenant(t.slug))}
              className={clsx(
                "relative px-4 py-3 text-sm font-medium uppercase tracking-wider transition-colors",
                active ? "text-cream" : "text-muted hover:text-cream"
              )}
              style={active ? { borderBottom: `2px solid ${t.accent}` } : undefined}
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ background: t.accent }}
              />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Status counts strip */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {(Object.keys(STATUS_LABELS) as BacklogStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? "all" : s }))}
            className={clsx(
              "border bg-card px-4 py-3 text-left transition-colors",
              filters.status === s ? "border-gold" : "border-card-border hover:border-card-border-strong"
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{STATUS_LABELS[s]}</div>
            <div className="mt-1 font-heading text-2xl tracking-broadcast text-cream">{counts[s]}</div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter
          label="Priority"
          value={filters.priority}
          onChange={(v) => setFilters((f) => ({ ...f, priority: v as Filters["priority"] }))}
          options={[["all", "all priorities"], ...(Object.keys(PRIORITY_LABELS) as BacklogPriority[]).map((p) => [p, PRIORITY_LABELS[p]] as [string, string])]}
        />
        <Filter
          label="Tag"
          value={filters.tag}
          onChange={(v) => setFilters((f) => ({ ...f, tag: v }))}
          options={[["all", "all tags"], ...allTags.map((t) => [t, t] as [string, string])]}
        />
        {(filters.status !== "all" || filters.priority !== "all" || filters.tag !== "all") && (
          <button
            onClick={() => setFilters({ status: "all", priority: "all", tag: "all" })}
            className="text-xs uppercase tracking-wider text-muted hover:text-cream"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Quick add */}
      <QuickAdd onAdd={addItem} accent={activeTenant?.accent ?? "#E8192C"} />

      {/* Items */}
      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="border border-card-border bg-card px-6 py-10 text-center">
            <div className="text-sm text-muted">
              {items.length === 0 ? "No items yet — add one above or click Suggest." : "No items match these filters."}
            </div>
          </div>
        )}
        {filtered.map((item) => (
          <BacklogRow
            key={item.id}
            item={item}
            onPatch={(patch) => patchItem(item.id, patch)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      {showSuggest && activeTenant && (
        <SuggestModal
          tenant={activeTenant}
          onClose={() => setShowSuggest(false)}
          onAccept={acceptSuggestions}
        />
      )}
    </main>
  );
}

function Filter({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-2 border border-card-border bg-card px-3 py-2 text-xs">
      <span className="uppercase tracking-wider text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-cream focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-card">{l}</option>
        ))}
      </select>
    </label>
  );
}

function QuickAdd({ onAdd, accent }: { onAdd: (i: { title: string; priority: BacklogPriority; tags: string[] }) => Promise<void>; accent: string }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<BacklogPriority>("P2");
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await onAdd({ title: title.trim(), priority, tags });
    setTitle(""); setTagInput("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-stretch gap-2 border border-card-border bg-card p-2">
      <span className="w-1 self-stretch" style={{ background: accent }} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's the next thing on the list?"
        className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm text-cream placeholder:text-muted focus:outline-none"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as BacklogPriority)}
        className="bg-bg/40 px-2 py-2 text-xs uppercase tracking-wider text-cream focus:outline-none border border-card-border"
      >
        {(Object.keys(PRIORITY_LABELS) as BacklogPriority[]).map((p) => (
          <option key={p} value={p} className="bg-card">{p}</option>
        ))}
      </select>
      <input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="tags (comma sep)"
        className="bg-bg/40 px-2 py-2 text-xs text-cream placeholder:text-muted focus:outline-none border border-card-border w-44"
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="inline-flex items-center gap-1 bg-gold px-4 text-xs font-medium uppercase tracking-wider text-bg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
      </button>
    </form>
  );
}

function BacklogRow({ item, onPatch, onDelete }: {
  item: BacklogItem; onPatch: (p: Partial<BacklogItem>) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const isDone = item.status === "done";

  function save() {
    if (title.trim() !== item.title || description.trim() !== (item.description ?? "")) {
      onPatch({ title: title.trim(), description: description.trim() || null });
    }
    setEditing(false);
  }

  return (
    <div
      className={clsx(
        "group border border-card-border bg-card p-3 transition-colors hover:border-card-border-strong",
        isDone && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <StatusToggle value={item.status} onChange={(s) => onPatch({ status: s })} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                autoFocus
                className="w-full bg-bg/40 px-2 py-1 text-sm text-cream border border-card-border focus:border-gold/60 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-bg/40 px-2 py-1 text-xs text-cream/80 placeholder:text-muted border border-card-border focus:border-gold/60 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={save} className="bg-gold px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-bg">Save</button>
                <button onClick={() => { setEditing(false); setTitle(item.title); setDescription(item.description ?? ""); }} className="border border-card-border px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted hover:text-cream">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="block w-full text-left">
              <div className={clsx("text-sm leading-snug text-cream", isDone && "line-through")}>{item.title}</div>
              {item.description && <div className="mt-1 text-xs leading-snug text-muted">{item.description}</div>}
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PriorityPicker value={item.priority} onChange={(p) => onPatch({ priority: p })} />
            <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider", STATUS_TONE[item.status])}>
              {STATUS_LABELS[item.status]}
            </span>
            {item.tags.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-card-border bg-bg/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted">
                {t}
              </span>
            ))}
            {item.source !== "manual" && (
              <span className="inline-flex items-center rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-violet">
                <Sparkles className="mr-1 h-2.5 w-2.5" /> {item.source}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
          aria-label="delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatusToggle({ value, onChange }: { value: BacklogStatus; onChange: (s: BacklogStatus) => void }) {
  const [open, setOpen] = useState(false);
  const order: BacklogStatus[] = ["backlog", "in_progress", "blocked", "done"];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex h-6 w-6 items-center justify-center border transition-colors",
          value === "done" ? "border-emerald bg-emerald/20 text-emerald" :
          value === "in_progress" ? "border-sapphire bg-sapphire/20 text-sapphire" :
          value === "blocked" ? "border-rose bg-rose/20 text-rose" :
          "border-card-border-strong bg-bg/40 text-muted hover:border-cream"
        )}
        aria-label={`Status: ${STATUS_LABELS[value]}`}
      >
        {value === "done" ? "✓" : value === "blocked" ? <AlertCircle className="h-3 w-3" /> : value === "in_progress" ? "▶" : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-20 w-36 border border-card-border bg-card shadow-xl">
            {order.map((s) => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={clsx(
                  "block w-full px-3 py-2 text-left text-xs uppercase tracking-wider hover:bg-bg/40",
                  s === value ? "text-gold" : "text-cream"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PriorityPicker({ value, onChange }: { value: BacklogPriority; onChange: (p: BacklogPriority) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider", PRIORITY_TONE[value])}
      >
        {value} <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-20 w-32 border border-card-border bg-card shadow-xl">
            {(["P0","P1","P2","P3"] as BacklogPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => { onChange(p); setOpen(false); }}
                className={clsx(
                  "block w-full px-3 py-2 text-left text-[10px] uppercase tracking-wider hover:bg-bg/40",
                  p === value ? "text-gold" : "text-cream"
                )}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

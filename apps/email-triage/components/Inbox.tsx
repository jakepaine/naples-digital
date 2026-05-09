"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  type Category,
} from "@/lib/categories";
import type { EmailRow } from "@/lib/inbox-query";

interface InboxProps {
  initialEmails: EmailRow[];
  tenant: { id: string; slug: string; name: string };
}

const CATEGORY_ORDER: Category[] = [
  "high_priority",
  "partnerships",
  "billing",
  "newsletter",
  "spam",
];

export function Inbox({ initialEmails, tenant }: InboxProps) {
  const [emails, setEmails] = useState<EmailRow[]>(initialEmails);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all" | "unclassified">("all");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function patch(id: string, partial: Partial<EmailRow>) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)));
  }
  function remove(id: string) {
    setEmails((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleSeedDemo() {
    setBusy("demo");
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "sync failed");
      setInfo(`Ingested ${json.ingested} demo emails. Refresh to see them.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleArchive(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/email/${id}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("archive failed");
      remove(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRecategorize(id: string, category: Category) {
    setBusy(id);
    try {
      const res = await fetch(`/api/email/${id}/recategorize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, reason: "manual override" }),
      });
      if (!res.ok) throw new Error("recategorize failed");
      patch(id, { category, reason: "manual override" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    emails: emails
      .filter((e) => e.category === cat)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
  }));
  const unclassified = emails.filter((e) => e.category == null);

  const visible =
    filter === "all"
      ? grouped
      : filter === "unclassified"
        ? [{ cat: "high_priority" as Category, emails: unclassified }]
        : grouped.filter((g) => g.cat === filter);

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Triage</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tenant: <span className="font-mono">{tenant.slug}</span> · AI-sorted
            inbox using a Worthwhile-default classifier (Nick Saraev pattern).
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href="/auto-reply"
            className="text-sm text-blue-600 hover:underline"
          >
            Auto-replies →
          </Link>
          <Link
            href="/integrations/gmail"
            className="text-sm text-blue-600 hover:underline"
          >
            Gmail settings →
          </Link>
          <button
            onClick={handleSeedDemo}
            disabled={busy === "demo"}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            {busy === "demo" ? "Seeding…" : "Seed demo inbox"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {info}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterButton
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={emails.length}
        />
        {unclassified.length > 0 && (
          <FilterButton
            label="Unclassified"
            active={filter === "unclassified"}
            onClick={() => setFilter("unclassified")}
            count={unclassified.length}
          />
        )}
        {CATEGORIES.map((c) => (
          <FilterButton
            key={c}
            label={CATEGORY_LABEL[c]}
            active={filter === c}
            onClick={() => setFilter(c)}
            count={grouped.find((g) => g.cat === c)?.emails.length ?? 0}
          />
        ))}
      </div>

      {emails.length === 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No emails yet. Click "Seed demo inbox" to load 6 sample messages, or
          connect Gmail in a follow-up release.
        </div>
      )}

      {visible.map(({ cat, emails: bucket }) =>
        bucket.length === 0 ? null : (
          <section key={cat}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono border ${CATEGORY_TONE[cat]}`}
              >
                {CATEGORY_LABEL[cat]}
              </span>
              <span className="text-sm text-gray-400">({bucket.length})</span>
            </h2>
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {bucket.map((e) => (
                <EmailCard
                  key={e.id}
                  email={e}
                  busy={busy === e.id}
                  onArchive={() => handleArchive(e.id)}
                  onRecategorize={(c) => handleRecategorize(e.id, c)}
                />
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

function FilterButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`px-3 py-1 rounded border text-sm ${
        props.active
          ? "bg-black text-white border-black"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      {props.label}{" "}
      <span className={props.active ? "text-gray-300" : "text-gray-400"}>
        {props.count}
      </span>
    </button>
  );
}

function EmailCard(props: {
  email: EmailRow;
  busy: boolean;
  onArchive: () => void;
  onRecategorize: (c: Category) => void;
}) {
  const e = props.email;
  const score = e.score ?? 0;
  return (
    <li className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm">
            <span className="font-medium">{e.from_name ?? e.from_email}</span>{" "}
            <span className="text-gray-400">&lt;{e.from_email}&gt;</span>
          </div>
          <div className="font-medium mt-1">{e.subject}</div>
          {e.preview && (
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              {e.preview}
            </div>
          )}
          <div className="text-xs text-gray-400 italic mt-2">
            {e.reason || "(awaiting classification)"} ·{" "}
            {new Date(e.received_at).toLocaleString()}
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <div
            className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
              score >= 80
                ? "bg-red-100 text-red-700"
                : score >= 60
                  ? "bg-orange-100 text-orange-700"
                  : score >= 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {e.score == null ? "?" : score}
          </div>
          <div className="flex gap-1">
            <button
              disabled={props.busy}
              onClick={props.onArchive}
              className="text-xs px-2 py-0.5 border border-gray-300 rounded disabled:opacity-50"
            >
              Archive
            </button>
            <select
              disabled={props.busy}
              value=""
              onChange={(ev) => {
                const v = ev.target.value as Category;
                if (v) props.onRecategorize(v);
              }}
              className="text-xs px-1 py-0.5 border border-gray-300 rounded bg-white disabled:opacity-50"
            >
              <option value="">Re-categorize…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </li>
  );
}

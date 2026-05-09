"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";

interface Template {
  id: string;
  name: string;
  category: Category;
  subject: string;
  body_template: string;
  enabled: boolean;
  fire_count: number;
  last_fired_at: string | null;
}

export function TemplatesList({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [adding, setAdding] = useState(false);

  function add(t: Template) {
    setTemplates((prev) => [t, ...prev]);
    setAdding(false);
  }
  function patch(id: string, partial: Partial<Template>) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }
  function remove(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setAdding((v) => !v)}
        className="px-3 py-1.5 bg-black text-white rounded text-sm"
      >
        {adding ? "Cancel" : "+ New auto-reply"}
      </button>

      {adding && <NewTemplateForm onCreate={add} />}

      {templates.length === 0 ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No auto-reply templates yet. Most tenants want one for{" "}
          <span className="font-mono">partnerships</span> ("not currently
          taking partnerships, all good") and one for{" "}
          <span className="font-mono">billing</span> (silent receipt).
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <Row key={t.id} t={t} onPatch={patch} onRemove={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewTemplateForm({ onCreate }: { onCreate: (t: Template) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("partnerships");
  const [subject, setSubject] = useState("Re: {{subject}}");
  const [body, setBody] = useState(
    "Hi {{from_name}},\n\nThanks for reaching out. We're not currently taking new partnership opportunities, but appreciate you thinking of us.\n\nAll the best,\n{{tenant_name}}",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auto-reply-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          subject,
          body_template: body,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "create failed");
      onCreate(json.template);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Template name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Trigger category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Body</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 bg-emerald-600 text-white rounded text-sm disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save template"}
      </button>
      {error && <div className="text-sm text-red-700">{error}</div>}
    </form>
  );
}

function Row({
  t,
  onPatch,
  onRemove,
}: {
  t: Template;
  onPatch: (id: string, partial: Partial<Template>) => void;
  onRemove: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/auto-reply-templates/${t.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !t.enabled }),
      });
      if (res.ok) onPatch(t.id, { enabled: !t.enabled });
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`Delete "${t.name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/auto-reply-templates/${t.id}`, {
        method: "DELETE",
      });
      if (res.ok) onRemove(t.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">
            {t.name}{" "}
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded ${t.enabled ? "bg-emerald-100 text-emerald-900" : "bg-gray-100 text-gray-600"}`}
            >
              {t.enabled ? "enabled" : "disabled"}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Fires on category{" "}
            <span className="font-mono">{CATEGORY_LABEL[t.category]}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Fired {t.fire_count} time{t.fire_count === 1 ? "" : "s"}
            {t.last_fired_at &&
              ` · last ${new Date(t.last_fired_at).toLocaleString()}`}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggle}
            disabled={busy}
            className="text-xs px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            {t.enabled ? "Disable" : "Enable"}
          </button>
          <button
            onClick={del}
            disabled={busy}
            className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="text-sm">
        <div>
          <span className="text-gray-500">Subject:</span> {t.subject}
        </div>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2">
          {t.body_template}
        </pre>
      </div>
    </li>
  );
}

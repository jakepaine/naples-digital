"use client";

import { useEffect, useState } from "react";
import type { Category, MockEmail } from "@/lib/mock-emails";

type Enriched = MockEmail & { category: Category; score: number; reason: string };

const CATEGORY_LABELS: Record<Category, string> = {
  high_priority: "High priority",
  partnerships: "Partnerships",
  support: "Support",
  newsletter: "Newsletters",
  spam: "Spam",
};

const CATEGORY_ORDER: Category[] = [
  "high_priority",
  "support",
  "partnerships",
  "newsletter",
  "spam",
];

export function Inbox() {
  const [emails, setEmails] = useState<Enriched[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classify")
      .then((r) => r.json())
      .then((data: Enriched[]) => {
        setEmails(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Classifying inbox…</div>;
  if (!emails) return <div className="p-8">Failed to load inbox.</div>;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    emails: emails
      .filter((e) => e.category === cat)
      .sort((a, b) => b.score - a.score),
  })).filter((g) => g.emails.length > 0);

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Email Triage</h1>
        <p className="text-sm text-gray-500 mt-2">
          AI-classified inbox. Replace mock emails with a per-tenant Gmail or
          Outlook integration to go live.
        </p>
      </header>

      {grouped.map(({ cat, emails }) => (
        <section key={cat}>
          <h2 className="text-lg font-semibold mb-3">
            {CATEGORY_LABELS[cat]}{" "}
            <span className="text-sm text-gray-400">({emails.length})</span>
          </h2>
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {emails.map((e) => (
              <li key={e.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {e.fromName}{" "}
                      <span className="text-gray-400">&lt;{e.fromEmail}&gt;</span>
                    </div>
                    <div className="font-medium mt-1">{e.subject}</div>
                    <div className="text-sm text-gray-600 mt-1">{e.preview}</div>
                    <div className="text-xs text-gray-400 italic mt-2">
                      {e.reason}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div
                      className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                        e.score >= 80
                          ? "bg-red-100 text-red-700"
                          : e.score >= 60
                            ? "bg-orange-100 text-orange-700"
                            : e.score >= 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {e.score}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

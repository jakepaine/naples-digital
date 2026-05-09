"use client";

import { useState } from "react";
import { PLATFORMS, type Platform } from "@/lib/platforms";

interface Variant {
  platform: Platform;
  text: string;
  hashtags: string[];
}

const SAMPLE = {
  title: "How we cut Stripe disputes by 71% in 30 days",
  body: `When our refund disputes spiked last quarter, we did the obvious thing first:
hired more support people. It barely moved the number. The actual fix turned
out to be upstream — three tiny copy changes on the checkout page and one new
auto-message after each charge that explained exactly what the customer would
see on their statement. The disputes never started.

Most teams treat support volume as a labor problem. It isn't. It's a clarity
problem in disguise. Spend an afternoon mapping your top 5 support tickets to
the moment in the user journey that confused someone, and your queue gets
shorter than any new hire could make it.`,
  sourceUrl: "https://naplesdigital.com/blog/disputes-71-percent",
};

export function Composer() {
  const [title, setTitle] = useState(SAMPLE.title);
  const [body, setBody] = useState(SAMPLE.body);
  const [sourceUrl, setSourceUrl] = useState(SAMPLE.sourceUrl);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTailor() {
    setLoading(true);
    setVariants(null);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, sourceUrl }),
      });
      const json = await res.json();
      setVariants(json.results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Content Syndication</h1>
        <p className="text-sm text-gray-500 mt-2">
          Paste a long-form post. Get five platform-tailored variants. Publishing
          to each platform uses per-tenant credentials (wired up in the next
          implementation pass).
        </p>
      </header>

      <section className="space-y-3 border border-gray-200 p-5 rounded-lg">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Source URL (optional)</span>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>
        <button
          onClick={handleTailor}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {loading ? "Tailoring…" : "Tailor for 5 platforms"}
        </button>
      </section>

      {variants && (
        <section className="space-y-4">
          {PLATFORMS.map((p) => {
            const v = variants.find((x) => x.platform === p);
            if (!v) return null;
            return (
              <div key={p} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold capitalize">{p}</h3>
                  <span className="text-xs text-gray-400">
                    {v.text.length} chars
                  </span>
                </div>
                <pre className="whitespace-pre-wrap text-sm">{v.text}</pre>
                {v.hashtags.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600">
                    {v.hashtags.join(" ")}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

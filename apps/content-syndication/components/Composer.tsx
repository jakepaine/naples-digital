"use client";

import { useState } from "react";
import type { PostWithVariants } from "@/lib/persist-post";

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
  imageUrl: "",
};

export function Composer({
  onSaved,
}: {
  onSaved: (post: PostWithVariants) => void;
}) {
  const [title, setTitle] = useState(SAMPLE.title);
  const [body, setBody] = useState(SAMPLE.body);
  const [sourceUrl, setSourceUrl] = useState(SAMPLE.sourceUrl);
  const [imageUrl, setImageUrl] = useState(SAMPLE.imageUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          sourceUrl: sourceUrl || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "save failed");
      if (json.saved) onSaved({ post: json.post, variants: json.variants });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-gray-200 p-5 rounded-lg bg-white"
    >
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Body</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">
            Source URL <span className="text-gray-400">(optional)</span>
          </span>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            Image URL <span className="text-gray-400">(optional)</span>
          </span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
      >
        {busy ? "Tailoring + saving…" : "Tailor for 5 platforms + save"}
      </button>
    </form>
  );
}

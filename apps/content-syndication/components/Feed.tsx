"use client";

import { useState } from "react";
import { CONSTRAINTS, PLATFORMS, type Platform } from "@/lib/platforms";
import type { PostWithVariants, VariantRow } from "@/lib/persist-post";

interface FeedProps {
  posts: PostWithVariants[];
  onPatch: (variantId: string, patch: Partial<VariantRow>) => void;
}

export function Feed({ posts, onPatch }: FeedProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        No posts yet. Switch to Compose to write your first one.
      </div>
    );
  }
  return (
    <ul className="space-y-6">
      {posts.map((p) => (
        <PostCard key={p.post.id} post={p} onPatch={onPatch} />
      ))}
    </ul>
  );
}

function PostCard({
  post,
  onPatch,
}: {
  post: PostWithVariants;
  onPatch: (id: string, patch: Partial<VariantRow>) => void;
}) {
  const variants = PLATFORMS.map(
    (p) =>
      post.variants.find((v) => v.platform === p) ?? null,
  );
  return (
    <li className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold">{post.post.title}</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {post.post.body}
            </p>
            <div className="text-xs text-gray-400 mt-2">
              {new Date(post.post.created_at).toLocaleString()} ·{" "}
              <span className="font-mono">{post.post.status}</span>
              {post.post.source_url && (
                <>
                  {" · "}
                  <a
                    href={post.post.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    source
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {variants.map((v, i) =>
          v ? (
            <VariantCard key={v.id} variant={v} onPatch={onPatch} />
          ) : (
            <div
              key={i}
              className="p-4 text-sm text-gray-400 italic"
            >
              No variant for {PLATFORMS[i]}.
            </div>
          ),
        )}
      </div>
    </li>
  );
}

function VariantCard({
  variant,
  onPatch,
}: {
  variant: VariantRow;
  onPatch: (id: string, patch: Partial<VariantRow>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(variant.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const constraint = CONSTRAINTS[variant.platform as Platform];

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "save failed");
      onPatch(variant.id, { text: draft });
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variant.id}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "publish failed");
      onPatch(variant.id, json.variant);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const overLimit = draft.length > (constraint?.charLimit ?? 99999);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold capitalize">{variant.platform}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono ${badgeClass(
              variant.status,
            )}`}
          >
            {variant.status}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {(editing ? draft : variant.text).length} / {constraint?.charLimit}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(12, Math.ceil(draft.length / 80) + 2)}
          className={`w-full border rounded p-2 text-sm font-mono ${overLimit ? "border-red-300 bg-red-50" : "border-gray-300"}`}
        />
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-gray-800">{variant.text}</pre>
      )}

      {variant.hashtags && variant.hashtags.length > 0 && (
        <div className="mt-2 text-xs text-blue-600">
          {variant.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
        </div>
      )}

      {variant.published_url && (
        <a
          href={variant.published_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-700 underline mt-2 inline-block"
        >
          Open in {variant.platform} →
        </a>
      )}

      {variant.error_message && (
        <div className="text-xs text-red-700 mt-2">
          {variant.error_message}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {editing ? (
          <>
            <button
              disabled={busy || overLimit}
              onClick={handleSave}
              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save edit"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDraft(variant.text);
                setEditing(false);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {variant.status !== "published" && (
              <button
                disabled={busy}
                onClick={() => setEditing(true)}
                className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50"
              >
                Edit
              </button>
            )}
            {variant.status === "draft" && (
              <button
                disabled={busy}
                onClick={handlePublish}
                className="px-3 py-1 bg-black text-white rounded text-xs disabled:opacity-50"
              >
                {busy ? "Publishing…" : `Publish to ${variant.platform} (stub)`}
              </button>
            )}
          </>
        )}
      </div>
      {error && <div className="text-xs text-red-700 mt-2">{error}</div>}
    </div>
  );
}

function badgeClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-100 text-emerald-900";
    case "scheduled":
      return "bg-blue-100 text-blue-900";
    case "failed":
      return "bg-red-100 text-red-700";
    case "approved":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

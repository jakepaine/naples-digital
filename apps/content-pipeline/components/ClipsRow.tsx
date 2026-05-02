"use client";
import { useEffect, useState } from "react";
import { Clapperboard, Copy, Check, Sparkles, Instagram, Youtube, Facebook, Music2, Star, Download, Play } from "lucide-react";
import { Button } from "@naples/ui";

interface Clip {
  id: string;
  episode_id: string;
  hook: string;
  caption: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "best";
  status: "draft" | "posted";
  source: "api" | "mock" | "fallback";
  video_url?: string | null;
  thumbnail_url?: string | null;
  start_seconds?: number | null;
  end_seconds?: number | null;
}

const PLATFORM_META: Record<Clip["platform"], { label: string; Icon: typeof Star }> = {
  best:      { label: "Best Cut",  Icon: Star },
  instagram: { label: "Instagram", Icon: Instagram },
  tiktok:    { label: "TikTok",    Icon: Music2 },
  youtube:   { label: "YouTube",   Icon: Youtube },
  facebook:  { label: "Facebook",  Icon: Facebook },
};

export function ClipsRow({ episodeId }: { episodeId: string }) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [source, setSource] = useState<Clip["source"] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/episodes/${episodeId}/clips`);
        const json = (await res.json()) as { clips: Clip[] };
        if (!cancelled) {
          setClips(json.clips ?? []);
          if (json.clips?.length) setSource(json.clips[0].source);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [episodeId]);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/clips`, { method: "POST" });
      const json = (await res.json()) as { clips: Clip[]; source: Clip["source"] };
      setClips(json.clips ?? []);
      setSource(json.source);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  async function markPosted(clipId: string) {
    setClips((prev) => prev.map((c) => (c.id === clipId ? { ...c, status: "posted" } : c)));
    try {
      await fetch(`/api/episodes/${episodeId}/clips`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
    } catch {
      // ignore — UI already updated
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  }

  if (!loaded || loading) {
    return <div className="px-2 py-3 text-[11px] text-muted">Loading clips…</div>;
  }

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 border-t border-card-border bg-bg/40 px-3 py-3">
        <div className="text-[11px] text-muted">No clips yet for this episode.</div>
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? (<><Sparkles className="mr-2 h-3.5 w-3.5 animate-pulse" /> Generating…</>) : (<><Clapperboard className="mr-2 h-3.5 w-3.5" /> Generate Clips</>)}
        </Button>
      </div>
    );
  }

  const sourceLabel = source === "api" ? "Live · Claude Sonnet 4.6"
    : source === "fallback" ? "Preview mode (API fallback)"
    : "Preview mode";
  const sourceCls = source === "api" ? "border-gold/60 text-gold"
    : source === "fallback" ? "border-amber/60 text-amber"
    : "border-card-border text-muted";

  return (
    <div className="border-t border-card-border bg-bg/40 px-3 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${sourceCls}`}>
          {sourceLabel}
        </span>
        <button
          onClick={generate}
          disabled={generating}
          className="text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-cream disabled:opacity-50"
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
        {clips.map((c) => {
          const meta = PLATFORM_META[c.platform];
          const Icon = meta.Icon;
          const posted = c.status === "posted";
          const hasVideo = !!c.video_url;
          const dur = c.start_seconds != null && c.end_seconds != null ? Math.round(c.end_seconds - c.start_seconds) : null;
          return (
            <div key={c.id} className={`border p-3 ${posted ? "border-emerald/40 bg-emerald/5" : "border-card-border bg-bg"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold">
                  <Icon className="h-3 w-3" /> {meta.label}
                </div>
                <div className="flex items-center gap-2">
                  {dur != null && <span className="text-[10px] text-muted">{dur}s</span>}
                  {posted && <span className="text-[10px] text-emerald">Posted</span>}
                  {!hasVideo && c.start_seconds != null && <span className="text-[10px] text-amber">Rendering…</span>}
                </div>
              </div>
              {hasVideo ? (
                <div className="mt-2 aspect-[9/16] w-full overflow-hidden bg-black">
                  <video
                    src={`/api/clips/${c.id}/video`}
                    poster={c.thumbnail_url ?? undefined}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mt-2 flex aspect-[9/16] w-full items-center justify-center bg-bg/50 text-muted">
                  <Play className="h-6 w-6" />
                </div>
              )}
              <div className="mt-2 text-sm font-medium text-cream">{c.hook}</div>
              <div className="mt-2 line-clamp-3 text-[11px] text-cream/70">{c.caption}</div>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <button
                  onClick={() => copy(`${c.hook}\n\n${c.caption}`, c.id)}
                  className="flex items-center gap-1 text-muted transition-colors hover:text-cream"
                >
                  {copied === c.id ? (<><Check className="h-3 w-3 text-emerald" /> Copied</>) : (<><Copy className="h-3 w-3" /> Copy</>)}
                </button>
                <div className="flex items-center gap-3">
                  {hasVideo && (
                    <a
                      href={`/api/clips/${c.id}/video?download=1`}
                      className="flex items-center gap-1 text-gold transition-colors hover:text-cream"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  )}
                  {!posted && (
                    <button
                      onClick={() => markPosted(c.id)}
                      className="text-emerald transition-colors hover:text-cream"
                    >
                      Mark posted
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

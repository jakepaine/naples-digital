"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@naples/ui";
import { Upload, FileVideo, FileAudio, Image as ImageIcon, FileText, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  email: string;
  clientName: string;
}

const TYPES: { id: "video" | "audio" | "image" | "document"; label: string; Icon: typeof FileVideo }[] = [
  { id: "video", label: "Video", Icon: FileVideo },
  { id: "audio", label: "Audio", Icon: FileAudio },
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "document", label: "Doc", Icon: FileText },
];

export function ContentSubmissionForm({ email, clientName }: Props) {
  const router = useRouter();
  const [assetType, setAssetType] = useState<"video" | "audio" | "image" | "document">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editBrief, setEditBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ phase: "idle" | "signing" | "uploading" | "saving"; pct?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      if (!title.trim()) {
        setTitle(f.name.replace(/\.[^.]+$/, ""));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true); setError(null);

    try {
      let storage_path: string | undefined;
      let source_url: string | undefined;

      if (file) {
        // 1. Get a signed upload URL from our server
        setProgress({ phase: "signing" });
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        });
        if (!signRes.ok) {
          throw new Error("Could not get upload URL");
        }
        const { signedUrl, path } = await signRes.json();

        // 2. Upload the file directly to Supabase Storage
        setProgress({ phase: "uploading", pct: 0 });
        await uploadWithProgress(signedUrl, file, (pct) => setProgress({ phase: "uploading", pct }));
        storage_path = path;
        source_url = path;
      }

      // 3. Save the submission row referencing the storage path
      setProgress({ phase: "saving" });
      const res = await fetch(`/api/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_email: email,
          asset_type: assetType,
          title: title.trim(),
          description: description.trim() || undefined,
          edit_brief: editBrief.trim() || undefined,
          source_url,
          storage_path,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");

      setSuccess(true);
      setProgress(null);
      setTimeout(() => {
        setSuccess(false);
        setTitle(""); setDescription(""); setEditBrief("");
        setFile(null);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-live">New Submission</div>
      <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Drop Asset</h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Asset Type</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {TYPES.map((t) => {
              const Icon = t.Icon;
              const active = assetType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAssetType(t.id)}
                  className={clsx(
                    "flex flex-col items-center gap-1 border py-3 text-[10px] uppercase tracking-wider transition-colors",
                    active ? "border-live bg-live/10 text-live" : "border-card-border text-muted hover:border-live/40 hover:text-cream"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Upload</div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={clsx(
              "mt-2 flex cursor-pointer flex-col items-center justify-center border border-dashed bg-bg/40 px-4 py-8 text-center transition-colors",
              dragOver ? "border-live bg-live/5" : "border-card-border hover:border-live/40"
            )}
          >
            <Upload className={clsx("h-6 w-6", dragOver ? "text-live" : "text-muted")} />
            <div className="mt-2 text-xs text-cream">
              {file ? file.name : "Drop file here or click to browse"}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
              {file ? formatSize(file.size) + " · ready to submit" : "Up to 10 GB · MP4, MOV, WAV, JPG, PDF"}
            </div>
            <input
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title.trim()) {
                    setTitle(f.name.replace(/\.[^.]+$/, ""));
                  }
                }
              }}
            />
          </label>
        </div>

        <Field label="Project Title *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g., David K · Founder Interview"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="What's in the file? Any context for the editor."
          />
        </Field>

        <Field label="Edit Brief">
          <textarea
            value={editBrief}
            onChange={(e) => setEditBrief(e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Length, platforms, color grade, lower-thirds, music notes…"
          />
        </Field>

        {progress && (
          <div className="text-[11px] text-muted">
            {progress.phase === "signing" && "Preparing upload…"}
            {progress.phase === "uploading" && `Uploading${progress.pct != null ? ` (${Math.round(progress.pct)}%)` : "…"}`}
            {progress.phase === "saving" && "Saving submission…"}
          </div>
        )}
        {error && <div className="text-xs text-rose-400">{error}</div>}

        <Button type="submit" disabled={!title.trim() || submitting} className="w-full">
          {success ? (<><CheckCircle2 className="mr-2 h-4 w-4" /> Received</>) : submitting ? "Submitting…" : "Submit for Editing"}
        </Button>
      </form>

      <p className="mt-4 text-[10px] uppercase tracking-wider text-muted">
        Standard turnaround 5 business days. Rush 48h available — ask in the brief.
      </p>
    </Card>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress((e.loaded / e.total) * 100); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(file);
  });
}

const inputCls =
  "w-full border border-card-border bg-bg px-3 py-2 text-sm text-cream placeholder:text-muted/60 focus:border-live focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

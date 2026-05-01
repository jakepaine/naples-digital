import { Card, Badge } from "@naples/ui";
import { Film, Music2, Image as ImageIcon, FileText, ExternalLink, Clock } from "lucide-react";
import type { ContentSubmission } from "@naples/db";

const STATUS_TONE: Record<string, "muted" | "sapphire" | "amber" | "violet" | "emerald" | "gold" | "rose"> = {
  submitted: "muted",
  reviewing: "sapphire",
  editing: "amber",
  review: "violet",
  delivered: "emerald",
  revision: "rose",
};

const ICON_FOR: Record<string, typeof Film> = {
  video: Film,
  audio: Music2,
  image: ImageIcon,
  document: FileText,
};

export function SubmissionList({ submissions }: { submissions: ContentSubmission[] }) {
  return (
    <div className="space-y-4">
      {submissions.map((s) => {
        const Icon = ICON_FOR[s.asset_type] ?? Film;
        return (
          <Card key={s.id}>
            <div className="flex items-start gap-4">
              <div className="border border-live/30 bg-live/5 p-3 text-live">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-heading text-xl tracking-broadcast text-cream">{s.title}</div>
                  <Badge tone={STATUS_TONE[s.status] ?? "muted"}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </Badge>
                  {s.duration_seconds && (
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      <Clock className="-mt-0.5 mr-1 inline h-3 w-3" />
                      {Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s
                    </span>
                  )}
                </div>

                {s.description && (
                  <p className="mt-2 text-sm text-cream/80">{s.description}</p>
                )}

                {s.edit_brief && (
                  <div className="mt-3 border-l-2 border-live/60 pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-live">Edit Brief</div>
                    <p className="mt-1 text-sm text-cream/80">{s.edit_brief}</p>
                  </div>
                )}

                {s.editor_notes && (
                  <div className="mt-3 border border-emerald/30 bg-emerald/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-emerald">Editor Notes</div>
                    <p className="mt-1 text-sm text-cream/80">{s.editor_notes}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                  <div>
                    Submitted {new Date(s.submitted_at).toLocaleDateString()}
                    {s.delivered_at && ` · Delivered ${new Date(s.delivered_at).toLocaleDateString()}`}
                  </div>
                  {s.delivery_url && (
                    <a
                      href={s.delivery_url}
                      className="inline-flex items-center gap-1 text-live transition-colors hover:text-cream"
                      target="_blank"
                      rel="noopener"
                    >
                      Download deliverables <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

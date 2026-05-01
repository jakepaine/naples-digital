"use client";
import { useState } from "react";
import { Card, Button } from "@naples/ui";
import { ExternalLink, Copy, Check } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  magic_link_token: string;
  created_at: string;
}

export function SponsorList({ sponsors, baseUrl }: { sponsors: Sponsor[]; baseUrl: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (sponsors.length === 0) {
    return (
      <Card>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sponsors</div>
        <h2 className="mt-1 font-heading text-xl text-cream">Active Sponsors</h2>
        <p className="mt-3 text-sm text-muted">
          No sponsors yet. Generate a pitch in the Sponsor Pitch Builder to start the pipeline.
        </p>
      </Card>
    );
  }

  function copy(token: string, id: string) {
    const url = `${baseUrl}/s/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sponsors</div>
      <h2 className="mt-1 font-heading text-xl text-cream">Active Sponsors</h2>
      <p className="mt-2 text-xs text-muted">
        Each sponsor has a private analytics portal. Click the link to view, or copy to share with the sponsor.
      </p>
      <div className="mt-4 divide-y divide-card-border">
        {sponsors.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm text-cream">{s.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted">
                magic link · {s.magic_link_token.slice(0, 8)}…
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(s.magic_link_token, s.id)}
                className="flex items-center gap-1.5 border border-card-border px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-gold/60 hover:text-cream"
              >
                {copiedId === s.id ? (<><Check className="h-3 w-3 text-emerald" /> Copied</>) : (<><Copy className="h-3 w-3" /> Copy</>)}
              </button>
              <a href={`${baseUrl}/s/${s.magic_link_token}`} target="_blank" rel="noopener">
                <Button variant="ghost" size="sm">
                  Open <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

# MakerSchool study deliverables

Reference + tooling for ingesting Nick Saraev's "Maker School" course (296 lessons, ~46 unique workflow blueprints) so we can mine it for Naples Digital module patterns.

## Layout

| File | What it is |
|---|---|
| `daily_playbook.md` | Day 1–30 of the course condensed into actionable tasks + tools + automation flags. The thing to read each morning. |
| `tools_inventory.md` | Every tool/platform/service named, with category, pricing, and Nick's affiliate link (substitute Jake's own from Day 10's "70+ Affiliate Programs" sheet). |
| `workflows_library.md` | Plain-English summary of every Make.com / n8n JSON in `~/Documents/Vibecoding/naples-digital/makerschool/`, rated for Naples Digital relevance and port effort. |
| `process-videos.ts` | Node/tsx script: dedupes Loom URLs from `makerschool_lessons.json`, downloads via yt-dlp, sends to Gemini 2.5 Flash, persists extractions to Supabase. Resumable. |
| `package.json` | Dependencies for `process-videos.ts`. |

The corresponding migration is at `platform/packages/db/migrations/0010_makerschool.sql` — five tables: `makerschool_lessons`, `makerschool_videos`, `makerschool_lesson_videos`, `makerschool_action_items`, `makerschool_tools`, `makerschool_workflows`.

## Source data

Lives at `~/Documents/Vibecoding/naples-digital/makerschool/` (moved into the project root for sandbox access). 70 files:

- 3 source dumps: `makerschool_lessons.json` (296 lessons), `.csv`, `makerschool_outline.md` (human-readable)
- ~46 unique workflow JSONs (Make.com + n8n, hash-deduplicated)
- 7 Make.com Accelerator tutorial blueprints (educational, not production)
- 6 n8n tutorial workflows (educational)
- 2 reference files: `Proposal (1).pdf`, `lifestyle-audit.md`

## Running the video extractor

Prereq:

```bash
brew install yt-dlp                    # for Loom downloads
cd platform/scripts/makerschool
pnpm install                           # installs @google/genai + @supabase/supabase-js
```

Apply the migration first (run from platform root):

```bash
# Inspect locally
cat packages/db/migrations/0010_makerschool.sql

# Apply via Supabase MCP or psql/supabase CLI as you do for other migrations
```

Backfill the lessons table once before running the video processor:

```sql
-- Quick load (run via Supabase SQL editor or your usual psql path):
-- See ./load-lessons.sql for the COPY-from-jsonb pattern when you need it.
```

Then process videos via Doppler:

```bash
doppler run --project naples-digital --config prd -- \
  pnpm --filter @naples/makerschool-study process-videos
```

The script is **resumable** — it skips any URL whose `makerschool_videos.status = 'completed'`. Failures are recorded with the error in `makerschool_videos.error` so you can retry by setting them back to `pending`.

## Important constraints

- **~92 unique Loom URLs** across the 296 lessons. Many lessons share the same placeholder URL (one per top-level section), so don't be alarmed when video count is way under lesson count.
- Gemini 2.5 Flash supports up to ~1 hour of video. Loom shares may exceed that — script auto-skips with `status='skipped'` and logs duration.
- 3-second delay between calls per spec.
- We don't keep MP4 files on disk — temp dir is cleaned after each video.

## What the platform should do with this

The 3 named module gaps in Naples Digital (Content Syndication / Email Triage / Stripe Lead-Won → Invoice) all map to specific MakerSchool workflows — see the summary table at the bottom of `workflows_library.md`. After Gemini finishes processing, query:

```sql
-- Highest-leverage modules to port (high relevance + small port effort)
select filename, naples_module, port_effort, complexity, fills_named_gap
from makerschool_workflows
where naples_relevance = 'high' and port_effort = 'S'
order by fills_named_gap nulls last, filename;
```

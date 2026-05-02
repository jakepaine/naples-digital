import { NextResponse } from "next/server";
import { createLead, addLeadEmail } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts a CSV body or a JSON array. CSV columns:
//   name,email,type,goal,value,source
// All but name + email are optional.

export async function POST(req: Request) {
  const tid = await getRequestTenantId(req);
  const ct = req.headers.get("content-type") ?? "";

  type Row = { name: string; email?: string; type?: string; goal?: string; value?: number; source?: string };
  let rows: Row[] = [];

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    rows = Array.isArray(body) ? body as Row[] : (body?.rows ?? []);
  } else {
    const text = await req.text();
    rows = parseCsv(text);
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const created: string[] = [];
  const failed: { row: Row; error: string }[] = [];

  for (const row of rows) {
    if (!row.name) { failed.push({ row, error: "name required" }); continue; }
    const lead = await createLead(tid, {
      name: row.name,
      type: row.type ?? "Prospect",
      goal: row.goal ?? "Discovery",
      value: Number(row.value) || 0,
      source: row.source ?? "CSV Import",
    });
    if (!lead) { failed.push({ row, error: "create failed" }); continue; }
    if (row.email) await addLeadEmail(tid, lead.id, row.email, true);
    created.push(lead.id);
  }

  return NextResponse.json({ created: created.length, failed: failed.length, errors: failed });
}

function parseCsv(text: string): { name: string; email?: string; type?: string; goal?: string; value?: number; source?: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase());
  const out: Array<Record<string, string>> = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    out.push(row);
  }
  return out.map(r => ({
    name: r.name ?? r.full_name ?? r.contact ?? "",
    email: r.email,
    type: r.type ?? r.business_type,
    goal: r.goal,
    value: r.value ? Number(r.value) : undefined,
    source: r.source,
  }));
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { cells.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells.map(c => c.trim());
}

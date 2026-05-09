import { gmail_v1 } from "googleapis";
import { getTenantGmailClient } from "./gmail-client";
import { ingestAndClassify, type InboundEmail } from "./persist-email";

// Pull recent unread Gmail messages for the tenant, classify, persist.
// Idempotent — ingestAndClassify dedupes on (tenant_id, source, source_message_id).
export async function pullGmailInbox(args: {
  tenantId: string;
  maxResults?: number;
  query?: string; // Gmail search query, default: 'in:inbox newer_than:7d'
}): Promise<{
  fetched: number;
  ingested: number;
  errors: string[];
}> {
  const gmail = await getTenantGmailClient(args.tenantId);
  const max = args.maxResults ?? 25;
  const q = args.query ?? "in:inbox newer_than:7d";

  const list = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: max,
  });
  const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  const errors: string[] = [];
  let ingested = 0;

  for (const id of ids) {
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });
      const inbound = parseGmailMessage(msg.data);
      if (!inbound) continue;
      await ingestAndClassify({
        tenantId: args.tenantId,
        inbound,
      });
      ingested++;
    } catch (e) {
      errors.push(`${id}: ${(e as Error).message}`);
    }
  }

  return { fetched: ids.length, ingested, errors };
}

function parseGmailMessage(
  msg: gmail_v1.Schema$Message,
): InboundEmail | null {
  if (!msg.id) return null;
  const headers = (msg.payload?.headers ?? []) as Array<{
    name?: string | null;
    value?: string | null;
  }>;
  const header = (n: string): string | undefined =>
    headers.find((h) => h.name?.toLowerCase() === n.toLowerCase())?.value ?? undefined;

  const from = header("from") ?? "";
  const { name, email } = parseFromHeader(from);
  if (!email) return null; // can't classify without a sender

  const dateStr = header("date");
  const receivedAt = dateStr
    ? new Date(dateStr).toISOString()
    : msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString();

  const { text, html } = extractBody(msg.payload);
  const subject = header("subject") ?? "";

  return {
    source: "gmail",
    source_message_id: msg.id,
    source_thread_id: msg.threadId ?? null,
    from_email: email,
    from_name: name ?? null,
    to_email: header("to") ?? null,
    subject,
    received_at: receivedAt,
    preview: msg.snippet ?? null,
    body_text: text ?? null,
    body_html: html ?? null,
  };
}

function parseFromHeader(raw: string): { name: string | null; email: string | null } {
  // "Sarah Liu <sarah@example.com>" or "sarah@example.com"
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, "") || null, email: match[2].trim() };
  }
  if (raw.includes("@")) return { name: null, email: raw.trim() };
  return { name: null, email: null };
}

function extractBody(payload?: gmail_v1.Schema$MessagePart): {
  text?: string;
  html?: string;
} {
  if (!payload) return {};
  const out: { text?: string; html?: string } = {};
  walk(payload);
  return out;

  function walk(p: gmail_v1.Schema$MessagePart) {
    if (p.mimeType === "text/plain" && !out.text) {
      out.text = decode(p.body?.data);
    }
    if (p.mimeType === "text/html" && !out.html) {
      out.html = decode(p.body?.data);
    }
    for (const part of p.parts ?? []) walk(part);
  }
}

function decode(b64?: string | null): string | undefined {
  if (!b64) return undefined;
  // Gmail uses URL-safe base64
  return Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

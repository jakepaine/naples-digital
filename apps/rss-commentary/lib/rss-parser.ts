// Minimal RSS / Atom parser. Avoids native deps (regex-based) so the
// app builds without binary modules. Handles the 90% case — RSS 2.0
// channel/item, Atom feed/entry. Falls back to "no items" on totally
// unparseable input rather than throwing.
//
// For a tenant who needs richer feed parsing later (e.g. JSON Feed),
// swap in fast-xml-parser; the consumer interface stays the same.

export interface ParsedFeedItem {
  guid: string;
  title: string | null;
  link: string | null;
  published_at: string | null;
  author: string | null;
  excerpt: string | null;
  body_html: string | null;
  body_text: string | null;
}

export interface ParsedFeed {
  title: string | null;
  items: ParsedFeedItem[];
}

export function parseRssXml(xml: string): ParsedFeed {
  const channelTitle = pickFirst(xml, /<channel>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i)
    ?? pickFirst(xml, /<feed[^>]*>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);

  const items: ParsedFeedItem[] = [];
  const isAtom = /<feed[\s>]/.test(xml.slice(0, 800));
  const itemRe = isAtom
    ? /<entry[\s>][\s\S]*?<\/entry>/g
    : /<item[\s>][\s\S]*?<\/item>/g;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = itemRe.exec(xml)) !== null) {
    if (count++ > 80) break;
    const block = m[0];
    items.push(parseItemBlock(block, isAtom));
  }
  return {
    title: cleanText(channelTitle),
    items,
  };
}

function parseItemBlock(block: string, isAtom: boolean): ParsedFeedItem {
  const title = pickFirst(block, /<title[^>]*>([\s\S]*?)<\/title>/i);
  let link: string | null = null;
  if (isAtom) {
    const m =
      block.match(/<link[^>]*\srel=["']alternate["'][^>]*\shref=["']([^"']+)["']/i) ??
      block.match(/<link[^>]*\shref=["']([^"']+)["']/i);
    link = m?.[1] ?? null;
  } else {
    link = pickFirst(block, /<link[^>]*>([^<]+)<\/link>/i);
    if (!link) {
      const m = block.match(/<link[^>]*\shref=["']([^"']+)["']/i);
      link = m?.[1] ?? null;
    }
  }
  const guid =
    pickFirst(block, /<guid[^>]*>([\s\S]*?)<\/guid>/i) ??
    pickFirst(block, /<id[^>]*>([\s\S]*?)<\/id>/i) ??
    link ??
    "";
  const pubDate =
    pickFirst(block, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ??
    pickFirst(block, /<published[^>]*>([\s\S]*?)<\/published>/i) ??
    pickFirst(block, /<updated[^>]*>([\s\S]*?)<\/updated>/i) ??
    pickFirst(block, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
  const author =
    pickFirst(block, /<author[^>]*>([\s\S]*?)<\/author>/i) ??
    pickFirst(block, /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
  const description =
    pickFirst(block, /<description[^>]*>([\s\S]*?)<\/description>/i) ??
    pickFirst(block, /<summary[^>]*>([\s\S]*?)<\/summary>/i) ??
    pickFirst(block, /<content[^>]*>([\s\S]*?)<\/content>/i) ??
    pickFirst(block, /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
  const cdataStripped = stripCdata(description ?? "");
  return {
    guid: cleanText(guid) ?? "",
    title: cleanText(title),
    link: cleanText(link),
    published_at: parseDate(pubDate),
    author: cleanText(author),
    excerpt: cdataStripped ? truncate(stripHtml(cdataStripped), 280) : null,
    body_html: cdataStripped || null,
    body_text: cdataStripped ? stripHtml(cdataStripped) : null,
  };
}

function pickFirst(haystack: string, re: RegExp): string | null {
  const m = haystack.match(re);
  return m?.[1] ?? null;
}

function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanText(s: string | null): string | null {
  if (!s) return null;
  const out = stripCdata(s).trim();
  return out || null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

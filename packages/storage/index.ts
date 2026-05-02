// Tenant-scoped Supabase Storage wrapper.
// Buckets used:
//   raw-uploads/{tenant_id}/{episode_id}.mp4   — client-uploaded source files
//   rendered-clips/{tenant_id}/{clip_id}.mp4   — render-worker output
// Path prefix enforcement is in this module — apps cannot escape the
// tenant prefix because every fn requires tenantId.

import { createServerClient } from "@naples/db";

export const RAW_UPLOADS_BUCKET = "raw-uploads";
export const RENDERED_CLIPS_BUCKET = "rendered-clips";

function tenantPath(tenantId: string, ...parts: string[]): string {
  return [tenantId, ...parts].join("/");
}

export async function getSignedUploadUrl(input: {
  tenantId: string;
  bucket: string;
  filename: string;     // e.g. episode_id + extension
  expiresIn?: number;
}): Promise<{ path: string; signedUrl: string; token: string } | null> {
  const sb = createServerClient();
  const path = tenantPath(input.tenantId, input.filename);
  const { data, error } = await sb.storage
    .from(input.bucket)
    .createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return null;
  return { path, signedUrl: data.signedUrl, token: data.token };
}

export async function getSignedDownloadUrl(input: {
  tenantId: string;
  bucket: string;
  path: string;         // full path including tenant prefix
  expiresIn?: number;
}): Promise<string | null> {
  // Verify the path is within the tenant's prefix — defense against caller-supplied paths
  if (!input.path.startsWith(`${input.tenantId}/`)) return null;
  const sb = createServerClient();
  const { data, error } = await sb.storage
    .from(input.bucket)
    .createSignedUrl(input.path, input.expiresIn ?? 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function uploadBuffer(input: {
  tenantId: string;
  bucket: string;
  filename: string;
  body: Buffer | Blob | Uint8Array;
  contentType?: string;
}): Promise<{ path: string } | null> {
  const sb = createServerClient();
  const path = tenantPath(input.tenantId, input.filename);
  const { error } = await sb.storage
    .from(input.bucket)
    .upload(path, input.body as never, {
      contentType: input.contentType,
      upsert: true,
    });
  if (error) return null;
  return { path };
}

export async function downloadToBuffer(input: {
  tenantId: string;
  bucket: string;
  path: string;
}): Promise<Buffer | null> {
  if (!input.path.startsWith(`${input.tenantId}/`)) return null;
  const sb = createServerClient();
  const { data, error } = await sb.storage
    .from(input.bucket)
    .download(input.path);
  if (error || !data) return null;
  const arr = await data.arrayBuffer();
  return Buffer.from(arr);
}

export async function deleteFile(input: {
  tenantId: string;
  bucket: string;
  path: string;
}): Promise<boolean> {
  if (!input.path.startsWith(`${input.tenantId}/`)) return false;
  const sb = createServerClient();
  const { error } = await sb.storage.from(input.bucket).remove([input.path]);
  return !error;
}

// Run once via SQL or admin: ensure buckets exist. Safe to call repeatedly.
export async function ensureBuckets(): Promise<void> {
  const sb = createServerClient();
  for (const bucket of [RAW_UPLOADS_BUCKET, RENDERED_CLIPS_BUCKET]) {
    const { data: existing } = await sb.storage.getBucket(bucket);
    if (!existing) {
      await sb.storage.createBucket(bucket, { public: false });
    }
  }
}

import { NextResponse } from "next/server";
import {
  getEpisodeById, setEpisodeProcessingState, setEpisodeTranscript,
} from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { getSignedDownloadUrl, RAW_UPLOADS_BUCKET } from "@naples/storage";
import { getTranscriptionClientForTenant } from "@naples/transcription";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const episode = await getEpisodeById(tid, params.id);
  if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  // We stored raw_video_url directly on episodes via setEpisodeRawVideo.
  // For uploads via client-portal that landed in content_submissions, we'd
  // need to look that up too — for now, expect the path to be on the episode.
  const rawPath = (episode as { raw_video_url?: string | null }).raw_video_url;
  if (!rawPath) {
    return NextResponse.json({ error: "Episode has no raw video uploaded" }, { status: 400 });
  }

  const client = await getTranscriptionClientForTenant(tid);
  if (!client) {
    return NextResponse.json({ error: "No AssemblyAI key configured for this tenant" }, { status: 400 });
  }

  await setEpisodeProcessingState(tid, params.id, "transcribing");

  // Generate a temporary signed URL AssemblyAI can fetch
  const audioUrl = await getSignedDownloadUrl({
    tenantId: tid, bucket: RAW_UPLOADS_BUCKET, path: rawPath, expiresIn: 60 * 60 * 4,
  });
  if (!audioUrl) {
    await setEpisodeProcessingState(tid, params.id, "failed");
    return NextResponse.json({ error: "Could not sign download URL for transcription" }, { status: 500 });
  }

  try {
    // Kick off async — caller polls episode.processing_state to track
    const { id } = await client.startTranscription(audioUrl, { speaker_labels: true });
    return NextResponse.json({ ok: true, transcriptId: id, state: "transcribing" });
  } catch (e) {
    await setEpisodeProcessingState(tid, params.id, "failed");
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transcription failed to start" }, { status: 500 });
  }
}

// Polling endpoint — client checks here. If AssemblyAI is done, we save and return.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const url = new URL(req.url);
  const transcriptId = url.searchParams.get("transcriptId");
  if (!transcriptId) return NextResponse.json({ error: "transcriptId required" }, { status: 400 });

  const client = await getTranscriptionClientForTenant(tid);
  if (!client) return NextResponse.json({ error: "No AssemblyAI key" }, { status: 400 });

  try {
    const result = await client.getTranscription(transcriptId);
    if (!result) return NextResponse.json({ state: "transcribing" });
    await setEpisodeTranscript(tid, params.id, {
      id: result.id,
      text: result.text,
      words: result.words,
      audio_duration: result.audio_duration,
      language_code: result.language_code,
    });
    return NextResponse.json({ state: "transcribed", words: result.words.length, duration: result.audio_duration });
  } catch (e) {
    return NextResponse.json({ state: "failed", error: e instanceof Error ? e.message : "Polling failed" }, { status: 500 });
  }
}

"use client";

import { useState } from "react";
import type { VoiceProfileRow } from "@/lib/persist";

const SAMPLE_PLACEHOLDER = `Hey Sarah,

Saw the Glow MedSpa write-up on Instagram — great work on the Naples expansion.

Quick question: are you the right person to chat about how we'd help with patient inbound? We do this for ~12 spas in Florida; happy to send over a quick case study if useful.

— Jake`;

export function Calibrator({
  initialProfile,
  tenant,
}: {
  initialProfile: VoiceProfileRow | null;
  tenant: { id: string; slug: string; name: string };
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [samples, setSamples] = useState<string[]>(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stub, setStub] = useState(false);

  function setSampleAt(i: number, value: string) {
    setSamples((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function addSample() {
    setSamples((prev) => [...prev, ""]);
  }

  function removeSample(i: number) {
    setSamples((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function calibrate() {
    setBusy(true);
    setError(null);
    setStub(false);
    try {
      const res = await fetch("/api/voice-profile/calibrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ samples }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "calibration failed");
      setProfile(json.profile);
      setStub(!!json.stub);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled() {
    if (!profile) return;
    setBusy(true);
    try {
      await fetch("/api/voice-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !profile.enabled }),
      });
      setProfile({ ...profile, enabled: !profile.enabled });
    } finally {
      setBusy(false);
    }
  }

  const fp = profile?.fingerprint as any;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Email Tone Calibrator</h1>
          <p className="text-xs text-gray-500">
            <span className="font-mono">{tenant.slug}</span> · paste 3 sent
            emails. Claude fingerprints your voice. Downstream copy modules
            mirror it.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold mb-3">Samples</h2>
          <p className="text-xs text-gray-500 mb-3">
            Paste actual emails you&apos;ve sent — not drafts, not AI output.
            3 is the minimum for a useful fingerprint; 5-7 gives a sharper
            profile.
          </p>
          <div className="space-y-3">
            {samples.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Sample {i + 1}</span>
                  {samples.length > 1 && (
                    <button
                      onClick={() => removeSample(i)}
                      className="text-rose-700 underline"
                    >
                      remove
                    </button>
                  )}
                </div>
                <textarea
                  value={s}
                  onChange={(e) => setSampleAt(i, e.target.value)}
                  rows={6}
                  placeholder={i === 0 ? SAMPLE_PLACEHOLDER : "Paste another email…"}
                  className="block w-full rounded border border-gray-300 px-3 py-2 text-xs font-mono"
                />
              </div>
            ))}
            <button
              onClick={addSample}
              type="button"
              className="text-xs text-blue-700 underline"
            >
              + Add another sample
            </button>
          </div>
          <button
            onClick={calibrate}
            disabled={busy}
            className="mt-4 px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
          >
            {busy
              ? "Calibrating…"
              : profile
                ? "Re-calibrate"
                : "Calibrate voice"}
          </button>
          {error && <div className="text-xs text-rose-700 mt-2">{error}</div>}
          {stub && (
            <div className="mt-2 text-xs text-amber-700">
              Stub mode — ANTHROPIC_API_KEY not configured. Set it in Doppler
              to extract a real fingerprint.
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Current profile</h2>
          {!profile && (
            <div className="rounded border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No profile yet. Paste samples on the left and click Calibrate.
            </div>
          )}
          {profile && (
            <div className="space-y-4">
              <div className="rounded border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    Calibrated{" "}
                    {new Date(profile.generated_at).toLocaleString()} from{" "}
                    {profile.samples_count} sample
                    {profile.samples_count === 1 ? "" : "s"}
                  </div>
                  <button
                    onClick={toggleEnabled}
                    disabled={busy}
                    className={
                      profile.enabled
                        ? "text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800"
                        : "text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
                    }
                  >
                    {profile.enabled ? "Enabled · click to disable" : "Disabled · click to enable"}
                  </button>
                </div>
                {profile.voice_summary && (
                  <div className="text-sm leading-relaxed text-gray-800 italic border-l-2 border-emerald-300 pl-3">
                    {profile.voice_summary}
                  </div>
                )}
                {Array.isArray(profile.quality_flags) &&
                  profile.quality_flags.length > 0 && (
                    <div className="text-xs text-amber-700">
                      Quality flags: {profile.quality_flags.join(", ")}
                    </div>
                  )}
              </div>

              {fp && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <FpField label="Sentence shape" value={fp.sentence_shape} />
                  <FpField label="Register" value={fp.vocabulary_register} />
                  <FpField label="Punctuation" value={fp.punctuation_quirks} />
                  <FpField label="Paragraphs" value={fp.paragraph_style} />
                  <FpList label="Greetings" items={fp.greetings} />
                  <FpList label="Sign-offs" items={fp.signoffs} />
                  <FpList label="Do words" items={fp.do_words} tone="ok" />
                  <FpList label="Don't words" items={fp.dont_words} tone="alert" />
                  {Array.isArray(fp.signature_phrases) &&
                    fp.signature_phrases.length > 0 && (
                      <div className="col-span-2">
                        <FpList
                          label="Signature phrases"
                          items={fp.signature_phrases}
                        />
                      </div>
                    )}
                  {fp.one_line_voice && (
                    <div className="col-span-2 rounded bg-gray-50 px-3 py-2 text-xs italic">
                      “{fp.one_line_voice}”
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FpField({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded border border-gray-200 p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm">{String(value ?? "—")}</div>
    </div>
  );
}

function FpList({
  label,
  items,
  tone,
}: {
  label: string;
  items: any;
  tone?: "ok" | "alert";
}) {
  const arr = Array.isArray(items) ? items : [];
  return (
    <div className="rounded border border-gray-200 p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {arr.length === 0 ? (
          <span className="text-xs text-gray-400">—</span>
        ) : (
          arr.map((s: string, i: number) => (
            <span
              key={i}
              className={
                tone === "ok"
                  ? "rounded bg-emerald-50 text-emerald-800 text-[11px] px-1.5 py-0.5 font-mono"
                  : tone === "alert"
                    ? "rounded bg-rose-50 text-rose-800 text-[11px] px-1.5 py-0.5 font-mono"
                    : "rounded bg-gray-100 text-gray-700 text-[11px] px-1.5 py-0.5 font-mono"
              }
            >
              {s}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

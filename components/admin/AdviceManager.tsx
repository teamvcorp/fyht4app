"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveAdvice,
  deleteAdvice,
  generateAdviceVoice,
  type AdviceView,
} from "@/app/actions/master";
import { inputClass } from "@/components/admin/Field";

type Row = AdviceView & { _key: string };

export function AdviceManager({
  initial,
  voiceReady,
}: {
  initial: AdviceView[];
  voiceReady: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.map((r) => ({ ...r, _key: r.id }))
  );

  function addRow() {
    setRows((rs) => [
      ...rs,
      { _key: `new-${Date.now()}`, id: "", text: "", enabled: true },
    ]);
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r._key !== key));
  }
  function patch(key: string, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...next } : r)));
  }

  return (
    <div className="flex flex-col gap-3">
      {!voiceReady && (
        <p className="rounded-2xl bg-donow-50 px-3 py-2 text-xs text-donow">
          ElevenLabs isn&apos;t configured (set <b>ELEVEN_API_KEY</b>). You can
          still write lines — the device&apos;s text-to-speech will read them
          until you generate a voice.
        </p>
      )}
      {rows.map((row) => (
        <AdviceRow
          key={row._key}
          row={row}
          voiceReady={voiceReady}
          onPatch={(n) => patch(row._key, n)}
          onRemove={() => removeRow(row._key)}
        />
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-2xl bg-brand-50 px-5 py-3 text-sm font-bold text-brand active:scale-95"
      >
        + Add advice line
      </button>
    </div>
  );
}

function AdviceRow({
  row,
  voiceReady,
  onPatch,
  onRemove,
}: {
  row: Row;
  voiceReady: boolean;
  onPatch: (n: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [voicing, setVoicing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const r = await saveAdvice({
        id: row.id || undefined,
        text: row.text,
        enabled: row.enabled,
      });
      if (r.ok) {
        if (r.id && !row.id) onPatch({ id: r.id });
        setSaved(true);
        router.refresh();
      } else {
        setError(r.error ?? "Save failed.");
      }
    });
  }

  function generate() {
    if (!row.id) return;
    setError(null);
    setVoicing(true);
    start(async () => {
      const r = await generateAdviceVoice(row.id);
      setVoicing(false);
      if (r.ok && r.audioUrl) {
        onPatch({ audioUrl: r.audioUrl });
        router.refresh();
      } else {
        setError(r.error ?? "Voice generation failed.");
      }
    });
  }

  function remove() {
    if (row.id && !confirm("Delete this advice line?")) return;
    start(async () => {
      if (row.id) await deleteAdvice(row.id);
      onRemove();
      router.refresh();
    });
  }

  return (
    <div className="fyht-card flex flex-col gap-2 p-4">
      <textarea
        className={`${inputClass} resize-none`}
        rows={2}
        value={row.text}
        placeholder="Listen up, patience is a muscle — train it daily…"
        onChange={(e) => {
          onPatch({ text: e.target.value });
          setSaved(false);
        }}
      />

      {/* Voice (ElevenLabs) */}
      <div className="flex flex-col gap-1.5">
        {row.audioUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={row.audioUrl} controls className="w-full" />
        )}
        <div className="flex items-center gap-2">
          {!row.id ? (
            <span className="text-[11px] text-ink/45">
              Save the line, then generate its voice.
            </span>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={pending || !voiceReady}
              className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand active:scale-95 disabled:opacity-50"
            >
              {voicing
                ? "Generating…"
                : row.audioUrl
                  ? "🔊 Regenerate voice"
                  : "🔊 Generate voice"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink/45">
          Uses your ElevenLabs &quot;master&quot; voice — generated once and
          cached. Regenerate after editing the text.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => {
              onPatch({ enabled: e.target.checked });
              setSaved(false);
            }}
            className="h-4 w-4 accent-brand"
          />
          Active
        </label>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
        >
          {pending && !voicing ? "Saving…" : row.id ? "Save" : "Add"}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-fyht">Saved ✓</span>
        )}

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="ml-auto px-2 text-lg text-ink/40 hover:text-donow"
          aria-label="Delete"
        >
          ×
        </button>
      </div>

      {error && <p className="text-xs font-medium text-donow">{error}</p>}
    </div>
  );
}

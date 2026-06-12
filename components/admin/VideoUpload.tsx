"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { getSignedVideoUrl } from "@/app/actions/admin";

export function VideoUpload({
  value,
  onChange,
}: {
  value: { videoUrl?: string; videoPathname?: string };
  onChange: (v: { videoUrl?: string; videoPathname?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    setPreviewUrl(null);
    try {
      const result = await upload(
        `taekwondo/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`,
        file,
        {
          access: "private",
          contentType: file.type,
          handleUploadUrl: "/api/admin/blob-upload",
          onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
        }
      );
      onChange({ videoUrl: result.url, videoPathname: result.pathname });
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setProgress(null);
    }
  }

  async function preview() {
    if (!value.videoPathname) return;
    setLoadingPreview(true);
    const url = await getSignedVideoUrl(value.videoPathname);
    setPreviewUrl(url);
    setLoadingPreview(false);
  }

  const hasVideo = !!value.videoUrl;

  return (
    <div className="rounded-2xl bg-brand-50/50 p-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
        >
          {progress !== null
            ? `Uploading… ${progress}%`
            : hasVideo
              ? "Replace video"
              : "🎬 Upload video"}
        </button>

        {hasVideo && progress === null && (
          <>
            <button
              type="button"
              onClick={preview}
              disabled={loadingPreview}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-brand ring-1 ring-brand/15 active:scale-95"
            >
              {loadingPreview ? "Loading…" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ videoUrl: undefined, videoPathname: undefined });
                setPreviewUrl(null);
              }}
              className="text-xs font-semibold text-donow"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {hasVideo && progress === null && (
        <p className="mt-1.5 truncate text-[11px] text-ink/45">
          ✓ {value.videoPathname}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-donow">{error}</p>
      )}
      {previewUrl && (
        <video
          src={previewUrl}
          controls
          className="mt-2 w-full rounded-xl bg-black"
        />
      )}
    </div>
  );
}

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/admin";

// Client uploads (large video clips) post here to mint a scoped, admin-only
// upload token. The blob is created with access "private".
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await requireAdmin();
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-m4v",
            "video/x-matroska",
            // Master advice voice clips
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/x-wav",
            "audio/webm",
            "audio/ogg",
            "audio/mp4",
            "audio/x-m4a",
            "audio/aac",
          ],
          maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client receives the blob URL directly from upload().
      },
    });
    return Response.json(json);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}

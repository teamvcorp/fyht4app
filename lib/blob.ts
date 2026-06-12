import {
  put,
  del,
  head,
  issueSignedToken,
  presignUrl,
  type PutBlobResult,
} from "@vercel/blob";

/**
 * Private Vercel Blob helpers — scaffolding for future book covers, character
 * art, and video. Uploads default to `access: "private"`; serve these through a
 * signed URL (see @vercel/blob `getDownloadUrl` / `presignUrl`) rather than
 * linking the raw blob URL.
 */
export async function uploadPrivate(
  pathname: string,
  body: string | Buffer | Blob | ArrayBuffer | ReadableStream,
  contentType?: string
): Promise<PutBlobResult> {
  return put(pathname, body, {
    access: "private",
    addRandomSuffix: true,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export async function blobExists(url: string): Promise<boolean> {
  try {
    await head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mints a short-lived signed URL to view a PRIVATE blob (e.g. a lesson video).
 * Private blob URLs aren't directly fetchable — playback must go through this.
 */
export async function signedBlobUrl(pathname: string): Promise<string> {
  const signedToken = await issueSignedToken({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    pathname,
  });
  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname,
    access: "private",
  });
  return presignedUrl;
}

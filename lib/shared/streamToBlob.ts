export default async function streamToBlob(
  stream: ReadableStream,
  mimeType?: string
): Promise<Blob> {
  if (mimeType != null && typeof mimeType !== "string") {
    throw new Error("Invalid mimeType, expected a string.");
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as any) {
    // Ensure the chunk is a Uint8Array
    chunks.push(
      typeof chunk === "string"
        ? new Uint8Array(Buffer.from(chunk))
        : new Uint8Array(chunk)
    );
  }

  return new Blob(chunks, { type: mimeType });
}

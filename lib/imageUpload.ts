import { GraphQLError } from "graphql";
import heicConvert from "heic-convert";
import sharp from "sharp";

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

function isHeicLike(contentType?: string | null, filename?: string | null): boolean {
  const normalizedType = contentType?.trim().toLowerCase() ?? "";
  const normalizedName = filename?.trim().toLowerCase() ?? "";

  return (
    normalizedType.includes("heic") ||
    normalizedType.includes("heif") ||
    normalizedName.endsWith(".heic") ||
    normalizedName.endsWith(".heif")
  );
}

async function convertHeicToJpegBuffer(inputBuffer: Buffer): Promise<Buffer> {
  const converted = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.9,
  });

  return Buffer.isBuffer(converted) ? converted : Buffer.from(converted as ArrayBuffer);
}

export async function normalizeBillImageBuffer(
  inputBuffer: Buffer,
  options?: { contentType?: string | null; filename?: string | null }
): Promise<Buffer> {
  const heicCandidate = isHeicLike(options?.contentType, options?.filename);

  try {
    const sourceBuffer = heicCandidate ? await convertHeicToJpegBuffer(inputBuffer) : inputBuffer;

    return await sharp(sourceBuffer)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
  } catch (primaryError) {
    if (!heicCandidate) {
      try {
        const convertedHeicBuffer = await convertHeicToJpegBuffer(inputBuffer);

        return await sharp(convertedHeicBuffer)
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
      } catch {
        // Fall through to the shared error below.
      }
    }

    throw new GraphQLError("Failed to process uploaded image. If this is a HEIC photo, the file may be encoded in an unsupported variant.", {
      extensions: {
        code: "BAD_USER_INPUT",
        cause: primaryError instanceof Error ? primaryError.message : undefined,
      },
    });
  }
}

export async function processAndSaveBillImage(file: File): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await normalizeBillImageBuffer(inputBuffer, {
    contentType: file.type,
    filename: file.name,
  });

  if (outputBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new GraphQLError("Image must be 2MB or smaller after conversion", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;
}

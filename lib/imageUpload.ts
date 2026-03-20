import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { GraphQLError } from "graphql";
import sharp from "sharp";

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

function uniqueFilename(): string {
  const ts = Date.now();
  const rand = randomBytes(8).toString("hex");
  return `${ts}-${rand}.jpg`;
}

export async function normalizeBillImageBuffer(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new GraphQLError("Failed to process uploaded image", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

export async function processAndSaveBillImage(file: File): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await normalizeBillImageBuffer(inputBuffer);

  if (outputBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new GraphQLError("Image must be 2MB or smaller after conversion", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const filename = uniqueFilename();
  const outputDir = uploadsDir();

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, filename), outputBuffer);

  return `/uploads/${filename}`;
}

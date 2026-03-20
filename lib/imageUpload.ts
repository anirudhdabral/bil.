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

export async function processAndSaveBillImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new GraphQLError("Only image files are allowed", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new GraphQLError("Image must be 2MB or smaller", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new GraphQLError("Failed to process uploaded image", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const filename = uniqueFilename();
  const outputDir = uploadsDir();

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, filename), outputBuffer);

  return `/uploads/${filename}`;
}

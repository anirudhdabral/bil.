import { GraphQLError } from "graphql";

import { normalizeBillImageBuffer } from "../../../../lib/imageUpload";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new GraphQLError("Image file is required", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await normalizeBillImageBuffer(inputBuffer, {
      contentType: file.type,
      filename: file.name,
    });

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof GraphQLError ? error.message : "Failed to convert image";
    const status = error instanceof GraphQLError ? 400 : 500;

    return Response.json(
      {
        error: message,
      },
      { status }
    );
  }
}

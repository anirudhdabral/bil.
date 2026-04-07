import { ApolloServer } from "@apollo/server";
import { GraphQLError } from "graphql";
import { getServerSession } from "next-auth";

import { resolvers } from "../../../graphql/resolvers";
import { authOptions } from "../../../lib/auth";
import { typeDefs } from "../../../graphql/schema";
import { connectToDatabase } from "../../../lib/mongodb";
import { USER_ROLES } from "../../../models/User";

export const runtime = "nodejs";

type HeaderLikeMap = Map<string, string>;
type GraphQLRequestBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

function buildApolloHeaders(headers: Headers): HeaderLikeMap {
  const headerMap: HeaderLikeMap = new Map();
  headers.forEach((value, key) => {
    headerMap.set(key, value);
  });
  return headerMap;
}

function isMultipartRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("multipart/form-data");
}

function setPathValue(target: Record<string, unknown>, dottedPath: string, value: unknown): void {
  const parts = dottedPath.split(".");
  let current: unknown = target;

  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    const isLast = i === parts.length - 1;

    if (!current || typeof current !== "object") {
      throw new GraphQLError("Invalid upload map path", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const currentRecord = current as Record<string, unknown>;

    if (isLast) {
      currentRecord[key] = value;
      return;
    }

    if (currentRecord[key] == null) {
      const nextIsIndex = /^\d+$/.test(parts[i + 1]);
      currentRecord[key] = nextIsIndex ? [] : {};
    }

    current = currentRecord[key];
  }
}

async function parseMultipartGraphQLBody(request: Request): Promise<GraphQLRequestBody> {
  const formData = await request.formData();
  const operationsRaw = formData.get("operations");
  const mapRaw = formData.get("map");

  if (typeof operationsRaw !== "string" || typeof mapRaw !== "string") {
    throw new GraphQLError("Multipart upload requires operations and map fields", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  let operations: GraphQLRequestBody;
  let uploadMap: Record<string, string[]>;

  try {
    operations = JSON.parse(operationsRaw) as GraphQLRequestBody;
    uploadMap = JSON.parse(mapRaw) as Record<string, string[]>;
  } catch {
    throw new GraphQLError("Invalid multipart payload", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  for (const [fileKey, targetPaths] of Object.entries(uploadMap)) {
    const fileValue = formData.get(fileKey);

    if (!(fileValue instanceof File)) {
      throw new GraphQLError("Invalid uploaded file", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    for (const targetPath of targetPaths) {
      setPathValue(operations as Record<string, unknown>, targetPath, fileValue);
    }
  }

  return operations;
}

function responseFromGraphQLError(error: GraphQLError, status = 400): Response {
  return Response.json(
    {
      errors: [
        {
          message: error.message,
          extensions: error.extensions,
        },
      ],
    },
    { status }
  );
}

async function createGraphQLResponse(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let body: GraphQLRequestBody | undefined;

  if (request.method !== "GET") {
    try {
      body = isMultipartRequest(request)
        ? await parseMultipartGraphQLBody(request)
        : ((await request.json()) as GraphQLRequestBody);
    } catch (error) {
      if (error instanceof GraphQLError) {
        return responseFromGraphQLError(error, 400);
      }

      return responseFromGraphQLError(
        new GraphQLError("Invalid request body", {
          extensions: { code: "BAD_USER_INPUT" },
        }),
        400
      );
    }
  }

  const session = await getServerSession(authOptions);
  const currentUser = session?.user;

  if (currentUser && !currentUser.approved && currentUser.role !== USER_ROLES.SUPER_ADMIN) {
    return Response.json(
      {
        errors: [
          {
            message: "Your account is pending Admin approval.",
            extensions: { code: "FORBIDDEN" },
          },
        ],
      },
      { status: 403 }
    );
  }

  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      headers: buildApolloHeaders(request.headers) as never,
      search: url.search,
      body,
    },
    context: async () => {
      await connectToDatabase();
      return {
        currentUserEmail: currentUser?.email?.toLowerCase() ?? null,
        currentUserRole: currentUser?.role ?? null,
      };
    },
  });

  const responseHeaders = new Headers();
  for (const [key, value] of response.headers) {
    responseHeaders.set(key, value);
  }

  const status = response.status ?? 200;
  const responseBody = response.body;

  if (responseBody.kind === "complete") {
    return new Response(responseBody.string, {
      status,
      headers: responseHeaders,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of responseBody.asyncIterator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request): Promise<Response> {
  return createGraphQLResponse(request);
}

export async function POST(request: Request): Promise<Response> {
  return createGraphQLResponse(request);
}

"use client";

import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  type FetchResult,
  type TypePolicies,
} from "@apollo/client";
import { print } from "graphql";

const GRAPHQL_ENDPOINT = "/api/graphql";

type JsonObject = Record<string, unknown>;

type ExtractedFiles = {
  clone: unknown;
  files: Array<{ file: File; path: string }>;
};

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function extractFiles(value: unknown, path = "variables"): ExtractedFiles {
  if (isFile(value)) {
    return {
      clone: null,
      files: [{ file: value, path }],
    };
  }

  if (Array.isArray(value)) {
    const files: Array<{ file: File; path: string }> = [];
    const clone = value.map((item, index) => {
      const extracted = extractFiles(item, `${path}.${index}`);
      files.push(...extracted.files);
      return extracted.clone;
    });

    return { clone, files };
  }

  if (value && typeof value === "object") {
    const files: Array<{ file: File; path: string }> = [];
    const clone: JsonObject = {};

    for (const [key, child] of Object.entries(value as JsonObject)) {
      const extracted = extractFiles(child, `${path}.${key}`);
      files.push(...extracted.files);
      clone[key] = extracted.clone;
    }

    return { clone, files };
  }

  return { clone: value, files: [] };
}

function buildRequestBody(query: string, operationName: string | undefined, variables: JsonObject) {
  const extracted = extractFiles(variables);

  if (extracted.files.length === 0) {
    return {
      body: JSON.stringify({ query, operationName, variables }),
      headers: {
        "content-type": "application/json",
        "apollo-require-preflight": "true",
      } as HeadersInit,
    };
  }

  const formData = new FormData();
  const map: Record<string, string[]> = {};

  extracted.files.forEach(({ path }, index) => {
    map[index.toString()] = [path];
  });

  formData.append(
    "operations",
    JSON.stringify({
      query,
      operationName,
      variables: extracted.clone,
    })
  );
  formData.append("map", JSON.stringify(map));

  extracted.files.forEach(({ file }, index) => {
    formData.append(index.toString(), file);
  });

  return {
    body: formData,
    headers: { "apollo-require-preflight": "true" } as HeadersInit,
  };
}

function createUploadLink(): ApolloLink {
  return new ApolloLink((operation) => {
    return new Observable((observer) => {
      const query = print(operation.query);
      const variables = (operation.variables ?? {}) as JsonObject;

      const { body, headers } = buildRequestBody(query, operation.operationName, variables);

      fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        body,
        headers,
        credentials: "same-origin",
      })
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Network error");
          }

          return (await response.json()) as FetchResult;
        })
        .then((result) => {
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  });
}

const typePolicies: TypePolicies = {
  Home: { keyFields: ["id"] },
  BillCategory: { keyFields: ["id"] },
  Bill: { keyFields: ["id"] },
  Query: {
    fields: {
      // Merge paginated / filtered bill lists into the cache by their args key
      getBillsByHome: { keyArgs: ["homeId"] },
      getBillsByCategory: { keyArgs: ["categoryId"] },
      getCategoriesByHome: { keyArgs: ["homeId"] },
    },
  },
};

export function createApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache({ typePolicies }),
    link: createUploadLink(),
  });
}

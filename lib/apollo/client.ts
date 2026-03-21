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
import { getCookie, setCookie } from "../cookies";

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
    const context = operation.getContext();
    const isMutation = operation.query.definitions.some(
      (def) => "operation" in def && def.operation === "mutation"
    );

    const queryStr = print(operation.query);
    const variables = (operation.variables ?? {}) as JsonObject;
    const cacheKey = `apc_${operation.operationName || "anon"}_${JSON.stringify(variables).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;

    // Skip cookie cache for mutations, explicit skips, or network-only policies
    const skipCache = 
      isMutation || 
      context.skipCookieCache || 
      context.fetchPolicy === "network-only" || 
      context.fetchPolicy === "no-cache";

    if (!skipCache) {
      const cached = getCookie(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as FetchResult;
          return new Observable((observer) => {
            observer.next(parsed);
            observer.complete();
          });
        } catch {
          // Bad data, proceed to fetch
        }
      }
    }

    return new Observable((observer) => {
      const { body, headers } = buildRequestBody(queryStr, operation.operationName, variables);

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
          if (isMutation && result.data && !result.errors) {
            // After any successful mutation, purge all Apollo cookie-cache entries
            // so that refetchQueries always fetch fresh data from the server.
            if (typeof document !== "undefined") {
              const cookieNames = document.cookie
                .split(";")
                .map((entry) => entry.split("=")[0]?.trim())
                .filter((name): name is string => !!name && name.startsWith("apc_"));
              cookieNames.forEach((name) => {
                document.cookie = `${name}=;Max-Age=0;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
              });
            }
          }

          // Only cache queries that succeeded and didn't have errors
          if (!isMutation && result.data && !result.errors) {
            try {
              const str = JSON.stringify(result);
              // Simple check for cookie size limit (approx 4KB)
              if (str.length < 3800) {
                setCookie(cacheKey, str);
              }
            } catch {
              // Ignore serialization/cookie errors
            }
          }
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

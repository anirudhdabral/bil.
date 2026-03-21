import { signOut } from "next-auth/react";

import { deleteCookie } from "./cookies";

function clearAccessibleCookies() {
  if (typeof document === "undefined") {
    return;
  }

  const cookieNames = document.cookie
    .split(";")
    .map((entry) => entry.split("=")[0]?.trim())
    .filter(Boolean);

  cookieNames.forEach((name) => {
    if (!name) {
      return;
    }

    deleteCookie(name);
  });
}

function clearClientStorage() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.clear();
  } catch {
    // Storage may be unavailable in some contexts
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // Storage may be unavailable in some contexts
  }
}

export async function logoutAndClearSession() {
  // Clear all client-side caches before signing out
  clearAccessibleCookies();
  clearClientStorage();

  const result = await signOut({
    callbackUrl: "/login",
    redirect: false,
  });

  // Clear again after NextAuth finishes (it may set cookies during signOut)
  clearAccessibleCookies();
  clearClientStorage();

  if (typeof window !== "undefined") {
    // Hard navigation ensures the Apollo in-memory cache and all React state
    // are fully discarded — no stale data can persist after login.
    window.location.replace(result.url || "/login");
  }
}


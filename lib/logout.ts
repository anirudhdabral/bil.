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

export async function logoutAndClearSession() {
  clearAccessibleCookies();

  const result = await signOut({
    callbackUrl: "/login",
    redirect: false,
  });

  clearAccessibleCookies();

  if (typeof window !== "undefined") {
    window.location.replace(result.url || "/login");
  }
}

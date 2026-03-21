"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { LoadingSpinner } from "./LoadingSpinner";
import { deleteCookie, getCookie, setCookie } from "../../lib/cookies";

type CachedSession = {
  user?: {
    approved?: boolean;
    role?: string;
  };
} | null | undefined;

let lastCookieValue: string | null | undefined;
let lastCachedSessionSnapshot: CachedSession;

function subscribeToAuthCookie(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onFocus = () => onStoreChange();
  window.addEventListener("focus", onFocus);

  return () => {
    window.removeEventListener("focus", onFocus);
  };
}

function readCachedSessionSnapshot(): CachedSession {
  const cookieData = getCookie("bm_auth_session");

  if (cookieData === lastCookieValue) {
    return lastCachedSessionSnapshot;
  }

  lastCookieValue = cookieData;

  if (!cookieData) {
    lastCachedSessionSnapshot = null;
    return lastCachedSessionSnapshot;
  }

  try {
    lastCachedSessionSnapshot = JSON.parse(cookieData) as CachedSession;
  } catch {
    lastCachedSessionSnapshot = null;
  }

  return lastCachedSessionSnapshot;
}

function readCachedSessionServerSnapshot(): CachedSession {
  return undefined;
}

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const cachedSession = useSyncExternalStore(
    subscribeToAuthCookie,
    readCachedSessionSnapshot,
    readCachedSessionServerSnapshot,
  );

  useEffect(() => {
    if (status === "authenticated" && session) {
      setCookie("bm_auth_session", JSON.stringify(session));
      lastCookieValue = null;
    } else if (status === "unauthenticated") {
      deleteCookie("bm_auth_session");
      lastCookieValue = null;
    }
  }, [session, status]);

  const activeSession = session || cachedSession;
  const isLoginRoute = pathname === "/login";
  const isPendingRoute = pathname === "/pending";
  const isApproved = Boolean(activeSession?.user?.approved || activeSession?.user?.role === "SUPER_ADMIN");
  const cookieReady = cachedSession !== undefined;

  useEffect(() => {
    if (!cookieReady) {
      return;
    }

    if (status === "unauthenticated" && !cachedSession && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    if (activeSession) {
      if (!isApproved && !isPendingRoute) {
        router.replace("/pending");
        return;
      }

      if ((isLoginRoute || isPendingRoute) && isApproved) {
        router.replace("/");
      }
    }
  }, [activeSession, cachedSession, cookieReady, isApproved, isLoginRoute, isPendingRoute, router, status]);

  const isLoading = (status === "loading" || !cookieReady) && !cachedSession;
  const isFullyUnauthenticated = cookieReady && status === "unauthenticated" && !cachedSession;

  if (!isLoginRoute && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isLoginRoute && (isFullyUnauthenticated || (activeSession && !isApproved && !isPendingRoute))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">
            {isFullyUnauthenticated ? "Redirecting to login..." : "Redirecting to approval queue..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

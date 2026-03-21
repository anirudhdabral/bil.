"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { LoadingSpinner } from "./LoadingSpinner";
import { getCookie, setCookie, deleteCookie } from "../../lib/cookies";

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Use a constant for the cached session from cookie instead of state to avoid lint errors
  // We only read it once on mount (client-side)
  const cachedSession = useMemo(() => {
    if (typeof document === "undefined") return null;
    const cookieData = getCookie("bm_auth_session");
    if (cookieData) {
      try {
        return JSON.parse(cookieData);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Sync session to cookie (side effect)
  useEffect(() => {
    if (status === "authenticated" && session) {
      setCookie("bm_auth_session", JSON.stringify(session));
    } else if (status === "unauthenticated") {
      deleteCookie("bm_auth_session");
    }
  }, [session, status]);

  const activeSession = session || cachedSession;
  const isLoginRoute = pathname === "/login";
  const isPendingRoute = pathname === "/pending";
  const isApproved = Boolean(activeSession?.user?.approved || activeSession?.user?.role === "SUPER_ADMIN");

  useEffect(() => {
    // If we have NO session (NextAuth says unauth AND no cookie), redirect to login
    if (status === "unauthenticated" && !cachedSession && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    // If we have a session (either NextAuth or cookie)
    if (activeSession) {
      if (!isApproved && !isPendingRoute) {
        router.replace("/pending");
        return;
      }

      if ((isLoginRoute || isPendingRoute) && isApproved) {
        router.replace("/");
      }
    }
  }, [activeSession, isApproved, isLoginRoute, isPendingRoute, router, status, cachedSession]);

  const isLoading = status === "loading" && !cachedSession;
  const isFullyUnauthenticated = status === "unauthenticated" && !cachedSession;

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

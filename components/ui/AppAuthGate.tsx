"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingSpinner } from "./LoadingSpinner";

export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoginRoute = pathname === "/login";
  const isPendingRoute = pathname === "/pending";
  const isApproved = Boolean(session?.user?.approved || session?.user?.role === "SUPER_ADMIN");

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    if (!isApproved && !isPendingRoute) {
      router.replace("/pending");
      return;
    }

    if ((isLoginRoute || isPendingRoute) && isApproved) {
      router.replace("/");
    }
  }, [isApproved, isLoginRoute, isPendingRoute, router, status]);

  if (!isLoginRoute && status === "loading") {
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

  if (!isLoginRoute && (status === "unauthenticated" || (status === "authenticated" && !isApproved && !isPendingRoute))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">
            {status === "unauthenticated" ? "Redirecting to login..." : "Redirecting to approval queue..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

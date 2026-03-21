"use client";

import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiClock, FiLogOut } from "react-icons/fi";

import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { RefetchButton } from "../../components/ui/RefetchButton";

type SignInStatus = {
  paused: boolean;
  pendingUsers: number;
  maxPendingUsers: number;
};

export default function PendingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [signInStatus, setSignInStatus] = useState<SignInStatus | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (session.user?.approved || session.user?.role === "SUPER_ADMIN") {
      router.replace("/");
    }
  }, [router, session, status]);

  const loadSignInStatus = async () => {
    try {
      const response = await fetch("/api/auth/signin-status", {
        cache: "no-store",
      });
      const data = (await response.json()) as SignInStatus;
      setSignInStatus(data);
    } catch {
      setSignInStatus(null);
    }
  };

  useEffect(() => {
    // Only fetch if authenticated
    if (status === "authenticated") {
       // Use a local variable to avoid calling the external function directly if lint is mad
       // Actually let's just do it directly here
       const fetchStatus = async () => {
         try {
           const response = await fetch("/api/auth/signin-status", { cache: "no-store" });
           const data = await response.json();
           setSignInStatus(data);
         } catch {
           setSignInStatus(null);
         }
       };
       void fetchStatus();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">Checking approval status...</p>
        </motion.div>
      </div>
    );
  }

  const manualRefetch = async () => {
    await loadSignInStatus();
    window.location.reload();
  };

  const pendingCount = signInStatus?.pendingUsers ?? 0;
  const maxPendingUsers = signInStatus?.maxPendingUsers ?? 3;
  const showCapacityMessage =
    status === "authenticated" &&
    !session?.user?.approved &&
    session?.user?.role !== "SUPER_ADMIN" &&
    !session?.user?.existedBeforeSignIn &&
    pendingCount >= maxPendingUsers;

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#fdf8f0] px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(245,158,11,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(245,158,11,0.08) 0%, transparent 60%)",
      }}
    >
      <motion.section 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#e8d8c0] bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-sm"
      >
        <div className="relative border-b border-[#e8d8c0] bg-[#fef9f2] px-6 py-5 text-center">
          <div className="absolute right-4 top-4">
            <RefetchButton refetch={manualRefetch} />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50 shadow-sm">
            <FiClock className="h-7 w-7 text-amber-700" />
          </div>
          <h1 className="text-xl font-black text-[#1a1208]">Approval Pending</h1>
          <p className="mt-1 text-sm text-[#78604a]">
            Your SSO account is waiting for Admin approval.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6 text-center">
          <p className="text-sm text-[#78604a]">
            {showCapacityMessage
              ? `There are already ${pendingCount} users waiting for approval. If you have another approved account, sign out and continue with that one instead.`
              : "Once approved, your access will activate automatically the next time your session refreshes."}
          </p>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900"
          >
            <p className="font-semibold">Signed in as</p>
            <p className="mt-1 break-all">{session?.user?.email ?? "Unknown user"}</p>
          </motion.div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/"
                className="block w-full rounded-2xl border border-[#e8d8c0] bg-white px-4 py-3 text-sm font-semibold text-[#1a1208] transition hover:bg-[#fef9f2]"
              >
                Retry Access
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#1a1208] transition hover:bg-amber-500"
            >
              <FiLogOut className="h-4 w-4" />
              Use Another Account
            </motion.button>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

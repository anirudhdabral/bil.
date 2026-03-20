"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type LoginClientProps = {
  error: string | null;
};

function getErrorMessage(error: string | null): string | null {
  if (error === "AccessDenied") {
    return "Sign-in was denied.";
  }

  return null;
}

export default function LoginClient({ error }: LoginClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (session.user?.approved || session.user?.role === "SUPER_ADMIN") {
      router.replace("/");
      return;
    }

    router.replace("/pending");
  }, [router, session?.user?.approved, session?.user?.role, status]);

  const errorMessage = getErrorMessage(error);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#fdf8f0] px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(245,158,11,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(245,158,11,0.08) 0%, transparent 60%)",
      }}
    >
      <section className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50 shadow-sm">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="#d97706"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="16"
                cy="16"
                r="9"
                stroke="#d97706"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="16"
                cy="16"
                r="5"
                stroke="#d97706"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="16" cy="16" r="2" fill="#d97706" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1a1208]">
            Bil<span className="text-amber-500">.</span>
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#b8926a]">
            Manage your bills
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#e8d8c0] bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-sm">
          <div className="border-b border-[#e8d8c0] bg-[#fef9f2] px-6 py-5">
            <h2 className="text-base font-bold text-[#1a1208]">Welcome back</h2>
            <p className="mt-0.5 text-sm text-[#78604a]">
              Sign in to manage your homes, bills, and shared members.
            </p>
          </div>

          <div className="space-y-4 p-6">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              id="google-sign-in"
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-[#e8d8c0] bg-white px-4 py-3 text-sm font-semibold text-[#1a1208] shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:shadow active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

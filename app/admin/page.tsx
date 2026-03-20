"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiCheck, FiRefreshCw, FiShield } from "react-icons/fi";

import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

type PendingUser = {
  _id: string;
  email: string;
  name?: string | null;
  createdAt?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok && "error" in body && typeof body.error === "string") {
    throw new Error(body.error);
  }
  return body;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await parseJson<{ users: PendingUser[] }>(
        await fetch("/api/admin/users", { cache: "no-store" })
      );
      setUsers(data.users);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "SUPER_ADMIN") {
      router.replace("/");
      return;
    }

    if (status === "authenticated" && session.user.role === "SUPER_ADMIN") {
      void loadUsers();
    }
  }, [router, session?.user?.role, status]);

  async function approveUser(userId: string) {
    try {
      setUpdatingUserId(userId);
      setError(null);
      await parseJson(
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, approved: true }),
        })
      );
      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== userId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to approve user");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (status === "loading" || (status === "authenticated" && session.user.role === "SUPER_ADMIN" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">Loading approval queue...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fdf8f0]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#b8926a]">Admin</p>
            <h1 className="mt-1 flex items-center gap-3 text-2xl font-black text-[#1a1208] sm:text-3xl">
              <FiShield className="h-7 w-7 text-amber-600" />
              Pending User Approvals
            </h1>
            <p className="mt-2 text-sm text-[#78604a]">
              Approve new SSO users here. New non-admin sign-ins pause automatically when 3 users are waiting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#e8d8c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1208] shadow-sm transition hover:bg-[#fef9f2]"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-[#e8d8c0] bg-white/90 shadow-sm shadow-amber-900/5">
          <div className="flex items-center justify-between border-b border-[#e8d8c0] bg-[#fef9f2] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-[#1a1208]">Approval Queue</h2>
              <p className="mt-0.5 text-sm text-[#78604a]">
                {users.length} pending {users.length === 1 ? "user" : "users"}
              </p>
            </div>
          </div>

          <div className="p-6">
            {users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e8d8c0] bg-[#fef9f2] px-6 py-10 text-center">
                <p className="text-base font-bold text-[#1a1208]">No pending users</p>
                <p className="mt-1 text-sm text-[#78604a]">The sign-in queue is clear.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#e8d8c0] bg-[#fffdf9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1a1208]">{user.name?.trim() || "Unnamed user"}</p>
                      <p className="mt-0.5 text-sm text-[#78604a]">{user.email}</p>
                      <p className="mt-1 text-xs text-[#b8926a]">
                        Requested {user.createdAt ? new Date(user.createdAt).toLocaleString() : "recently"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void approveUser(user._id)}
                      disabled={updatingUserId === user._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#1a1208] transition hover:bg-amber-500 disabled:opacity-60"
                    >
                      <FiCheck className="h-4 w-4" />
                      {updatingUserId === user._id ? "Approving..." : "Approve"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

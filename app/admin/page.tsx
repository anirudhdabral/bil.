"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiCheck, FiShield, FiSlash } from "react-icons/fi";

import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { RefetchButton } from "../../components/ui/RefetchButton";
import { getCookie, setCookie } from "../../lib/cookies";

type AdminUser = {
  _id: string;
  email: string;
  name?: string | null;
  role: "SUPER_ADMIN" | "USER";
  approved: boolean;
  createdAt?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok && "error" in body && typeof body.error === "string") {
    throw new Error(body.error);
  }
  return body;
}

function formatRequestedAt(value?: string) {
  if (!value) {
    return "recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return date.toLocaleString();
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const pendingUsers = useMemo(() => users.filter((user) => !user.approved), [users]);
  const approvedUsers = useMemo(() => users.filter((user) => user.approved), [users]);
  const adminUsers = useMemo(() => users.filter((user) => user.role === "SUPER_ADMIN"), [users]);

  const loadUsers = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!skipCache) {
        const cached = getCookie("bm_admin_users");
        if (cached) {
          try {
            setUsers(JSON.parse(cached) as AdminUser[]);
            setLoading(false);
            return;
          } catch {
            // Ignore broken cache and continue with network fetch.
          }
        }
      }

      const data = await parseJson<{ users: AdminUser[] }>(
        await fetch("/api/admin/users", { cache: "no-store" })
      );
      setUsers(data.users);
      setCookie("bm_admin_users", JSON.stringify(data.users));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN") {
      router.replace("/");
      return;
    }

    if (status === "authenticated" && session?.user?.role === "SUPER_ADMIN") {
      void loadUsers();
    }
  }, [loadUsers, router, session?.user?.role, status]);

  async function updateUserAccess(userId: string, approved: boolean) {
    try {
      setUpdatingUserId(userId);
      setError(null);
      const data = await parseJson<{ user: AdminUser }>(
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, approved }),
        })
      );

      setUsers((currentUsers) => {
        const nextUsers = currentUsers.map((user) => (user._id === userId ? data.user : user));
        nextUsers.sort((left, right) => {
          if (left.approved !== right.approved) {
            return Number(left.approved) - Number(right.approved);
          }

          if (left.role !== right.role) {
            return left.role.localeCompare(right.role);
          }

          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return leftTime - rightTime;
        });
        setCookie("bm_admin_users", JSON.stringify(nextUsers));
        return nextUsers;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Failed to ${approved ? "approve" : "revoke"} user`);
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (status === "loading" || (status === "authenticated" && session?.user?.role === "SUPER_ADMIN" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8f0]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <LoadingSpinner className="h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-[#78604a]">Loading user access...</p>
        </motion.div>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fdf8f0]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#b8926a]">Admin</p>
            <h1 className="mt-1 flex items-center gap-3 text-2xl font-black text-[#1a1208] sm:text-3xl">
              <FiShield className="h-7 w-7 text-amber-600" />
              User Access Control
            </h1>
            <p className="mt-2 text-sm text-[#78604a]">
              Visible only to super admins. Review all users, including admin and non-admin accounts.
            </p>
          </div>
          <RefetchButton refetch={() => loadUsers(true)} size={24} />
        </motion.header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#e8d8c0] bg-white/90 px-5 py-4 shadow-sm shadow-amber-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b8926a]">Total Users</p>
            <p className="mt-2 text-2xl font-black text-[#1a1208]">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-[#f1d19d] bg-[#fff7e8] px-5 py-4 shadow-sm shadow-amber-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b8926a]">Pending</p>
            <p className="mt-2 text-2xl font-black text-[#1a1208]">{pendingUsers.length}</p>
          </div>
          <div className="rounded-2xl border border-[#d8e8cf] bg-[#f5fbf0] px-5 py-4 shadow-sm shadow-amber-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b8926a]">Approved</p>
            <p className="mt-2 text-2xl font-black text-[#1a1208]">{approvedUsers.length}</p>
          </div>
          <div className="rounded-2xl border border-[#eadffc] bg-[#faf6ff] px-5 py-4 shadow-sm shadow-amber-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b8926a]">Admins</p>
            <p className="mt-2 text-2xl font-black text-[#1a1208]">{adminUsers.length}</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-[#e8d8c0] bg-white/90 shadow-sm shadow-amber-900/5"
        >
          <div className="flex items-center justify-between border-b border-[#e8d8c0] bg-[#fef9f2] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-[#1a1208]">All User Accounts</h2>
              <p className="mt-0.5 text-sm text-[#78604a]">
                Pending accounts appear first, followed by approved users and admin accounts.
              </p>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence>
              {users.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key="empty"
                  className="rounded-2xl border border-dashed border-[#e8d8c0] bg-[#fef9f2] px-6 py-10 text-center"
                >
                  <p className="text-base font-bold text-[#1a1208]">No users found</p>
                  <p className="mt-1 text-sm text-[#78604a]">No accounts have signed in yet.</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => {
                    const isUpdating = updatingUserId === user._id;
                    const isSuperAdmin = user.role === "SUPER_ADMIN";

                    return (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col gap-3 rounded-2xl border border-[#e8d8c0] bg-[#fffdf9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#1a1208]">{user.name?.trim() || "Unnamed user"}</p>
                            <span
                              className={user.approved
                                ? "rounded-full bg-[#e4f4dc] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#3f6f22]"
                                : "rounded-full bg-[#fff1d6] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b36b00]"}
                            >
                              {user.approved ? "Approved" : "Pending"}
                            </span>
                            <span
                              className={isSuperAdmin
                                ? "rounded-full bg-[#eadffc] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6a3db8]"
                                : "rounded-full bg-[#eef2f7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#556070]"}
                            >
                              {isSuperAdmin ? "Super Admin" : "User"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-[#78604a]">{user.email}</p>
                          <p className="mt-1 text-xs text-[#b8926a]">
                            Requested {formatRequestedAt(user.createdAt)}
                          </p>
                        </div>

                        {isSuperAdmin ? (
                          <div className="inline-flex items-center justify-center rounded-2xl border border-[#d7c8f3] bg-[#f6f0ff] px-4 py-2.5 text-sm font-semibold text-[#6a3db8]">
                            Protected Account
                          </div>
                        ) : user.approved ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => void updateUserAccess(user._id, false)}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <FiSlash className="h-4 w-4" />
                            {isUpdating ? "Revoking..." : "Revoke Access"}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => void updateUserAccess(user._id, true)}
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#1a1208] transition hover:bg-amber-500 disabled:opacity-60"
                          >
                            <FiCheck className="h-4 w-4" />
                            {isUpdating ? "Approving..." : "Approve"}
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FiChevronDown, FiLogOut, FiShield, FiUserPlus, FiUsers } from "react-icons/fi";

import {
  GET_HOME_BY_ID,
  GET_HOMES,
  INVITE_USER_TO_HOME,
  PROMOTE_HOME_MEMBER_TO_ADMIN,
} from "../../lib/graphql/operations";
import type { Home } from "../../lib/graphql/types";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import { setGlobalError } from "../../lib/redux/slices/uiSlice";
import { Modal } from "./Modal";

function initials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) {
    return "U";
  }

  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export function AppNavbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const selectedHomeId = useAppSelector((state) => state.selectedHome.selectedHomeId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const homeQuery = useQuery<{ getHomeById: Home | null }>(GET_HOME_BY_ID, {
    variables: { id: selectedHomeId ?? "" },
    skip: !selectedHomeId || !manageOpen,
    fetchPolicy: "cache-and-network",
  });

  const [inviteUser, inviteUserState] = useMutation(INVITE_USER_TO_HOME, {
    refetchQueries: selectedHomeId
      ? [
          { query: GET_HOME_BY_ID, variables: { id: selectedHomeId } },
          { query: GET_HOMES },
        ]
      : [{ query: GET_HOMES }],
    awaitRefetchQueries: true,
  });

  const [promoteMember, promoteMemberState] = useMutation(PROMOTE_HOME_MEMBER_TO_ADMIN, {
    refetchQueries: selectedHomeId
      ? [
          { query: GET_HOME_BY_ID, variables: { id: selectedHomeId } },
          { query: GET_HOMES },
        ]
      : [{ query: GET_HOMES }],
    awaitRefetchQueries: true,
  });

  const home = homeQuery.data?.getHomeById ?? null;
  const viewerEmail = session?.user?.email?.toLowerCase() ?? "";
  const isAdmin = !!home && home.owners.map((owner) => owner.toLowerCase()).includes(viewerEmail);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const memberRows = useMemo(() => {
    if (!home) {
      return [] as Array<{ email: string; isAdmin: boolean }>;
    }

    return home.members.map((email) => ({
      email,
      isAdmin: home.owners.map((owner) => owner.toLowerCase()).includes(email.toLowerCase()),
    }));
  }, [home]);

  if (pathname === "/login" || pathname === "/pending") {
    return null;
  }

  async function onInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHomeId) {
      dispatch(setGlobalError("Select a home before managing users."));
      return;
    }

    try {
      dispatch(setGlobalError(null));
      await inviteUser({
        variables: {
          homeId: selectedHomeId,
          email: inviteEmail.trim().toLowerCase(),
        },
      });
      setInviteEmail("");
    } catch (error) {
      dispatch(setGlobalError(error instanceof Error ? error.message : "Failed to invite user"));
    }
  }

  async function onPromote(email: string) {
    if (!selectedHomeId) {
      return;
    }

    try {
      dispatch(setGlobalError(null));
      await promoteMember({ variables: { homeId: selectedHomeId, email } });
    } catch (error) {
      dispatch(setGlobalError(error instanceof Error ? error.message : "Failed to promote member"));
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#e8d8c0] bg-[#fdf8f0]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-sm font-black tracking-tight text-[#1a1208] sm:text-base"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 ring-2 ring-amber-200 transition group-hover:ring-amber-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#1a1208" strokeWidth="1.5" fill="none" />
                <circle cx="7" cy="7" r="4" stroke="#1a1208" strokeWidth="1.5" fill="none" />
                <circle cx="7" cy="7" r="2" stroke="#1a1208" strokeWidth="1.5" fill="none" />
              </svg>
            </span>
            <span>
              Bil<span className="text-amber-500">.</span>
            </span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-[#e8d8c0] bg-[#fef9f2] px-1.5 py-1 shadow-sm transition hover:border-amber-300 hover:shadow"
              aria-label="User menu"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-200">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="User avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-amber-800">
                    {initials(session?.user?.name || session?.user?.email || "User")}
                  </span>
                )}
              </span>
              <FiChevronDown
                className={`h-3.5 w-3.5 text-[#78604a] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                />
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-[#e8d8c0] bg-[#fdf8f0] shadow-xl shadow-amber-900/10">
                  <div className="border-b border-[#e8d8c0] bg-[#fef9f2] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78604a]">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-[#1a1208]">{session?.user?.email}</p>
                    {isSuperAdmin ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Admin</p>
                    ) : null}
                  </div>
                  <div className="p-1.5">
                    {isSuperAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#1a1208] transition hover:bg-amber-50"
                      >
                        <FiShield className="h-4 w-4 text-amber-600" />
                        Approve Users
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setManageOpen(true);
                      }}
                      disabled={!selectedHomeId}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#1a1208] transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiUsers className="h-4 w-4 text-amber-600" />
                      Manage Home Users
                    </button>
                    <div className="my-1 h-px bg-[#e8d8c0]" />
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <Modal
        title="Manage Home Users"
        open={manageOpen}
        onClose={() => {
          setManageOpen(false);
          setMenuOpen(false);
        }}
      >
        {!selectedHomeId ? (
          <p className="text-sm text-[#78604a]">Open a home first, then manage its users from this menu.</p>
        ) : homeQuery.loading ? (
          <p className="text-sm text-[#78604a]">Loading home users...</p>
        ) : !home ? (
          <p className="text-sm text-[#78604a]">Home not found.</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#e8d8c0] bg-[#fef9f2] px-4 py-3">
              <p className="text-sm font-bold text-[#1a1208]">House {home.houseNo}</p>
              <p className="mt-0.5 text-xs text-[#78604a]">{home.address}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#78604a]">Members</p>
              <div className="space-y-2">
                {memberRows.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between rounded-xl border border-[#e8d8c0] bg-white/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1a1208]">{member.email}</p>
                      <p className="text-xs text-[#78604a]">{member.isAdmin ? "Admin" : "Member"}</p>
                    </div>
                    {!member.isAdmin && isAdmin ? (
                      <button
                        type="button"
                        onClick={() => void onPromote(member.email)}
                        disabled={promoteMemberState.loading}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                      >
                        <FiShield className="h-3.5 w-3.5" />
                        Make Admin
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#78604a]">Invite User</p>
              <form className="flex gap-2" onSubmit={(event) => void onInviteSubmit(event)}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 rounded-xl border border-[#e8d8c0] bg-white/80 px-3 py-2 text-sm text-[#1a1208] placeholder-[#b8926a] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  required
                  disabled={!isAdmin}
                />
                <button
                  type="submit"
                  disabled={!isAdmin || inviteUserState.loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-[#1a1208] shadow-sm transition hover:bg-amber-500 disabled:opacity-50"
                >
                  <FiUserPlus className="h-4 w-4" />
                  Invite
                </button>
              </form>
              {!isAdmin ? (
                <p className="mt-1.5 text-xs text-amber-700">Only admins can invite or promote users.</p>
              ) : null}
            </div>

            {home.pendingInvites.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Pending Invites</p>
                <p className="text-xs text-amber-800">{home.pendingInvites.join(", ")}</p>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}

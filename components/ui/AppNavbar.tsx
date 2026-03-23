"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiLogOut,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { logoutAndClearSession } from "../../lib/logout";

function initials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function AppNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  if (pathname === "/login" || pathname === "/pending") {
    return null;
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
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="#1a1208"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="4"
                  stroke="#1a1208"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="2"
                  stroke="#1a1208"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </span>
            <span>
              Bil<span className="text-amber-500">.</span>
            </span>
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-[#e8d8c0] bg-[#fef9f2] px-1.5 py-1 shadow-sm transition hover:border-amber-300 hover:shadow"
              aria-label="User menu"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-200">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="User avatar"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : session?.user?.name || session?.user?.email ? (
                  <span className="text-xs font-bold text-amber-800">
                    {initials(session.user.name || session.user.email || "")}
                  </span>
                ) : (
                  <FiUser
                    className="h-3.5 w-3.5 text-amber-800"
                    aria-hidden="true"
                  />
                )}
              </span>
              <FiChevronDown
                className={`h-3.5 w-3.5 text-[#78604a] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-[#e8d8c0] bg-[#fdf8f0] shadow-xl shadow-amber-900/10">
                <div className="border-b border-[#e8d8c0] bg-[#fef9f2] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#78604a]">
                    Signed in as
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-[#1a1208]">
                    {session?.user?.email}
                  </p>
                  {isSuperAdmin ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Super Admin
                    </p>
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
                      Manage Users
                    </Link>
                  ) : null}
                  {isSuperAdmin && <div className="my-1 h-px bg-[#e8d8c0]" />}
                  <button
                    type="button"
                    onClick={() => void logoutAndClearSession()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}

"use client";

import { signOut, useSession } from "next-auth/react";

export function UserProfileBar() {
  const { data } = useSession();

  if (!data?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="max-w-[180px] truncate rounded-md bg-slate-100 px-2 py-1 text-slate-700">
        {data.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-50"
      >
        Logout
      </button>
    </div>
  );
}

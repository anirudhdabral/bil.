"use client";

import Link from "next/link";

import type { Home } from "../../lib/graphql/types";

type HomeCardProps = {
  home: Home;
  onSelect?: (homeId: string) => void;
};

export function HomeCard({ home, onSelect }: HomeCardProps) {
  return (
    <Link
      href={`/home/${home.id}`}
      onClick={() => onSelect?.(home.id)}
      className="group relative block overflow-hidden rounded-2xl border border-[#e8d8c0] bg-white/80 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100"
    >
      {/* Amber accent strip */}
      <span className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-amber-400 to-amber-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <p className="text-xs font-bold uppercase tracking-widest text-[#b8926a]">House No.</p>
      <div className="flex items-center justify-between gap-2">
        <h3 className="mt-1 text-xl font-black text-[#1a1208]">{home.houseNo}</h3>
        {home.pendingDeletion && (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 border border-red-100">
            Pending Deletion
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[#78604a] leading-relaxed">{home.address}</p>

      {/* Arrow indicator */}
      <span className="absolute bottom-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-[#e8d8c0] bg-[#fef9f2] text-[#b8926a] opacity-0 transition-all duration-200 group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:opacity-100">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </Link>
  );
}

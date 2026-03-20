"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiDownload, FiEye, FiMinus, FiPlus, FiRefreshCcw, FiX } from "react-icons/fi";

import type { Bill } from "../../lib/graphql/types";

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BillCard({ bill }: { bill: Bill }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
        setZoom(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isPreviewOpen]);

  function closePreview() {
    setIsPreviewOpen(false);
    setZoom(1);
  }

  function zoomIn() {
    setZoom((current) => Math.min(current + 0.25, 3));
  }

  function zoomOut() {
    setZoom((current) => Math.max(current - 0.25, 1));
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e8d8c0] bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md hover:shadow-amber-100">
      {bill.imageUrl ? (
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="relative block h-40 w-full overflow-hidden"
        >
          <Image
            src={bill.imageUrl}
            alt={`Bill for ${bill.category.name}`}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* Overlay */}
          <span className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <FiEye className="h-3 w-3" />
            Preview
          </span>
        </button>
      ) : (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-1.5 bg-[#fef9f2]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef0d0]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="12" height="14" rx="2" stroke="#b8926a" strokeWidth="1.5"/>
              <path d="M6 6h6M6 9h6M6 12h4" stroke="#b8926a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xs text-[#b8926a]">No image</span>
        </div>
      )}

      <div className="space-y-1.5 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#b8926a]">
          {bill.category.name}
        </p>
        <p className="text-sm font-bold text-[#1a1208]">{formatDate(bill.date)}</p>
        <p className="text-sm text-[#78604a] leading-relaxed">
          {bill.remarks?.trim() ? bill.remarks : "No remarks"}
        </p>
      </div>

      {isPreviewOpen && bill.imageUrl ? (
        <div
          className="fixed inset-0 z-50 p-3 sm:p-5"
          style={{ background: "rgba(26,18,8,0.92)", backdropFilter: "blur(8px)" }}
        >
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={zoomOut}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <FiRefreshCcw className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-white/80">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={bill.imageUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-[#1a1208] transition hover:bg-amber-500"
                >
                  <FiDownload className="h-4 w-4" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <FiX className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>

            <button type="button" onClick={closePreview} className="relative flex-1 overflow-auto rounded-2xl">
              <div className="relative h-full min-h-105 w-full">
                <Image
                  src={bill.imageUrl}
                  alt={`Bill preview for ${bill.category.name}`}
                  fill
                  className="object-contain transition duration-150"
                  style={{ transform: `scale(${zoom})` }}
                  sizes="100vw"
                />
              </div>
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

"use client";

import { useMutation } from "@apollo/client/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiDownload,
  FiEdit2,
  FiEye,
  FiMinus,
  FiPlus,
  FiRefreshCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { DELETE_BILL } from "../../lib/graphql/operations";
import type { Bill, BillCategory } from "../../lib/graphql/types";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { EditBillForm } from "../forms/EditBillForm";
import { ConfirmActionDialog } from "../ui/ConfirmActionDialog";
import { Modal } from "../ui/Modal";

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

function getStoredImageBytes(imageUrl?: string | null): number | null {
  if (!imageUrl || !imageUrl.startsWith("data:")) {
    return null;
  }

  const commaIndex = imageUrl.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const base64 = imageUrl.slice(commaIndex + 1);
  const paddingLength = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;

  return Math.floor((base64.length * 3) / 4) - paddingLength;
}

function formatStorageSize(bytes: number | null): string | null {
  if (bytes == null || bytes <= 0) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type BillCardProps = {
  bill: Bill;
  categories: BillCategory[];
  onBillsChanged: () => Promise<void> | void;
};

export function BillCard({ bill, categories, onBillsChanged }: BillCardProps) {
  const dispatch = useAppDispatch();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imageStorageSize = formatStorageSize(getStoredImageBytes(bill.imageUrl));

  const [deleteBill, { loading: deleting }] = useMutation(DELETE_BILL);

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

  function openPreview() {
    setIsPreviewOpen(true);
  }

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

  async function handleDelete() {
    dispatch(setGlobalError(null));

    try {
      dispatch(setGlobalLoading(true));
      await deleteBill({ variables: { billId: bill.id } });
      setIsDeleteOpen(false);
      await onBillsChanged();
    } catch (error) {
      dispatch(setGlobalError(error instanceof Error ? error.message : "Failed to delete bill"));
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  const previewOverlay =
    typeof document !== "undefined" && isPreviewOpen && bill.imageUrl
      ? createPortal(
          <div className="fixed inset-0 z-120 bg-black/95">
            <button
              type="button"
              aria-label="Close preview"
              onClick={closePreview}
              className="absolute inset-0 h-full w-full"
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-130 flex items-start justify-between gap-3 p-3 sm:p-5">
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-black/55 px-2 py-2 text-white backdrop-blur-md">
                <button
                  type="button"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <FiRefreshCcw className="h-4 w-4" />
                </button>
                <span className="min-w-14 text-center text-sm font-medium text-white/85">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-black/55 px-2 py-2 text-white backdrop-blur-md">
                <a
                  href={bill.imageUrl}
                  download
                  aria-label="Download image"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-400 p-2.5 text-[#1a1208] transition hover:bg-amber-500"
                >
                  <FiDownload className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close preview"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 overflow-auto">
              <div className="relative flex min-h-screen min-w-full items-center justify-center p-6 sm:p-10">
                <div
                  className="relative h-[calc(100vh-3rem)] w-[calc(100vw-3rem)] sm:h-[calc(100vh-5rem)] sm:w-[calc(100vw-5rem)]"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                >
                  <Image
                    src={bill.imageUrl}
                    alt={`Bill preview for ${bill.category.name}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <article className="group overflow-hidden rounded-2xl border border-[#e8d8c0] bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-md hover:shadow-amber-100">
        {bill.imageUrl ? (
          <div className="relative h-40 w-full overflow-hidden">
            <button type="button" onClick={openPreview} className="block h-full w-full">
              <Image
                src={bill.imageUrl}
                alt={`Bill for ${bill.category.name}`}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.05]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <span className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
            <button
              type="button"
              onClick={openPreview}
              className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/75"
            >
              <FiEye className="h-3 w-3" />
              Preview
            </button>
          </div>
        ) : (
          <div className="flex h-40 w-full flex-col items-center justify-center gap-1.5 bg-[#fef9f2]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef0d0]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="2" width="12" height="14" rx="2" stroke="#b8926a" strokeWidth="1.5" />
                <path d="M6 6h6M6 9h6M6 12h4" stroke="#b8926a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs text-[#b8926a]">No image</span>
          </div>
        )}

        <div className="space-y-1.5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8926a]">
              {bill.category.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                aria-label="Edit bill"
                className="text-[#78604a] transition hover:text-amber-700"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                disabled={deleting}
                aria-label="Delete bill"
                className="text-[#78604a] transition hover:text-red-700 disabled:opacity-60"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#1a1208]">{formatDate(bill.date)}</p>
            {imageStorageSize ? <p className="text-xs font-semibold text-[#b8926a]">{imageStorageSize}</p> : null}
          </div>
          <p className="text-sm leading-relaxed text-[#78604a]">
            {bill.remarks?.trim() ? bill.remarks : "No remarks"}
          </p>
        </div>
      </article>

      {previewOverlay}

      <Modal title="Edit Bill" open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <EditBillForm
          bill={bill}
          categories={categories}
          onCancel={() => setIsEditOpen(false)}
          onSuccess={async () => {
            setIsEditOpen(false);
            await onBillsChanged();
          }}
        />
      </Modal>

      <ConfirmActionDialog
        open={isDeleteOpen}
        title="Delete Bill"
        message="This bill will be removed permanently. This action cannot be undone."
        confirmLabel="Delete Bill"
        loading={deleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

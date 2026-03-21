"use client";

import { useMutation } from "@apollo/client/react";
import Image from "next/image";
import { useState } from "react";
import { PhotoView } from "react-photo-view";
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const imageStorageSize = formatStorageSize(getStoredImageBytes(bill.imageUrl));

  const [deleteBill, { loading: deleting }] = useMutation(DELETE_BILL);

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

  return (
    <>
      <article className="group overflow-hidden rounded-2xl border border-[#e8d8c0] bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-md hover:shadow-amber-100">
        {bill.imageUrl ? (
          <PhotoView src={bill.imageUrl}>
            <button type="button" className="relative block h-40 w-full overflow-hidden text-left">
              <Image
                src={bill.imageUrl}
                alt={`Bill for ${bill.category.name}`}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.05]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <span className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/75">
                <FiEye className="h-3 w-3" />
                Preview
              </span>
            </button>
          </PhotoView>
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

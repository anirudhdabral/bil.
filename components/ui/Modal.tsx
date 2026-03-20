"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ title, open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(26,18,8,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#e8d8c0] bg-[#fdf8f0] shadow-2xl shadow-amber-900/20 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8d8c0] bg-[#fef9f2] px-5 py-4">
          <h3 className="text-base font-bold text-[#1a1208]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-[#78604a] transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

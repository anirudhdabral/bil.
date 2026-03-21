import { AnimatePresence, motion } from "framer-motion";
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
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a1208]/45 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#e8d8c0] bg-[#fdf8f0] shadow-2xl shadow-amber-900/20 sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e8d8c0] bg-[#fef9f2] px-5 py-4">
              <h3 className="text-base font-bold text-[#1a1208]">{title}</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-[#78604a] transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </motion.button>
            </div>
            {/* Body */}
            <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


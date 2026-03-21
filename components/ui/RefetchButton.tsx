"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

interface RefetchButtonProps {
  refetch: () => Promise<unknown>;
  className?: string;
  size?: number;
}

export function RefetchButton({ refetch, className = "", size = 16 }: RefetchButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRefetch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await refetch();
    } catch {
      // Ignore
    } finally {
      // A small delay to keep the animation smooth
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(251, 191, 36, 0.1)" }}
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={handleRefetch}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-lg p-2 text-[#78604a] transition-colors hover:text-amber-700 disabled:opacity-50 ${className}`}
      title="Refetch"
    >
      <motion.div
        animate={loading ? { rotate: 360 } : { rotate: 0 }}
        transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.3 }}
      >
        <FiRefreshCw
          className={`h-4 w-4 ${loading ? "text-amber-500" : ""}`}
          style={{ width: size, height: size }}
        />
      </motion.div>
    </motion.button>
  );
}

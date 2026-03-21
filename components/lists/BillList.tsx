"use client";

import { motion } from "framer-motion";
import type { Bill } from "../../lib/graphql/types";
import { BillCard } from "../cards/BillCard";

export function BillList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return (
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-[#78604a]"
      >
        No bills yet.
      </motion.p>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {bills.map((bill) => (
        <motion.div key={bill.id} variants={item}>
          <BillCard bill={bill} />
        </motion.div>
      ))}
    </motion.div>
  );
}

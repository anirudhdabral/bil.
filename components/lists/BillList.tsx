"use client";

import type { Bill, BillCategory } from "../../lib/graphql/types";
import { BillCard } from "../cards/BillCard";

type BillListProps = {
  bills: Bill[];
  categories: BillCategory[];
  onBillsChanged: () => Promise<void> | void;
};

export function BillList({ bills, categories, onBillsChanged }: BillListProps) {
  if (bills.length === 0) {
    return <p className="text-sm text-[#78604a]">No bills yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((bill) => (
        <BillCard key={bill.id} bill={bill} categories={categories} onBillsChanged={onBillsChanged} />
      ))}
    </div>
  );
}

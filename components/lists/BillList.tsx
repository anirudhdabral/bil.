"use client";

import type { Bill } from "../../lib/graphql/types";
import { BillCard } from "../cards/BillCard";

export function BillList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return <p className="text-sm text-slate-500">No bills yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((bill) => (
        <BillCard key={bill.id} bill={bill} />
      ))}
    </div>
  );
}

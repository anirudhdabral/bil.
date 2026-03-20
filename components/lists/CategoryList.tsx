"use client";

import type { BillCategory } from "../../lib/graphql/types";

export function CategoryList({ categories }: { categories: BillCategory[] }) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#b8926a] italic">No categories yet. Add one to get started.</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex items-center gap-2.5 rounded-xl border border-[#e8d8c0] bg-[#fef9f2] px-3.5 py-2.5 text-sm font-semibold text-[#44382a] transition hover:border-amber-200 hover:bg-amber-50"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
          {category.name}
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useMutation } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";

import { UPDATE_BILL } from "../../lib/graphql/operations";
import type { Bill, BillCategory } from "../../lib/graphql/types";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type EditBillFormProps = {
  bill: Bill;
  categories: BillCategory[];
  onSuccess: () => Promise<void> | void;
  onCancel: () => void;
};

export function EditBillForm({ bill, categories, onSuccess, onCancel }: EditBillFormProps) {
  const dispatch = useAppDispatch();
  const initialDate = useMemo(() => new Date(bill.date).toISOString().slice(0, 10), [bill.date]);

  const [date, setDate] = useState(initialDate);
  const [remarks, setRemarks] = useState(bill.remarks ?? "");
  const [categoryId, setCategoryId] = useState(bill.category.id);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDate(initialDate);
    setRemarks(bill.remarks ?? "");
    setCategoryId(bill.category.id);
  }, [bill.category.id, bill.remarks, initialDate]);

  const [updateBill, { loading, error }] = useMutation(UPDATE_BILL);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    dispatch(setGlobalError(null));

    if (!date || !categoryId) {
      setFormError("Date and category are required.");
      return;
    }

    if (remarks.length > 255) {
      setFormError("Remarks must be 255 characters or less.");
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await updateBill({
        variables: {
          billId: bill.id,
          date: new Date(date).toISOString(),
          remarks: remarks.trim() || null,
          categoryId,
        },
      });

      await onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(mutationError instanceof Error ? mutationError.message : "Failed to update bill")
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">Date</span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">Remarks</span>
        <textarea
          value={remarks}
          maxLength={255}
          onChange={(event) => setRemarks(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          rows={3}
          placeholder="Optional remarks..."
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">Category</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {formError ? <ErrorMessage message={formError} /> : null}
      {error?.message ? <ErrorMessage message={error.message} /> : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-[#e8d8c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#44382a] transition hover:bg-[#fef9f2]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm shadow-amber-200 transition hover:bg-amber-500 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

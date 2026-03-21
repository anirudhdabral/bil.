"use client";

import { useMutation } from "@apollo/client/react";
import { useEffect, useState } from "react";

import { UPDATE_CATEGORY } from "../../lib/graphql/operations";
import type { BillCategory } from "../../lib/graphql/types";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type EditCategoryFormProps = {
  category: BillCategory;
  onSuccess: () => Promise<void> | void;
  onCancel: () => void;
};

export function EditCategoryForm({ category, onSuccess, onCancel }: EditCategoryFormProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(category.name);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  const [updateCategory, { loading, error }] = useMutation(UPDATE_CATEGORY);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    dispatch(setGlobalError(null));

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await updateCategory({
        variables: {
          categoryId: category.id,
          name: name.trim(),
        },
      });
      await onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(mutationError instanceof Error ? mutationError.message : "Failed to update category")
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">Category Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
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

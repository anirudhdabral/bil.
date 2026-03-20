"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";

import { CREATE_CATEGORY, GET_CATEGORIES_BY_HOME } from "../../lib/graphql/operations";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type AddCategoryFormProps = {
  homeId: string;
  onSuccess: () => void;
};

export function AddCategoryForm({ homeId, onSuccess }: AddCategoryFormProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");

  const [createCategory, { loading, error }] = useMutation(CREATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES_BY_HOME, variables: { homeId } }],
    awaitRefetchQueries: true,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(setGlobalError(null));

    if (!name.trim()) {
      dispatch(setGlobalError("Category name is required."));
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await createCategory({
        variables: {
          name: name.trim(),
          homeId,
        },
      });
      setName("");
      onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error ? mutationError.message : "Failed to create category"
        )
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
          placeholder="e.g. Electricity, Water, Internet"
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
      </label>

      {error?.message ? <ErrorMessage message={error.message} /> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm shadow-amber-200 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Category"}
      </button>
    </form>
  );
}

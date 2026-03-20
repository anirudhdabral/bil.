"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";

import { CREATE_HOME, GET_HOMES } from "../../lib/graphql/operations";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type AddHomeFormProps = {
  onSuccess: () => void;
};

export function AddHomeForm({ onSuccess }: AddHomeFormProps) {
  const dispatch = useAppDispatch();
  const [houseNo, setHouseNo] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createHome, { loading, error }] = useMutation(CREATE_HOME, {
    refetchQueries: [{ query: GET_HOMES }],
    awaitRefetchQueries: true,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    dispatch(setGlobalError(null));

    if (!houseNo.trim() || !address.trim()) {
      setFormError("House number and address are required.");
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await createHome({
        variables: {
          houseNo: houseNo.trim(),
          address: address.trim(),
        },
      });
      setHouseNo("");
      setAddress("");
      onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error ? mutationError.message : "Failed to create home"
        )
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">House Number</span>
        <input
          value={houseNo}
          maxLength={10}
          onChange={(event) => setHouseNo(event.target.value)}
          placeholder="e.g. 42A"
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">Address</span>
        <input
          value={address}
          maxLength={50}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="e.g. 123 Main Street, City"
          className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3.5 py-2.5 text-sm text-[#1a1208] placeholder-[#c4a882] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          required
        />
      </label>

      {formError ? <ErrorMessage message={formError} /> : null}
      {error?.message ? <ErrorMessage message={error.message} /> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm shadow-amber-200 transition hover:bg-amber-500 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Home"}
      </button>
    </form>
  );
}

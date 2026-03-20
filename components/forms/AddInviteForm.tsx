"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";

import { GET_HOME_BY_ID, INVITE_USER_TO_HOME } from "../../lib/graphql/operations";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError, setGlobalLoading } from "../../lib/redux/slices/uiSlice";
import { ErrorMessage } from "../ui/ErrorMessage";

type AddInviteFormProps = {
  homeId: string;
  onSuccess: () => void;
};

export function AddInviteForm({ homeId, onSuccess }: AddInviteFormProps) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");

  const [inviteUser, { loading, error }] = useMutation(INVITE_USER_TO_HOME, {
    refetchQueries: [{ query: GET_HOME_BY_ID, variables: { id: homeId } }],
    awaitRefetchQueries: true,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(setGlobalError(null));

    if (!email.trim()) {
      dispatch(setGlobalError("Invite email is required."));
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await inviteUser({
        variables: {
          homeId,
          email: email.trim().toLowerCase(),
        },
      });
      setEmail("");
      onSuccess();
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error ? mutationError.message : "Failed to invite user"
        )
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">User Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="friend@example.com"
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
        {loading ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}

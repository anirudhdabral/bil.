"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { FiCheck, FiHome, FiPlus, FiX } from "react-icons/fi";

import { HomeCard } from "../components/cards/HomeCard";
import { AddHomeForm } from "../components/forms/AddHomeForm";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";
import {
  ACCEPT_HOME_INVITE,
  DECLINE_HOME_INVITE,
  GET_HOMES,
  GET_PENDING_HOME_INVITES,
} from "../lib/graphql/operations";
import type { Home } from "../lib/graphql/types";
import { useAppDispatch, useAppSelector } from "../lib/redux/hooks";
import { setSelectedHomeId } from "../lib/redux/slices/selectedHomeSlice";
import { setAddHomeOpen, setGlobalError } from "../lib/redux/slices/uiSlice";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const isAddHomeOpen = useAppSelector((state) => state.ui.isAddHomeOpen);

  const { data, loading, error } = useQuery<{ getHomes: Home[] }>(GET_HOMES, {
    fetchPolicy: "cache-first",
  });
  const pendingInvitesQuery = useQuery<{ getPendingHomeInvites: Home[] }>(GET_PENDING_HOME_INVITES, {
    fetchPolicy: "cache-first",
  });
  const homes = data?.getHomes ?? [];
  const pendingInvites = pendingInvitesQuery.data?.getPendingHomeInvites ?? [];

  const [acceptInvite, acceptInviteState] = useMutation(ACCEPT_HOME_INVITE, {
    refetchQueries: [{ query: GET_HOMES }, { query: GET_PENDING_HOME_INVITES }],
    awaitRefetchQueries: true,
  });

  const [declineInvite, declineInviteState] = useMutation(DECLINE_HOME_INVITE, {
    refetchQueries: [{ query: GET_PENDING_HOME_INVITES }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    const message = error?.message || pendingInvitesQuery.error?.message || null;
    if (message) {
      dispatch(setGlobalError(message));
    }
  }, [dispatch, error?.message, pendingInvitesQuery.error?.message]);

  async function onAcceptInvite(homeId: string) {
    try {
      dispatch(setGlobalError(null));
      await acceptInvite({ variables: { homeId } });
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error ? mutationError.message : "Failed to accept invite"
        )
      );
    }
  }

  async function onDeclineInvite(homeId: string) {
    try {
      dispatch(setGlobalError(null));
      await declineInvite({ variables: { homeId } });
    } catch (mutationError) {
      dispatch(
        setGlobalError(
          mutationError instanceof Error ? mutationError.message : "Failed to decline invite"
        )
      );
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* Page Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#b8926a]">
                Welcome back
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#1a1208] sm:text-3xl">
                Your Homes
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {!loading ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {homes.length} {homes.length === 1 ? "home" : "homes"}
                </span>
              ) : null}
              <button
                type="button"
                id="add-home-btn"
                onClick={() => dispatch(setAddHomeOpen(true))}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm shadow-amber-200 transition hover:bg-amber-500 hover:shadow-amber-300 active:scale-95"
              >
                <FiPlus className="h-4 w-4" />
                Add Home
              </button>
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#e8d8c0] bg-white/70 px-4 py-3.5 text-[#78604a] shadow-sm">
            <LoadingSpinner className="h-4 w-4" />
            <span className="text-sm font-medium">Loading homes...</span>
          </div>
        ) : null}

        {/* Pending Invites */}
        {!pendingInvitesQuery.loading && pendingInvites.length > 0 ? (
          <section className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/80">
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-amber-900">Pending Invites</h2>
            </div>
            <div className="divide-y divide-amber-100 p-4 space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white/80 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1a1208]">House {invite.houseNo}</p>
                    <p className="text-xs text-[#78604a] mt-0.5">{invite.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onAcceptInvite(invite.id)}
                      disabled={acceptInviteState.loading || declineInviteState.loading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#1a1208] transition hover:bg-amber-500 disabled:opacity-60"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeclineInvite(invite.id)}
                      disabled={acceptInviteState.loading || declineInviteState.loading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8d8c0] bg-white px-3 py-1.5 text-xs font-semibold text-[#78604a] transition hover:bg-[#fef9f2] disabled:opacity-60"
                    >
                      <FiX className="h-3.5 w-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Empty state */}
        {!loading && homes.length === 0 ? (
          <div className="mb-6 flex flex-col items-center rounded-3xl border-2 border-dashed border-[#e8d8c0] bg-white/50 px-8 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
              <FiHome className="h-7 w-7 text-amber-600" />
            </div>
            <p className="text-base font-bold text-[#1a1208]">No homes yet</p>
            <p className="mt-1.5 text-sm text-[#78604a]">
              Create your first home to get started.
            </p>
            <button
              type="button"
              onClick={() => dispatch(setAddHomeOpen(true))}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#1a1208] shadow-sm transition hover:bg-amber-500 active:scale-95"
            >
              <FiPlus className="h-4 w-4" />
              Create First Home
            </button>
          </div>
        ) : null}

        {/* Homes Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((home) => (
            <HomeCard
              key={home.id}
              home={home}
              onSelect={(homeId) => dispatch(setSelectedHomeId(homeId))}
            />
          ))}
        </section>
      </div>

      <Modal
        title="Add New Home"
        open={isAddHomeOpen}
        onClose={() => {
          dispatch(setAddHomeOpen(false));
          dispatch(setGlobalError(null));
        }}
      >
        <AddHomeForm
          onSuccess={() => {
            dispatch(setAddHomeOpen(false));
          }}
        />
      </Modal>
    </main>
  );
}

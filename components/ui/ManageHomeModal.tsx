"use client";

import { useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiShield,
  FiTrash2,
  FiUserMinus,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

import { EditCategoryForm } from "../../components/forms/EditCategoryForm";
import {
  CANCEL_HOME_INVITE,
  DELETE_CATEGORY,
  GET_CATEGORIES_BY_HOME,
  GET_HOME_BY_ID,
  GET_HOMES,
  INVITE_USER_TO_HOME,
  PROMOTE_HOME_MEMBER_TO_ADMIN,
  REMOVE_MEMBER_FROM_HOME,
  REQUEST_DELETE_HOME,
  UPDATE_HOME,
} from "../../lib/graphql/operations";
import type { BillCategory, Home } from "../../lib/graphql/types";
import { useAppDispatch } from "../../lib/redux/hooks";
import { setGlobalError } from "../../lib/redux/slices/uiSlice";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { Modal } from "./Modal";

type ManageHomeModalProps = {
  open: boolean;
  onClose: () => void;
  homeId: string;
  home: Home;
  categories: BillCategory[];
  isAdmin: boolean;
  onSuccess: () => Promise<void> | void;
};

export function ManageHomeModal({
  open,
  onClose,
  homeId: selectedHomeId,
  home,
  categories,
  isAdmin,
  onSuccess,
}: ManageHomeModalProps) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const viewerEmail = session?.user?.email?.toLowerCase() ?? "";

  const [inviteEmail, setInviteEmail] = useState("");
  const [homeHouseNo, setHomeHouseNo] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeFormError, setHomeFormError] = useState<string | null>(null);
  const [homeUpdateSuccess, setHomeUpdateSuccess] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BillCategory | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState<BillCategory | null>(
    null,
  );
  const [promotingMember, setPromotingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);

  useEffect(() => {
    if (open) {
      setHomeHouseNo(home?.houseNo ?? "");
      setHomeAddress(home?.address ?? "");
      setHomeFormError(null);
      setHomeUpdateSuccess(false);
      setInviteEmail("");
    }
  }, [open, home?.houseNo, home?.address]);

  const refetchHomeQueries = selectedHomeId
    ? [
        { query: GET_HOME_BY_ID, variables: { id: selectedHomeId } },
        { query: GET_HOMES },
      ]
    : [{ query: GET_HOMES }];

  const [inviteUser, inviteUserState] = useMutation(INVITE_USER_TO_HOME, {
    refetchQueries: refetchHomeQueries,
    awaitRefetchQueries: true,
  });

  const [promoteMember, promoteMemberState] = useMutation(
    PROMOTE_HOME_MEMBER_TO_ADMIN,
    {
      refetchQueries: refetchHomeQueries,
      awaitRefetchQueries: true,
    },
  );

  const [removeMember, removeMemberState] = useMutation(
    REMOVE_MEMBER_FROM_HOME,
    {
      refetchQueries: refetchHomeQueries,
      awaitRefetchQueries: true,
    },
  );

  const [cancelInvite, cancelInviteState] = useMutation(CANCEL_HOME_INVITE, {
    refetchQueries: refetchHomeQueries,
    awaitRefetchQueries: true,
  });

  const [updateHome, updateHomeState] = useMutation(UPDATE_HOME, {
    refetchQueries: refetchHomeQueries,
    awaitRefetchQueries: true,
  });

  const [deleteCategory, deleteCategoryState] = useMutation(DELETE_CATEGORY, {
    refetchQueries: selectedHomeId
      ? [
          {
            query: GET_CATEGORIES_BY_HOME,
            variables: { homeId: selectedHomeId },
          },
        ]
      : [],
    awaitRefetchQueries: true,
  });

  const [requestDeleteHome, requestDeleteHomeState] = useMutation(
    REQUEST_DELETE_HOME,
    {
      refetchQueries: refetchHomeQueries,
      awaitRefetchQueries: true,
    },
  );

  const memberRows = useMemo(() => {
    if (!home) return [] as Array<{ email: string; isOwner: boolean }>;
    return home.members.map((email) => ({
      email,
      isOwner: home.owners
        .map((o) => o.toLowerCase())
        .includes(email.toLowerCase()),
    }));
  }, [home]);

  async function onInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHomeId) return;
    try {
      dispatch(setGlobalError(null));
      await inviteUser({
        variables: {
          homeId: selectedHomeId,
          email: inviteEmail.trim().toLowerCase(),
        },
      });
      setInviteEmail("");
      void onSuccess();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to invite user",
        ),
      );
    }
  }

  async function onPromote(email: string) {
    if (!selectedHomeId) return;
    try {
      dispatch(setGlobalError(null));
      await promoteMember({ variables: { homeId: selectedHomeId, email } });
      setPromotingMember(null);
      void onSuccess();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to promote member",
        ),
      );
    }
  }

  async function onRemoveMember(email: string) {
    if (!selectedHomeId) return;
    try {
      dispatch(setGlobalError(null));
      await removeMember({ variables: { homeId: selectedHomeId, email } });
      setRemovingMember(null);
      void onSuccess();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to remove member",
        ),
      );
    }
  }

  async function onCancelInvite(email: string) {
    if (!selectedHomeId) return;
    try {
      dispatch(setGlobalError(null));
      await cancelInvite({ variables: { homeId: selectedHomeId, email } });
      setCancelingInvite(null);
      void onSuccess();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to cancel invite",
        ),
      );
    }
  }

  async function onUpdateHome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHomeId) return;

    const nextHouseNo = homeHouseNo.trim();
    const nextAddress = homeAddress.trim();

    if (!nextHouseNo || !nextAddress) {
      setHomeFormError("House number and address are required.");
      return;
    }

    try {
      setHomeFormError(null);
      setHomeUpdateSuccess(false);
      dispatch(setGlobalError(null));
      await updateHome({
        variables: {
          homeId: selectedHomeId,
          houseNo: nextHouseNo,
          address: nextAddress,
        },
      });
      setHomeUpdateSuccess(true);
      setTimeout(() => setHomeUpdateSuccess(false), 3000);
      void onSuccess();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update home details";
      setHomeFormError(message);
      dispatch(setGlobalError(message));
    }
  }

  async function onDeleteCategory() {
    if (!deletingCategory) return;
    try {
      dispatch(setGlobalError(null));
      await deleteCategory({ variables: { categoryId: deletingCategory.id } });
      setDeletingCategory(null);
      void onSuccess();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to delete category",
        ),
      );
    }
  }

  async function onRequestDeleteHome() {
    if (!selectedHomeId) return;
    try {
      dispatch(setGlobalError(null));
      await requestDeleteHome({ variables: { homeId: selectedHomeId } });
      setIsRequestingDeletion(false);
      void onSuccess();
      onClose();
    } catch (error) {
      dispatch(
        setGlobalError(
          error instanceof Error ? error.message : "Failed to request home deletion",
        ),
      );
    }
  }

  const memberActionsDisabled =
    promoteMemberState.loading || removeMemberState.loading;

  const isHomeFormDirty =
    homeHouseNo.trim() !== (home?.houseNo || "").trim() ||
    homeAddress.trim() !== (home?.address || "").trim();

  return (
    <>
      <Modal
        title="Manage Home"
        open={open}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-[#e8d8c0] bg-[#fef9f2] px-4 py-4">
            <form
              className="space-y-3"
              onSubmit={(event) => void onUpdateHome(event)}
            >
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
                  Home Name
                </span>
                <input
                  value={homeHouseNo}
                  maxLength={10}
                  onChange={(event) => setHomeHouseNo(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3 py-2 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  required
                  disabled={!isAdmin || updateHomeState.loading}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
                  Address
                </span>
                <input
                  value={homeAddress}
                  maxLength={50}
                  onChange={(event) => setHomeAddress(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e8d8c0] bg-white/80 px-3 py-2 text-sm text-[#1a1208] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  required
                  disabled={!isAdmin || updateHomeState.loading}
                />
              </label>
              {homeFormError ? (
                <p className="text-xs text-red-600">{homeFormError}</p>
              ) : null}
              <div className="flex flex-row-reverse">
                <div className="flex items-center gap-3">
                  {homeUpdateSuccess ? (
                    <span className="text-sm font-bold text-[#3f6f22] bg-[#e4f4dc] px-2 py-1 rounded-lg">
                      Saved!
                    </span>
                  ) : null}
                  <button
                    type="submit"
                    disabled={
                      !isAdmin || updateHomeState.loading || !isHomeFormDirty
                    }
                    className="inline-flex items-center rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-[#1a1208] shadow-sm transition hover:bg-amber-500 disabled:opacity-60"
                  >
                    {updateHomeState.loading ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#78604a]">
              Members
            </p>
            <div className="space-y-2">
              {memberRows.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#e8d8c0] bg-white/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1a1208]">
                      {member.email}
                    </p>
                    <p className="text-xs text-[#78604a]">
                      {member.isOwner ? "Admin" : "Member"}
                    </p>
                  </div>

                  {isAdmin ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!member.isOwner ? (
                        <button
                          type="button"
                          onClick={() => setPromotingMember(member.email)}
                          disabled={memberActionsDisabled}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                          <FiShield className="h-3.5 w-3.5" />
                          Make Admin
                        </button>
                      ) : null}

                      {!member.isOwner &&
                      member.email.toLowerCase() !== viewerEmail ? (
                        <button
                          type="button"
                          onClick={() => setRemovingMember(member.email)}
                          disabled={memberActionsDisabled}
                          title="Remove member"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <FiUserMinus className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#78604a]">
                Categories
              </p>
            </div>
            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-xl border border-[#e8d8c0] bg-white/60 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-[#1a1208]">
                      {category.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(category)}
                        aria-label={`Edit ${category.name}`}
                        className="text-[#78604a] transition hover:text-amber-700"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        aria-label={`Delete ${category.name}`}
                        className="text-[#78604a] transition hover:text-red-700"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#78604a]">No categories yet.</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#78604a]">
              Invite User
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => void onInviteSubmit(event)}
            >
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="user@example.com"
                className="flex-1 rounded-xl border border-[#e8d8c0] bg-white/80 px-3 py-2 text-sm text-[#1a1208] placeholder-[#b8926a] transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                required
                disabled={!isAdmin}
              />
              <button
                type="submit"
                disabled={!isAdmin || inviteUserState.loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-[#1a1208] shadow-sm transition hover:bg-amber-500 disabled:opacity-50"
              >
                <FiUserPlus className="h-4 w-4" />
                Invite
              </button>
            </form>
            {!isAdmin ? (
              <p className="mt-1.5 text-xs text-amber-700">
                Only admins can invite or promote users.
              </p>
            ) : null}
          </div>

          {home.pendingInvites.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                Pending Invites
              </p>
              <div className="space-y-2">
                {home.pendingInvites.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between gap-2"
                  >
                    <p className="truncate text-xs text-amber-900">{email}</p>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setCancelingInvite(email)}
                        disabled={cancelInviteState.loading}
                        title="Cancel invite"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 transition hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-60"
                      >
                        <FiX className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="pt-4 border-t border-[#e8d8c0]">
              {home.pendingDeletion ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Deletion Request Pending
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    A request to delete this home has been submitted and is currently awaiting Super Admin approval.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1a1208]">Danger Zone</p>
                      <p className="text-xs text-[#78604a]">
                        Request to permanently delete this home and all its data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRequestingDeletion(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete Home
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="Edit Category"
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
      >
        {editingCategory ? (
          <EditCategoryForm
            category={editingCategory}
            onCancel={() => setEditingCategory(null)}
            onSuccess={async () => {
              setEditingCategory(null);
              await onSuccess();
            }}
          />
        ) : null}
      </Modal>

      <ConfirmActionDialog
        open={!!deletingCategory}
        title="Delete Category"
        message="This category will be removed permanently. Categories with bills cannot be deleted."
        confirmLabel="Delete Category"
        loading={deleteCategoryState.loading}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={onDeleteCategory}
      />
      <ConfirmActionDialog
        open={!!promotingMember}
        title="Make Admin"
        message={`Are you sure you want to promote ${promotingMember} to admin?`}
        confirmLabel="Promote"
        loadingLabel="Promoting..."
        loading={promoteMemberState.loading}
        onCancel={() => setPromotingMember(null)}
        onConfirm={() => {
          if (promotingMember) {
            void onPromote(promotingMember);
          }
        }}
      />
      <ConfirmActionDialog
        open={!!removingMember}
        title="Remove User"
        message={`Are you sure you want to remove ${removingMember} from the home?`}
        confirmLabel="Remove"
        loadingLabel="Removing..."
        loading={removeMemberState.loading}
        onCancel={() => setRemovingMember(null)}
        onConfirm={() => {
          if (removingMember) {
            void onRemoveMember(removingMember);
          }
        }}
      />
      <ConfirmActionDialog
        open={!!cancelingInvite}
        title="Cancel Invite"
        message={`Are you sure you want to cancel the invite for ${cancelingInvite}?`}
        confirmLabel="Cancel Invite"
        loadingLabel="Canceling..."
        loading={cancelInviteState.loading}
        onCancel={() => setCancelingInvite(null)}
        onConfirm={() => {
          if (cancelingInvite) {
            void onCancelInvite(cancelingInvite);
          }
        }}
      />
      <ConfirmActionDialog
        open={isRequestingDeletion}
        title="Delete Home?"
        message="This will request the Super Admin to permanently delete this home, all its categories, and all bills. This action cannot be undone once approved."
        confirmLabel="Request Deletion"
        loadingLabel="Requesting..."
        loading={requestDeleteHomeState.loading}
        onCancel={() => setIsRequestingDeletion(false)}
        onConfirm={() => void onRequestDeleteHome()}
      />
    </>
  );
}

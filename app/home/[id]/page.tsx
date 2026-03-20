"use client";

import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiFileText, FiFolderPlus, FiUserPlus } from "react-icons/fi";

import { AddBillForm } from "../../../components/forms/AddBillForm";
import { AddCategoryForm } from "../../../components/forms/AddCategoryForm";
import { AddInviteForm } from "../../../components/forms/AddInviteForm";
import { BillList } from "../../../components/lists/BillList";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Modal } from "../../../components/ui/Modal";
import {
  GET_BILLS_BY_CATEGORY,
  GET_BILLS_BY_HOME,
  GET_CATEGORIES_BY_HOME,
  GET_HOME_BY_ID,
} from "../../../lib/graphql/operations";
import type { Bill, BillCategory, Home } from "../../../lib/graphql/types";
import { useAppDispatch, useAppSelector } from "../../../lib/redux/hooks";
import { setSelectedHomeId } from "../../../lib/redux/slices/selectedHomeSlice";
import {
  setAddBillOpen,
  setAddCategoryOpen,
  setInviteUserOpen,
  setGlobalError,
} from "../../../lib/redux/slices/uiSlice";

export default function HomeDetailsPage() {
  const dispatch = useAppDispatch();
  const params = useParams<{ id: string }>();
  const homeId = params.id;
  const { data: session } = useSession();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const isAddCategoryOpen = useAppSelector((state) => state.ui.isAddCategoryOpen);
  const isAddBillOpen = useAppSelector((state) => state.ui.isAddBillOpen);
  const isInviteUserOpen = useAppSelector((state) => state.ui.isInviteUserOpen);

  const homeQuery = useQuery<{ getHomeById: Home | null }>(GET_HOME_BY_ID, {
    variables: { id: homeId },
  });
  const categoryQuery = useQuery<{ getCategoriesByHome: BillCategory[] }>(GET_CATEGORIES_BY_HOME, {
    variables: { homeId },
  });
  const categories = useMemo(
    () => categoryQuery.data?.getCategoriesByHome ?? [],
    [categoryQuery.data?.getCategoriesByHome]
  );

  const effectiveCategoryId = useMemo(() => {
    if (!selectedCategoryId) return "";
    return categories.some((c) => c.id === selectedCategoryId) ? selectedCategoryId : "";
  }, [categories, selectedCategoryId]);

  const billsQuery = useQuery<{ getBillsByHome: Bill[] }>(GET_BILLS_BY_HOME, {
    variables: { homeId },
    skip: !!effectiveCategoryId,
  });
  const billsByCategoryQuery = useQuery<{ getBillsByCategory: Bill[] }>(GET_BILLS_BY_CATEGORY, {
    variables: { categoryId: effectiveCategoryId },
    skip: !effectiveCategoryId,
  });

  const loading =
    homeQuery.loading || categoryQuery.loading || billsQuery.loading || billsByCategoryQuery.loading;
  const home = homeQuery.data?.getHomeById ?? null;

  const bills = useMemo(() => {
    const raw = effectiveCategoryId
      ? billsByCategoryQuery.data?.getBillsByCategory ?? []
      : billsQuery.data?.getBillsByHome ?? [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [effectiveCategoryId, billsByCategoryQuery.data?.getBillsByCategory, billsQuery.data?.getBillsByHome]);

  const viewerEmail = session?.user?.email?.toLowerCase();
  const isOwner =
    !!home && !!viewerEmail && home.owners.map((o) => o.toLowerCase()).includes(viewerEmail);

  const errorMessage =
    homeQuery.error?.message ||
    categoryQuery.error?.message ||
    billsQuery.error?.message ||
    billsByCategoryQuery.error?.message ||
    null;

  useEffect(() => {
    if (errorMessage) dispatch(setGlobalError(errorMessage));
  }, [dispatch, errorMessage]);

  useEffect(() => {
    if (home?.id) dispatch(setSelectedHomeId(home.id));
  }, [dispatch, home?.id]);

  return (
    <main className="min-h-screen">
      {/* ── Top bar ── */}
      <div className="sticky top-14 z-20 border-b border-[#e8d8c0] bg-[#fdf8f0]/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left: back + title */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-[#78604a] transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FiArrowLeft className="h-4 w-4" />
            </Link>
            {home ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#1a1208]">{home.houseNo}</p>
                <p className="truncate text-xs text-[#b8926a]">{home.address}</p>
              </div>
            ) : (
              loading && <LoadingSpinner className="h-4 w-4 text-amber-500" />
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            {isOwner && (
              <button
                type="button"
                id="invite-user-btn"
                onClick={() => dispatch(setInviteUserOpen(true))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-amber-600 transition hover:border-amber-300 hover:bg-amber-50"
                title="Invite User"
              >
                <FiUserPlus className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              id="add-bill-btn"
              onClick={() => dispatch(setAddBillOpen(true))}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#1a1208] shadow-sm transition hover:bg-amber-500 active:scale-95"
            >
              <FiFileText className="h-3.5 w-3.5" />
              Add Bill
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        {/* ── Categories horizontal scroll ── */}
        <div className="mb-6">
          <div className="flex items-center overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]" style={{ msOverflowStyle: "none" }}>
            {/* "All" pill */}
            <button
              type="button"
              onClick={() => setSelectedCategoryId("")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                !effectiveCategoryId
                  ? "border-amber-400 bg-amber-400 text-[#1a1208] shadow-sm"
                  : "border-[#e8d8c0] bg-white text-[#78604a] hover:border-amber-200 hover:bg-amber-50"
              }`}
            >
              All
            </button>

            {/* Category pills */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  effectiveCategoryId === cat.id
                    ? "border-amber-400 bg-amber-400 text-[#1a1208] shadow-sm"
                    : "border-[#e8d8c0] bg-white text-[#78604a] hover:border-amber-200 hover:bg-amber-50"
                }`}
              >
                {cat.name}
              </button>
            ))}

            {/* Divider + Add category button at far right */}
            {categories.length > 0 && (
              <div className="shrink-0 mx-1 h-5 w-px bg-[#e8d8c0]" />
            )}
            <button
              type="button"
              id="add-category-btn"
              onClick={() => dispatch(setAddCategoryOpen(true))}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-dashed border-[#e8d8c0] bg-[#fef9f2] px-3 py-1.5 text-sm font-semibold text-[#b8926a] transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            >
              <FiFolderPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-[#e8d8c0] bg-white/70 px-4 py-3 text-[#78604a]">
            <LoadingSpinner className="h-4 w-4" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        )}

        {/* ── Bills ── */}
        <BillList bills={bills} />
      </div>

      {/* ── Modals ── */}
      <Modal
        title="Add Category"
        open={isAddCategoryOpen}
        onClose={() => { dispatch(setAddCategoryOpen(false)); dispatch(setGlobalError(null)); }}
      >
        <AddCategoryForm homeId={homeId} onSuccess={() => dispatch(setAddCategoryOpen(false))} />
      </Modal>

      <Modal
        title="Add Bill"
        open={isAddBillOpen}
        onClose={() => { dispatch(setAddBillOpen(false)); dispatch(setGlobalError(null)); }}
      >
        <AddBillForm
          homeId={homeId}
          categories={categories}
          onSuccess={() => dispatch(setAddBillOpen(false))}
        />
      </Modal>

      <Modal
        title="Invite User"
        open={isInviteUserOpen}
        onClose={() => { dispatch(setInviteUserOpen(false)); dispatch(setGlobalError(null)); }}
      >
        <AddInviteForm homeId={homeId} onSuccess={() => dispatch(setInviteUserOpen(false))} />
      </Modal>
    </main>
  );
}

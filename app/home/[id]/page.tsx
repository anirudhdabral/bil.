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
import { RefetchButton } from "../../../components/ui/RefetchButton";
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
  setGlobalError,
  setInviteUserOpen,
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
    fetchPolicy: "cache-first",
  });
  const categoryQuery = useQuery<{ getCategoriesByHome: BillCategory[] }>(GET_CATEGORIES_BY_HOME, {
    variables: { homeId },
    fetchPolicy: "cache-first",
  });
  const categories = useMemo(() => categoryQuery.data?.getCategoriesByHome ?? [], [categoryQuery.data?.getCategoriesByHome]);

  const effectiveCategoryId = useMemo(() => {
    if (!selectedCategoryId) return "";
    return categories.some((category) => category.id === selectedCategoryId) ? selectedCategoryId : "";
  }, [categories, selectedCategoryId]);

  const billsQuery = useQuery<{ getBillsByHome: Bill[] }>(GET_BILLS_BY_HOME, {
    variables: { homeId },
    skip: !!effectiveCategoryId,
    fetchPolicy: "cache-first",
  });
  const billsByCategoryQuery = useQuery<{ getBillsByCategory: Bill[] }>(GET_BILLS_BY_CATEGORY, {
    variables: { categoryId: effectiveCategoryId },
    skip: !effectiveCategoryId,
    fetchPolicy: "cache-first",
  });

  const manualRefetch = async () => {
    await Promise.all([
      homeQuery.refetch(),
      categoryQuery.refetch(),
      effectiveCategoryId ? billsByCategoryQuery.refetch() : billsQuery.refetch(),
    ]);
  };

  const home = homeQuery.data?.getHomeById ?? null;
  const bills = useMemo(() => {
    const raw = effectiveCategoryId
      ? (billsByCategoryQuery.data?.getBillsByCategory ?? [])
      : (billsQuery.data?.getBillsByHome ?? []);
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [effectiveCategoryId, billsByCategoryQuery.data?.getBillsByCategory, billsQuery.data?.getBillsByHome]);

  const viewerEmail = session?.user?.email?.toLowerCase();
  const isOwner = !!home && !!viewerEmail && home.owners.map((owner) => owner.toLowerCase()).includes(viewerEmail);
  const initialLoading = homeQuery.loading && !home;
  const billsLoading = effectiveCategoryId ? billsByCategoryQuery.loading : billsQuery.loading;
  const loading = initialLoading || categoryQuery.loading || billsLoading;

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
      <div className="sticky top-14 z-20 border-b border-[#e8d8c0] bg-[#fdf8f0]/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 py-8 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-[#78604a] transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FiArrowLeft className="h-4 w-4" />
            </Link>
            {home ? (
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-[#1a1208]">{home.houseNo}</p>
                <p className="truncate text-xs text-[#b8926a]">{home.address}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#78604a]">
                <LoadingSpinner className="h-5 w-5 text-amber-500" />
                <span>Loading home...</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <RefetchButton refetch={manualRefetch} />
            {isOwner ? (
              <button
                type="button"
                id="invite-user-btn"
                onClick={() => dispatch(setInviteUserOpen(true))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-amber-600 transition hover:border-amber-300 hover:bg-amber-50"
                title="Invite User"
              >
                <FiUserPlus className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              id="add-bill-btn"
              onClick={() => dispatch(setAddBillOpen(true))}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-2.5 text-xs font-bold text-[#1a1208] shadow-sm transition hover:bg-amber-500 active:scale-95"
            >
              <FiFileText className="h-3.5 w-3.5" />
              Add Bill
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[calc(100vh-8.5rem)] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-center text-[#78604a]">
            <LoadingSpinner className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-medium">Loading bills...</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6">
          <div className="mb-6">
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]"
              style={{ msOverflowStyle: "none" }}
            >
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

              {categories.map((category) => {
                const isSelected = effectiveCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      isSelected
                        ? "border-amber-400 bg-amber-400 text-[#1a1208] shadow-sm"
                        : "border-[#e8d8c0] bg-white text-[#78604a] hover:border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}

              {categories.length > 0 ? <div className="mx-1 h-5 w-px shrink-0 bg-[#e8d8c0]" /> : null}
              <button
                type="button"
                id="add-category-btn"
                onClick={() => dispatch(setAddCategoryOpen(true))}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#e8d8c0] bg-[#fef9f2] px-3 py-1.5 text-sm font-semibold text-[#b8926a] transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              >
                <FiFolderPlus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <BillList bills={bills} categories={categories} onBillsChanged={manualRefetch} />
        </div>
      )}

      <Modal
        title="Add Category"
        open={isAddCategoryOpen}
        onClose={() => {
          dispatch(setAddCategoryOpen(false));
          dispatch(setGlobalError(null));
        }}
      >
        <AddCategoryForm
          homeId={homeId}
          onSuccess={async () => {
            dispatch(setAddCategoryOpen(false));
            await manualRefetch();
          }}
        />
      </Modal>

      <Modal
        title="Add Bill"
        open={isAddBillOpen}
        onClose={() => {
          dispatch(setAddBillOpen(false));
          dispatch(setGlobalError(null));
        }}
      >
        <AddBillForm
          homeId={homeId}
          categories={categories}
          onSuccess={async () => {
            dispatch(setAddBillOpen(false));
            await manualRefetch();
          }}
        />
      </Modal>

      <Modal
        title="Invite User"
        open={isInviteUserOpen}
        onClose={() => {
          dispatch(setInviteUserOpen(false));
          dispatch(setGlobalError(null));
        }}
      >
        <AddInviteForm homeId={homeId} onSuccess={() => dispatch(setInviteUserOpen(false))} />
      </Modal>
    </main>
  );
}

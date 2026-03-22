"use client";

import { useQuery, useApolloClient } from "@apollo/client/react";
import { NetworkStatus } from "@apollo/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiFolderPlus,
  FiUserPlus,
} from "react-icons/fi";

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
} from "../../../lib/redux/slices/uiSlice";

export default function HomeDetailsPage() {
  const dispatch = useAppDispatch();
  const apolloClient = useApolloClient();
  const params = useParams<{ id: string }>();
  const homeId = params.id;
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const isAddCategoryOpen = useAppSelector(
    (state) => state.ui.isAddCategoryOpen,
  );
  const isAddBillOpen = useAppSelector((state) => state.ui.isAddBillOpen);

  const homeQuery = useQuery<{ getHomeById: Home | null }>(GET_HOME_BY_ID, {
    variables: { id: homeId },
    fetchPolicy: "cache-and-network",
  });
  const categoryQuery = useQuery<{ getCategoriesByHome: BillCategory[] }>(
    GET_CATEGORIES_BY_HOME,
    {
      variables: { homeId },
      fetchPolicy: "cache-and-network",
    },
  );
  const categories = useMemo(
    () => categoryQuery.data?.getCategoriesByHome ?? [],
    [categoryQuery.data?.getCategoriesByHome],
  );

  const effectiveCategoryId = useMemo(() => {
    if (!selectedCategoryId) return "";
    return categories.some((category) => category.id === selectedCategoryId)
      ? selectedCategoryId
      : "";
  }, [categories, selectedCategoryId]);

  const billsQuery = useQuery<{ getBillsByHome: Bill[] }>(GET_BILLS_BY_HOME, {
    variables: { homeId, month: selectedMonth, year: selectedYear },
    skip: !!effectiveCategoryId,
    fetchPolicy: "cache-and-network",
  });
  const billsByCategoryQuery = useQuery<{ getBillsByCategory: Bill[] }>(
    GET_BILLS_BY_CATEGORY,
    {
      variables: {
        categoryId: effectiveCategoryId,
        month: selectedMonth,
        year: selectedYear,
      },
      skip: !effectiveCategoryId,
      fetchPolicy: "cache-and-network",
    },
  );

  const manualRefetch = async () => {
    // Evict all bill cache entries for the current month/year so every
    // category (including ones not currently visible) gets fresh data.
    apolloClient.cache.evict({
      fieldName: "getBillsByHome",
      args: { homeId, month: selectedMonth, year: selectedYear },
    });
    for (const category of categories) {
      apolloClient.cache.evict({
        fieldName: "getBillsByCategory",
        args: {
          categoryId: category.id,
          month: selectedMonth,
          year: selectedYear,
        },
      });
    }
    apolloClient.cache.gc();

    await Promise.all([
      homeQuery.refetch(),
      categoryQuery.refetch(),
      effectiveCategoryId
        ? billsByCategoryQuery.refetch({
            categoryId: effectiveCategoryId,
            month: selectedMonth,
            year: selectedYear,
          })
        : billsQuery.refetch({
            homeId,
            month: selectedMonth,
            year: selectedYear,
          }),
    ]);
  };

  const home = homeQuery.data?.getHomeById ?? null;
  const bills = useMemo(() => {
    const raw = effectiveCategoryId
      ? (billsByCategoryQuery.data?.getBillsByCategory ?? [])
      : (billsQuery.data?.getBillsByHome ?? []);
    return [...raw].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [
    effectiveCategoryId,
    billsByCategoryQuery.data?.getBillsByCategory,
    billsQuery.data?.getBillsByHome,
  ]);

  // Only show the full-page spinner when there is genuinely no data yet (first load).
  // With cache-and-network, background re-fetches also set loading=true — we don't
  // want to hide the UI for those since cached data is already on screen.
  const initialLoading = homeQuery.loading && !home;
  const billsHaveNoData = effectiveCategoryId
    ? !billsByCategoryQuery.data &&
      billsByCategoryQuery.networkStatus !== NetworkStatus.ready
    : !billsQuery.data && billsQuery.networkStatus !== NetworkStatus.ready;
  const categoriesHaveNoData = !categoryQuery.data;
  const loading =
    initialLoading ||
    categoriesHaveNoData ||
    (billsHaveNoData &&
      (effectiveCategoryId
        ? billsByCategoryQuery.loading
        : billsQuery.loading));

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
                <p className="truncate text-lg font-black text-[#1a1208]">
                  {home.houseNo}
                </p>
                <p className="truncate text-xs text-[#b8926a]">
                  {home.address}
                </p>
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
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] mask-[linear-gradient(to_right,black_85%,transparent_100%)] mask-size-[200%_100%] mask-no-repeat animate-[mask-fade_linear_both] [animation-timeline:scroll(x_self)]"
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
              <div className="flex gap-2 mb-1 items-center">
                {categories.length > 1 && (
                  <div className="mx-1 h-5 w-px sm:w-0 shrink-0 bg-[#e8d8c0]" />
                )}

                <button
                  onClick={() => setShowMonthPicker(true)}
                  className="flex py-1.5 items-center gap-2 rounded-full border border-[#e8d8c0] bg-white px-4 text-[#78604a] transition hover:border-amber-400 hover:bg-amber-50 active:scale-95 group w-fit"
                >
                  <FiCalendar className="h-4 w-4  text-amber-500 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-bold whitespace-nowrap">
                    {selectedMonth === 0
                      ? "All Time"
                      : new Date(
                          selectedYear,
                          selectedMonth - 1,
                        ).toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <BillList
            bills={bills}
            categories={categories}
            onBillsChanged={manualRefetch}
          />
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
        title="Select Month & Year"
        open={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
      >
        <div className="p-2">
          <div className="mb-6 flex items-center justify-between rounded-xl bg-amber-50 p-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-100 bg-white text-amber-600 shadow-sm transition hover:bg-amber-400 hover:text-white"
            >
              <FiChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-xl font-black text-[#1a1208]">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-100 bg-white text-amber-600 shadow-sm transition hover:bg-amber-400 hover:text-white"
            >
              <FiChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const isSelected = selectedMonth === month;
              return (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(month);
                    setShowMonthPicker(false);
                  }}
                  className={`rounded-xl py-4 text-sm font-bold transition hover:scale-105 active:scale-95 ${
                    isSelected
                      ? "bg-amber-400 text-[#1a1208] shadow-md shadow-amber-200"
                      : "border border-[#e8d8c0] bg-white text-[#78604a] hover:border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setSelectedMonth(0);
                setShowMonthPicker(false);
              }}
              className="text-xs font-bold text-[#b8926a] hover:text-amber-700"
            >
              Show All Time
            </button>
            <button
              onClick={() => {
                setSelectedMonth(now.getMonth() + 1);
                setSelectedYear(now.getFullYear());
                setShowMonthPicker(false);
              }}
              className="text-xs font-bold text-amber-600 underline decoration-amber-200 underline-offset-4 hover:text-amber-700"
            >
              Current Month
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

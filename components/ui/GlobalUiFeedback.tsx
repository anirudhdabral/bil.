"use client";

import { useAppSelector } from "../../lib/redux/hooks";
import { LoadingSpinner } from "./LoadingSpinner";

export function GlobalUiFeedback() {
  const globalLoading = useAppSelector((state) => state.ui.globalLoading);
  const globalError = useAppSelector((state) => state.ui.globalError);

  return (
    <>
      {globalLoading ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-50/95 px-4 py-2.5 text-sm text-amber-900 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5">
            <LoadingSpinner className="h-4 w-4 text-amber-600" />
            <span className="font-medium">Processing request...</span>
          </div>
        </div>
      ) : null}
      {globalError ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-red-200 bg-red-50/95 px-4 py-3.5 text-sm text-red-800 backdrop-blur-sm shadow-lg">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            <span className="font-medium">{globalError}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

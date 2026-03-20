"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "bill-manager:pwa-prompt-dismissed";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isStandaloneMode() || window.localStorage.getItem(DISMISS_KEY) === "true") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "true");
  }

  function handleDismiss() {
    setIsVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "true");
  }

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
      <div className="overflow-hidden rounded-3xl border border-[#e8d8c0] bg-white/95 shadow-2xl shadow-amber-900/15 backdrop-blur-md">
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 ring-4 ring-amber-50">
            <FiDownload className="h-5 w-5 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#1a1208]">Install Bil.</p>
            <p className="mt-1 text-sm text-[#78604a]">
              Add the app to your device for faster access and a full-screen experience.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#1a1208] transition hover:bg-amber-500 active:scale-[0.98]"
              >
                <FiDownload className="h-4 w-4" />
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#e8d8c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#78604a] transition hover:bg-[#fef9f2]"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8d8c0] bg-white text-[#78604a] transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ApolloProvider } from "@apollo/client/react";
import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { FiDownload, FiMinus, FiPlus, FiRefreshCcw } from "react-icons/fi";
import { PhotoProvider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

import { createApolloClient } from "../lib/apollo/client";
import { store } from "../lib/redux/store";
import { AppAuthGate } from "./ui/AppAuthGate";
import { GlobalUiFeedback } from "./ui/GlobalUiFeedback";
import { InstallPwaPrompt } from "./ui/InstallPwaPrompt";
import { ServiceWorkerRegistration } from "./ui/ServiceWorkerRegistration";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export function Providers({ children }: { children: React.ReactNode }) {
  const apolloClient = useMemo(() => createApolloClient(), []);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <Provider store={store}>
        <ApolloProvider client={apolloClient}>
          <PhotoProvider
            maskClosable
            photoClosable
            toolbarRender={({ images, index, scale, onScale }) => {
              const src = images[index]?.src;
              const currentScale = scale ?? MIN_SCALE;

              function setScale(nextScale: number) {
                onScale?.(Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale)));
              }

              return (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => setScale(currentScale - SCALE_STEP)}
                    className="PhotoView-Slider__toolbarIcon inline-flex items-center justify-center"
                  >
                    <FiMinus size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => setScale(currentScale + SCALE_STEP)}
                    className="PhotoView-Slider__toolbarIcon inline-flex items-center justify-center"
                  >
                    <FiPlus size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Reset zoom"
                    onClick={() => setScale(MIN_SCALE)}
                    className="PhotoView-Slider__toolbarIcon inline-flex items-center justify-center"
                  >
                    <FiRefreshCcw size={18} />
                  </button>
                  <span className="min-w-12 text-center text-sm font-medium text-white/85">
                    {Math.round(currentScale * 100)}%
                  </span>
                  {src ? (
                    <a
                      href={src}
                      download
                      aria-label="Download image"
                      className="PhotoView-Slider__toolbarIcon inline-flex items-center justify-center"
                    >
                      <FiDownload size={20} />
                    </a>
                  ) : null}
                </div>
              );
            }}
          >
            <ServiceWorkerRegistration />
            <InstallPwaPrompt />
            <GlobalUiFeedback />
            <AppAuthGate>{children}</AppAuthGate>
          </PhotoProvider>
        </ApolloProvider>
      </Provider>
    </SessionProvider>
  );
}

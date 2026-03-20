"use client";

import { ApolloProvider } from "@apollo/client/react";
import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";

import { createApolloClient } from "../lib/apollo/client";
import { store } from "../lib/redux/store";
import { AppAuthGate } from "./ui/AppAuthGate";
import { GlobalUiFeedback } from "./ui/GlobalUiFeedback";
import { ServiceWorkerRegistration } from "./ui/ServiceWorkerRegistration";

export function Providers({ children }: { children: React.ReactNode }) {
  const apolloClient = useMemo(() => createApolloClient(), []);

  return (
    <SessionProvider>
      <Provider store={store}>
        <ApolloProvider client={apolloClient}>
          <ServiceWorkerRegistration />
          <GlobalUiFeedback />
          <AppAuthGate>{children}</AppAuthGate>
        </ApolloProvider>
      </Provider>
    </SessionProvider>
  );
}

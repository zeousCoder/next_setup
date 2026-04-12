"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, //  1 minute global stale time - for production
      gcTime: 1000 * 60 * 5, // 1 minute cache - for production
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function TanstackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

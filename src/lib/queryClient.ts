import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared React Query client.
 *
 * Phase 1 does not perform any real data fetching (no API, no map, no
 * search) — this is wired up now so pages built in later phases can start
 * using `useQuery` / `useMutation` immediately without extra setup.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

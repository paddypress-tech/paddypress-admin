import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

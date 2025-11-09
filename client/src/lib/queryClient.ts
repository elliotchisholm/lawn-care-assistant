import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: (query) => {
        // Only refetch on window focus if query has errors (self-healing)
        return query.state.status === 'error';
      },
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Parse HTTP status code from error message (format: "503: ...")
        const statusMatch = error instanceof Error && error.message.match(/^(\d{3}):/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        
        // Don't retry on client errors (401, 404) - these won't fix themselves
        if (statusCode && (statusCode === 401 || statusCode === 404)) {
          return false;
        }
        
        // Retry up to 4 times for server errors (like 503 during initialization)
        // Total delay: 1s + 2s + 4s + 8s = 15s (covers 5s+ initialization)
        return failureCount < 4;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, 8s (capped at 8s)
        return Math.min(1000 * 2 ** attemptIndex, 8000);
      },
    },
    mutations: {
      retry: false,
    },
  },
});

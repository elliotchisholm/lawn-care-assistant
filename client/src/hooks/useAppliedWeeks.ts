import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface AppliedWeekSummary {
  weekNumber: number;
  appliedAt: string;
}

/** Query key for the list; apply and undo invalidate it. */
export const appliedWeeksListKey = (userId?: string) => ["/api/applied-weeks", "list", userId] as const;

/** Weeks the signed-in user has marked as applied (empty when signed out). */
export function useAppliedWeeks() {
  const { user, isAuthenticated } = useAuth();

  const { data = [] } = useQuery<AppliedWeekSummary[]>({
    queryKey: appliedWeeksListKey(user?.id),
    queryFn: async () => {
      const res = await fetch("/api/applied-weeks", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch applied weeks: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const appliedWeeks = useMemo(() => new Set(data.map((w) => w.weekNumber)), [data]);
  return { appliedWeeks };
}

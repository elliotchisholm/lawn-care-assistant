import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WeeklySchedule } from "@shared/schema";
import type { PackageSize } from "@/lib/packageCalculator";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import {
  computePurchaseRecommendations,
  type PurchaseInventoryItem,
  type PurchaseRecommendation,
} from "@/lib/purchaseRecommendations";

export const DEFAULT_LOOKAHEAD_WEEKS = 8;

export function usePurchaseRecommendations(lawnSize: number, weeksToAnalyze: number = DEFAULT_LOOKAHEAD_WEEKS) {
  const { user, isAuthenticated } = useAuth();
  const currentWeekNumber = useCurrentWeek();

  const { data: inventory = [] } = useQuery<PurchaseInventoryItem[]>({
    queryKey: ["/api/inventory", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/inventory", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch inventory: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: fullSchedule = [], isLoading: isScheduleLoading } = useQuery<WeeklySchedule[]>({
    queryKey: ["/api/schedule"],
  });

  const { data: packageSizes = {} } = useQuery<Record<string, PackageSize[]>>({
    queryKey: ["/api/package-sizes"],
  });

  const recommendations: PurchaseRecommendation[] = useMemo(
    () =>
      computePurchaseRecommendations({
        fullSchedule,
        inventory,
        packageSizes,
        scaleFactor: lawnSize / 100, // Base calculations are per 100m2
        weeksToAnalyze,
        currentWeekNumber,
      }),
    [fullSchedule, inventory, packageSizes, lawnSize, weeksToAnalyze, currentWeekNumber],
  );

  return { recommendations, isLoading: isScheduleLoading };
}

import { Link, useLocation } from "wouter";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLawnSize } from "@/lib/LawnSizeContext";
import { usePurchaseRecommendations } from "@/hooks/usePurchaseRecommendations";
import { NAV_ITEMS, isActivePath } from "@/lib/navItems";
import { cn } from "@/lib/utils";

/** Bottom navigation for phones and tablets (hidden at lg, where SideNav takes over). */
export default function TabBar() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { lawnSize } = useLawnSize();
  const { recommendations } = usePurchaseRecommendations(lawnSize);
  const buyCount = isAuthenticated ? recommendations.length : 0;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
      data-testid="tab-bar"
    >
      <ul className="mx-auto flex max-w-xl">
        {NAV_ITEMS.map(({ path, label, icon: Icon, testId, requiresAuth }) => {
          const active = isActivePath(location, path);
          return (
            <li key={path} className="flex-1">
              <Link
                href={path}
                aria-current={active ? "page" : undefined}
                data-testid={`tab-${testId}`}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
                {requiresAuth && !isAuthenticated ? (
                  <Lock className="absolute right-1/4 top-2 h-3 w-3" aria-label="Sign in required" />
                ) : null}
                {path === "/buy" && buyCount > 0 ? (
                  <span
                    className="absolute right-[22%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                    aria-label={`${buyCount} to buy`}
                    data-testid="badge-buy-count"
                  >
                    {buyCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { Link, useLocation } from "wouter";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS, isActivePath } from "@/lib/navItems";
import { cn } from "@/lib/utils";

/** Left navigation for desktop (lg and up). */
export default function SideNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <nav
      aria-label="Primary"
      className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-r p-3 lg:block"
      data-testid="side-nav"
    >
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, testId, requiresAuth }) => {
          const active = isActivePath(location, path);
          return (
            <li key={path}>
              <Link
                href={path}
                aria-current={active ? "page" : undefined}
                data-testid={`side-${testId}`}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {requiresAuth && !isAuthenticated ? (
                  <Lock className="h-4 w-4" aria-label="Sign in required" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

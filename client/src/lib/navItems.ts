import { Leaf, Calendar, Package, ShoppingCart, type LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  testId: string;
  /** Requires sign-in; shown with a lock when signed out. */
  requiresAuth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "This week", icon: Leaf, testId: "nav-this-week", requiresAuth: false },
  { path: "/schedule", label: "Schedule", icon: Calendar, testId: "nav-schedule", requiresAuth: false },
  { path: "/stock", label: "Stock", icon: Package, testId: "nav-stock", requiresAuth: true },
  { path: "/buy", label: "Buy", icon: ShoppingCart, testId: "nav-buy", requiresAuth: true },
];

export function isActivePath(current: string, itemPath: string): boolean {
  return itemPath === "/" ? current === "/" : current === itemPath || current.startsWith(`${itemPath}/`);
}

import { useAuth } from "@/hooks/useAuth";
import InventoryManager from "@/components/InventoryManager";
import LockedFeature from "@/components/LockedFeature";

export default function Stock() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <LockedFeature
        title="Sign in to unlock Inventory Tracking"
        description="Track product stock, units and purchase dates."
        buttonTestId="button-login-inventory"
      />
    );
  }
  return (
    <main className="container mx-auto px-3 py-4 sm:px-4">
      <InventoryManager />
    </main>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { useLawnSize } from "@/lib/LawnSizeContext";
import PurchaseRecommendations from "@/components/PurchaseRecommendations";
import LockedFeature from "@/components/LockedFeature";

export default function Buy() {
  const { isAuthenticated } = useAuth();
  const { lawnSize } = useLawnSize();
  if (!isAuthenticated) {
    return (
      <LockedFeature
        title="Sign in to unlock Purchase Recommendations"
        description="Get forecasts and suggested quantities based on your inventory."
        buttonTestId="button-login-purchase"
      />
    );
  }
  return (
    <main className="container mx-auto px-3 py-4 sm:px-4">
      <PurchaseRecommendations lawnSize={lawnSize} />
    </main>
  );
}

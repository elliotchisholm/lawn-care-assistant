import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedFeatureProps {
  title: string;
  description: string;
  buttonTestId: string;
}

export default function LockedFeature({ title, description, buttonTestId }: LockedFeatureProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-16 text-center">
      <Lock className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button
        className="min-h-12 w-full"
        onClick={() => {
          window.location.href = "/login";
        }}
        data-testid={buttonTestId}
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign in to unlock
      </Button>
    </div>
  );
}

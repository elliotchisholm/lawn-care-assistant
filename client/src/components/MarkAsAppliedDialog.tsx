import { useState } from "react";
import { Check, AlertTriangle, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductAdjustment {
  productName: string;
  amountToDeduct: number;
  unit: string;
  currentInventory: number;
  newInventory: number;
  isInsufficient: boolean;
}

interface MarkAsAppliedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  adjustments: ProductAdjustment[];
  onConfirm: (adjustments: ProductAdjustment[]) => void;
  isPending?: boolean;
}

export default function MarkAsAppliedDialog({
  isOpen,
  onClose,
  weekNumber,
  adjustments,
  onConfirm,
  isPending = false,
}: MarkAsAppliedDialogProps) {
  const hasInsufficientInventory = adjustments.some(adj => adj.isInsufficient);
  const canApply = !hasInsufficientInventory;

  return (
    <ResponsiveSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <span className="flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          Mark Week {weekNumber} as Applied?
        </span>
      }
      description="This will record that you've applied these products to your lawn and deduct the quantities from your inventory."
      contentClassName="sm:max-w-2xl max-h-[85vh] md:overflow-y-auto"
      data-testid="dialog-mark-applied"
      footer={
        <>
          <Button
            variant="outline"
            className="min-h-12"
            onClick={onClose}
            disabled={isPending}
            data-testid="button-cancel-mark-applied"
          >
            Cancel
          </Button>
          <Button
            className="min-h-12"
            onClick={() => onConfirm(adjustments)}
            disabled={!canApply || isPending}
            data-testid="button-confirm-mark-applied"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark as Applied
              </>
            )}
          </Button>
        </>
      }
    >
        <div className="space-y-4 py-2">
          {hasInsufficientInventory && (
            <Alert variant="destructive" data-testid="alert-insufficient-inventory">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Insufficient Inventory:</strong> You don't have enough stock for some products. 
                Update your inventory before marking this week as applied.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Inventory Adjustments:</h4>
            
            {adjustments.map((adj, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  adj.isInsufficient ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
                data-testid={`adjustment-${adj.productName?.replace(/\s+/g, '-').toLowerCase() || 'product'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{adj.productName}</p>
                      {adj.isInsufficient && (
                        <Badge variant="destructive" className="text-xs">
                          Insufficient
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Deduct: {adj.amountToDeduct}{adj.unit}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={adj.isInsufficient ? 'text-destructive font-medium' : ''}>
                        {adj.currentInventory}{adj.unit}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className={adj.isInsufficient ? 'text-destructive font-bold' : 'text-primary font-medium'}>
                        {adj.newInventory}{adj.unit}
                      </span>
                    </div>
                    {adj.isInsufficient && (
                      <p className="text-xs text-destructive mt-1">
                        Need {Math.abs(adj.newInventory)}{adj.unit} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!hasInsufficientInventory && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Tip:</strong> You can undo this action later if needed.
              </p>
            </div>
          )}
        </div>

    </ResponsiveSheet>
  );
}

// Component for showing "Already Applied" state with undo option
interface AppliedBadgeProps {
  weekNumber: number;
  appliedDate: string;
  onUndo: () => void;
  isUndoing?: boolean;
}

export function AppliedBadge({
  weekNumber,
  appliedDate,
  onUndo,
  isUndoing = false,
}: AppliedBadgeProps) {
  return (
    <div 
      className="bg-primary/10 border border-primary/30 rounded-lg p-4"
      data-testid="badge-already-applied"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-2">
            <Check className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Week {weekNumber} Applied</p>
            <p className="text-xs text-muted-foreground">
              Marked as applied on {appliedDate}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="min-h-11"
          onClick={onUndo}
          disabled={isUndoing}
          data-testid="button-undo-application"
        >
          {isUndoing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Undoing...
            </>
          ) : (
            <>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

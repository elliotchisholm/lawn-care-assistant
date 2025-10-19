import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Droplets, Beaker, CheckCircle, XCircle, AlertTriangle, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convertQuantity } from "@shared/unitConversions";
import { normalizeProductName } from "@shared/canonicalProductNames";
import type { ApplicationDay, InventoryAdjustment } from "@shared/schema";
import MarkAsAppliedDialog, { AppliedBadge } from "./MarkAsAppliedDialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  userId: string;
  productName: string;
  currentQuantity: string;
  unit: string;
  notes?: string;
  lastUpdated: string;
  purchaseDate?: string;
}

interface ProductCardProps {
  applicationDays: ApplicationDay[];
  lawnSize: number;
  weekNumber: number;
  isCurrentWeek: boolean;
  className?: string;
}

export default function ProductCard({ 
  applicationDays,
  lawnSize,
  weekNumber,
  isCurrentWeek,
  className = ""
}: ProductCardProps) {
  const scaleFactor = lawnSize / 100; // Base calculations are per 100m²
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // UI state for mark as applied dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch inventory data for authenticated user (keyed by user ID to prevent cache staleness)
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", user?.id],
    enabled: isAuthenticated,
  });

  // Fetch applied week status
  interface AppliedWeek {
    id: string;
    userId: string;
    weekNumber: number;
    appliedAt: string;
    adjustments: unknown;
  }

  const { data: appliedWeek } = useQuery<AppliedWeek | null>({
    queryKey: ["/api/applied-weeks", weekNumber],
    enabled: isAuthenticated,
  });

  const isApplied = !!appliedWeek;
  const appliedDate = appliedWeek?.appliedAt 
    ? new Date(appliedWeek.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Mutation to mark week as applied
  const markAsAppliedMutation = useMutation({
    mutationFn: async (adjustments: InventoryAdjustment[]) => {
      const res = await apiRequest("POST", "/api/applied-weeks", { weekNumber, adjustments });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applied-weeks", weekNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({
        title: "Week marked as applied",
        description: `Week ${weekNumber} has been marked as applied and inventory updated.`
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark as applied",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation to undo week application
  const undoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/applied-weeks/${weekNumber}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applied-weeks", weekNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({
        title: "Application undone",
        description: `Week ${weekNumber} has been unmarked and inventory restored.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to undo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper function to get inventory status for a product
  const getInventoryStatus = (productName: string, requiredQuantity: number, unit: string) => {
    const normalizedProductName = normalizeProductName(productName);
    const inventoryItems = inventory.filter(item => 
      normalizeProductName(item.productName) === normalizedProductName
    );
    
    if (inventoryItems.length === 0) {
      return {
        status: 'out_of_stock' as const,
        currentQuantity: 0,
        sufficient: false,
        message: 'No stock'
      };
    }

    const totalConverted = inventoryItems.reduce((sum, item) => {
      const qty = parseFloat(item.currentQuantity);
      const converted = convertQuantity(qty, item.unit, unit);
      return sum + converted;
    }, 0);
    
    const sufficient = totalConverted >= requiredQuantity;
    
    return {
      status: sufficient ? 'sufficient' as const : 'insufficient' as const,
      currentQuantity: totalConverted,
      sufficient,
      message: sufficient ? 'In stock' : 'Low stock'
    };
  };

  // Helper function to get status icon and color
  const getStatusDisplay = (status: 'sufficient' | 'insufficient' | 'out_of_stock') => {
    switch (status) {
      case 'sufficient':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
          textColor: 'text-green-900 dark:text-green-100',
          badge: 'sufficient'
        };
      case 'insufficient':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          badge: 'low'
        };
      case 'out_of_stock':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
          textColor: 'text-red-900 dark:text-red-100',
          badge: 'out'
        };
    }
  };

  return (
    <Card className={className} data-testid="card-product-recommendation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          Product Application
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Droplets className="h-4 w-4" />
          <span>All tank mixes in <span className="font-medium">5L</span> of water per 100m²</span>
          <Badge variant="outline" className="text-xs">for {lawnSize}m²</Badge>
        </div>
        
        <Separator />
        
        {/* Render multi-day application structure */}
        <div className="space-y-6">
          {applicationDays.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-3">
              {day.dayLabel && (
                <h4 className="font-semibold text-sm text-primary" data-testid={`day-label-${dayIndex}`}>
                  {day.dayLabel}
                </h4>
              )}
              
              <div className="space-y-3">
                {day.products.map((product, productIndex) => {
                  const scaledQuantity = product.quantity * scaleFactor;
                  const inventoryStatus = getInventoryStatus(product.name, scaledQuantity, product.unit);
                  const statusDisplay = getStatusDisplay(inventoryStatus.status);
                  const StatusIcon = statusDisplay.icon;
                  
                  return (
                    <div key={productIndex}>
                      <div 
                        className={`flex items-center justify-between p-3 rounded-md border ${statusDisplay.bgColor} ${statusDisplay.textColor}`}
                        data-testid={`product-${dayIndex}-${productIndex}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium" data-testid={`text-product-${dayIndex}-${productIndex}`}>
                              {product.name}
                              {product.alternativeName && (
                                <span className="text-xs opacity-70"> (or {product.alternativeName})</span>
                              )}
                            </p>
                            <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={product.type === 'liquid' ? 'default' : product.type === 'granular' ? 'secondary' : 'destructive'} className="text-xs">
                              {product.type}
                            </Badge>
                            <Badge 
                              variant={inventoryStatus.status === 'sufficient' ? 'default' : 'destructive'} 
                              className="text-xs"
                              data-testid={`badge-stock-${dayIndex}-${productIndex}`}
                            >
                              {statusDisplay.badge}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-sm font-medium" data-testid={`text-current-stock-${dayIndex}-${productIndex}`}>
                              Stock: {inventoryStatus.currentQuantity}{product.unit}
                            </p>
                            <span className="text-sm text-muted-foreground">/</span>
                            <p className="text-sm text-muted-foreground">
                              Need: {scaledQuantity.toFixed(0)}{product.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-lg" data-testid={`text-quantity-${dayIndex}-${productIndex}`}>
                            {scaledQuantity.toFixed(0)}{product.unit}
                          </p>
                          <p className="text-xs opacity-70">
                            ({product.quantity}{product.unit}/100m²)
                          </p>
                        </div>
                      </div>
                      
                      {product.productNotes && (
                        <div className="ml-4 mt-1 p-2 bg-accent/10 rounded text-xs text-muted-foreground border-l-2 border-accent/50">
                          └─ {product.productNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {day.dayNotes && (
                <div className="p-2 bg-accent/10 rounded-md border border-accent/30 text-sm italic">
                  {day.dayNotes}
                </div>
              )}
              
              {dayIndex < applicationDays.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>

        {/* Mark as Applied Section - Only for current week and authenticated users */}
        {isCurrentWeek && isAuthenticated && (
          <>
            <Separator />
            
            {isApplied ? (
              <AppliedBadge
                weekNumber={weekNumber}
                appliedDate={appliedDate || ""}
                onUndo={() => undoMutation.mutate()}
                isUndoing={undoMutation.isPending}
              />
            ) : (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="w-full"
                size="lg"
                data-testid="button-mark-as-applied"
              >
                <Check className="h-5 w-5 mr-2" />
                Mark Week {weekNumber} as Applied
              </Button>
            )}
          </>
        )}

        {/* Mark as Applied Dialog */}
        <MarkAsAppliedDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          weekNumber={weekNumber}
          adjustments={
            // Calculate adjustments from applicationDays
            applicationDays.flatMap(day =>
              day.products.map(product => {
                const scaledQuantity = Math.round(product.quantity * scaleFactor);
                const inventoryStatus = getInventoryStatus(product.name, scaledQuantity, product.unit);
                const newInventory = inventoryStatus.currentQuantity - scaledQuantity;
                
                return {
                  productName: product.name,
                  amountToDeduct: scaledQuantity,
                  unit: product.unit,
                  currentInventory: inventoryStatus.currentQuantity,
                  newInventory: Math.max(0, newInventory),
                  isInsufficient: newInventory < 0,
                };
              })
            )
          }
          onConfirm={(adjustments) => {
            // Convert dialog adjustments to backend format
            const backendAdjustments: InventoryAdjustment[] = adjustments.map(adj => ({
              productName: adj.productName,
              amountDeducted: adj.amountToDeduct,
              unit: adj.unit,
              previousQuantity: adj.currentInventory,
              newQuantity: adj.newInventory
            }));
            
            markAsAppliedMutation.mutate(backendAdjustments);
          }}
          isPending={markAsAppliedMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InventoryForm, { type InventoryItem } from "@/components/InventoryForm";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const slug = (name: string) => name.replace(/\s+/g, "-").toLowerCase();

export default function InventoryManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch inventory data (user-scoped to prevent cache staleness)
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", user?.id],
    queryFn: async (): Promise<InventoryItem[]> => {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete inventory item" }));
        throw new Error(errorData.error || errorData.message || "Failed to delete inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingItem(undefined);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-11 w-11" />
                  <Skeleton className="h-11 w-11" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-24">
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inventory items yet</p>
              <p className="text-sm">Add your first product to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-16 items-center justify-between gap-2 p-3 border rounded-xl"
                  data-testid={`inventory-item-${slug(item.productName)}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="font-medium" data-testid="text-product-name">
                        {item.productName}
                      </h4>
                      <Badge variant="secondary" data-testid="text-quantity">
                        {item.currentQuantity} {item.unit}
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      aria-label={`Edit ${item.productName}`}
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${slug(item.productName)}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11"
                      aria-label={`Delete ${item.productName}`}
                      onClick={() => setPendingDelete(item)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${slug(item.productName)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleAdd}
        size="lg"
        aria-label="Add product"
        className="fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-30 h-14 w-14 rounded-full p-0 shadow-lg lg:bottom-6 lg:right-6 lg:w-auto lg:rounded-full lg:px-6"
        data-testid="button-add-inventory"
      >
        <Plus className="h-6 w-6 lg:mr-2 lg:h-4 lg:w-4" />
        <span className="hidden lg:inline">Add Product</span>
      </Button>

      <InventoryForm item={editingItem} open={isFormOpen} onOpenChange={handleFormClose} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inventory item?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `${pendingDelete.productName} will be removed from your inventory.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

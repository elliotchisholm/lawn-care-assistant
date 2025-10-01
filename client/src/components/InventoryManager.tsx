import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";


// Form validation schemas
const inventoryFormSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  currentQuantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventoryFormSchema>;

// Common NZLA product options (matches WeeklySchedule product names)
const commonProducts = [
  "Wetter 3W",
  "Nurture", 
  "Root Health",
  "Humic+",
  "Iron+",
  "Amino",
  "Restore",
  "Liquid N",
  "Liquid Boost", 
  "Grub+",
  "All Seasons",
  "Charger"
];

const commonUnits = [
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" }
];

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

interface InventoryFormProps {
  item?: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InventoryForm({ item, open, onOpenChange }: InventoryFormProps) {
  const { toast } = useToast();
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      productName: "",
      currentQuantity: "",
      unit: "ml",
      notes: "",
    },
  });

  // Reset form when item changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (item) {
        // Editing existing item - populate form with item data
        form.reset({
          productName: item.productName,
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          notes: item.notes || "",
        });
      } else {
        // Adding new item - reset to defaults
        form.reset({
          productName: "",
          currentQuantity: "",
          unit: "ml",
          notes: "",
        });
      }
    }
  }, [item, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      // Validate that quantity is a valid number (but send as string for decimal precision)
      const quantity = parseFloat(data.currentQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a valid positive number");
      }
      
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: data.productName,
          currentQuantity: data.currentQuantity, // Send as string for decimal precision
          unit: data.unit,
          notes: data.notes || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create inventory item" }));
        
        // Handle Zod validation errors with specific field messages
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors = errorData.details.map((err: any) => 
            `${err.path?.join('.')} ${err.message}`
          ).join(', ');
          throw new Error(fieldErrors);
        }
        
        throw new Error(errorData.error || errorData.message || "Failed to create inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: "Success", 
        description: "Inventory item added successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      if (!item) throw new Error("No item to update");
      
      // Validate that quantity is a valid number (but send as string for decimal precision)
      const quantity = parseFloat(data.currentQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a valid positive number");
      }
      
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: data.productName,
          currentQuantity: data.currentQuantity, // Send as string for decimal precision
          unit: data.unit,
          notes: data.notes || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update inventory item" }));
        
        // Handle Zod validation errors with specific field messages
        if (errorData.details && Array.isArray(errorData.details)) {
          const fieldErrors = errorData.details.map((err: any) => 
            `${err.path?.join('.')} ${err.message}`
          ).join(', ');
          throw new Error(fieldErrors);
        }
        
        throw new Error(errorData.error || errorData.message || "Failed to update inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ 
        title: "Success", 
        description: "Inventory item updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryFormData) => {
    if (item) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Inventory Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-product">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonProducts.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1000" 
                        type="number"
                        step="0.01"
                        data-testid="input-quantity"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {commonUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Purchased on..." 
                      data-testid="input-notes"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-inventory"
              >
                {isLoading ? "Saving..." : item ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const { toast } = useToast();

  // Fetch inventory data
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    queryFn: async (): Promise<InventoryItem[]> => {
      const response = await fetch(`/api/inventory`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  // Delete mutation
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      deleteMutation.mutate(id);
    }
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
          <div className="text-center py-8">Loading inventory...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </div>
          <Button onClick={handleAdd} size="sm" data-testid="button-add-inventory">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`inventory-item-${item.productName.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-${item.productName.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${item.productName.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <InventoryForm
          item={editingItem}
          open={isFormOpen}
          onOpenChange={handleFormClose}
        />
      </CardContent>
    </Card>
  );
}
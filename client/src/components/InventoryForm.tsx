import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { NZLA_PRODUCTS } from "@shared/products";
import { sameProduct } from "@/lib/productMatching";
import { useAuth } from "@/hooks/useAuth";
import { quantitySchema, MAX_QUANTITY, MAX_NOTES_LENGTH } from "@shared/validation";

// Form validation schemas
const inventoryFormSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  currentQuantity: quantitySchema,
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

type InventoryFormData = z.infer<typeof inventoryFormSchema>;

const liquidUnits = [
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
];

const granularUnits = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
];

// Get appropriate units based on product type
function getUnitsForProduct(productName: string) {
  const product = NZLA_PRODUCTS.find(p => sameProduct(p.name, productName));
  if (!product) return liquidUnits; // Default to liquid
  return product.unit === "g" ? granularUnits : liquidUnits;
}

// Get default unit for a product
function getDefaultUnitForProduct(productName: string) {
  const product = NZLA_PRODUCTS.find(p => sameProduct(p.name, productName));
  if (!product) return "ml"; // Default to ml
  return product.unit === "g" ? "g" : "ml";
}

export interface InventoryItem {
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

export default function InventoryForm({ item, open, onOpenChange }: InventoryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
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
      // Validate that quantity is a valid positive number for new items
      const quantity = parseFloat(data.currentQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a positive number when adding new inventory");
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
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
      
      // Validate that quantity is a valid non-negative number (allow 0 for used-up inventory)
      const quantity = parseFloat(data.currentQuantity);
      if (isNaN(quantity) || quantity < 0) {
        throw new Error("Quantity cannot be negative");
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
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
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
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${item ? "Edit" : "Add"} Inventory Item`}
      description={item ? "Update the details for this inventory item." : "Add a new product to your inventory."}
      contentClassName="sm:max-w-[425px]"
      data-testid="sheet-inventory-form"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-set the appropriate unit for this product
                        form.setValue("unit", getDefaultUnitForProduct(value));
                      }}
                    >
                      <SelectTrigger data-testid="select-product">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {NZLA_PRODUCTS.map((product) => (
                          <SelectItem key={product.name} value={product.name}>
                            {product.name}
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
                        min="0"
                        max={MAX_QUANTITY}
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
                render={({ field }) => {
                  const selectedProduct = form.watch("productName");
                  const availableUnits = getUnitsForProduct(selectedProduct);
                  return (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                      maxLength={MAX_NOTES_LENGTH}
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
                className="min-h-12"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="min-h-12"
                disabled={isLoading}
                data-testid="button-save-inventory"
              >
                {isLoading ? "Saving..." : item ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
    </ResponsiveSheet>
  );
}


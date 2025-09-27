import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Droplets, Beaker, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


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

interface Product {
  name: string;
  quantity: number;
  unit: string;
  type: 'liquid' | 'granular';
}

interface ProductCardProps {
  products: Product[];
  waterVolume: number;
  lawnSize: number;
  applicationNotes?: string;
  className?: string;
}

export default function ProductCard({ 
  products, 
  waterVolume, 
  lawnSize, 
  applicationNotes,
  className = ""
}: ProductCardProps) {
  const scaleFactor = lawnSize / 100; // Base calculations are per 100m²

  // Fetch inventory data for authenticated user
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Helper function to get inventory status for a product
  const getInventoryStatus = (productName: string, requiredQuantity: number, unit: string) => {
    const inventoryItem = inventory.find(item => 
      item.productName === productName && item.unit === unit
    );
    
    if (!inventoryItem) {
      return {
        status: 'out_of_stock' as const,
        currentQuantity: 0,
        sufficient: false,
        message: 'No stock'
      };
    }

    const currentQty = parseFloat(inventoryItem.currentQuantity);
    const sufficient = currentQty >= requiredQuantity;
    
    return {
      status: sufficient ? 'sufficient' as const : 'insufficient' as const,
      currentQuantity: currentQty,
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
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badge: 'sufficient'
        };
      case 'insufficient':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          badge: 'low'
        };
      case 'out_of_stock':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
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
          Tank mix in <span className="font-medium">{(waterVolume * scaleFactor).toFixed(1)}L</span> of water
          <Badge variant="outline" className="text-xs">for {lawnSize}m²</Badge>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          {products.map((product, index) => {
            const scaledQuantity = product.quantity * scaleFactor;
            const inventoryStatus = getInventoryStatus(product.name, scaledQuantity, product.unit);
            const statusDisplay = getStatusDisplay(inventoryStatus.status);
            const StatusIcon = statusDisplay.icon;
            
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-md border ${statusDisplay.bgColor}`}
                data-testid={`product-${index}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium" data-testid={`text-product-${index}`}>{product.name}</p>
                    <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={product.type === 'liquid' ? 'default' : 'secondary'} className="text-xs">
                      {product.type}
                    </Badge>
                    <Badge 
                      variant={inventoryStatus.status === 'sufficient' ? 'default' : 'destructive'} 
                      className="text-xs"
                      data-testid={`badge-stock-${index}`}
                    >
                      {statusDisplay.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current stock: {inventoryStatus.currentQuantity}{product.unit}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-lg" data-testid={`text-quantity-${index}`}>
                    {scaledQuantity.toFixed(0)}{product.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({product.quantity}{product.unit}/100m²)
                  </p>
                  <p className={`text-xs font-medium ${inventoryStatus.sufficient ? statusDisplay.color : 'text-red-600'}`}>
                    {inventoryStatus.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {applicationNotes && (
          <>
            <Separator />
            <div className="p-3 bg-accent/20 rounded-md border border-accent/30">
              <p className="text-sm text-accent-foreground font-medium mb-1">Application Notes:</p>
              <p className="text-sm text-muted-foreground">{applicationNotes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
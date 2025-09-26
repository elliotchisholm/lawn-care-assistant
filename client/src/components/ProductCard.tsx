import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Droplets, Beaker } from "lucide-react";

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
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div>
                  <p className="font-medium" data-testid={`text-product-${index}`}>{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={product.type === 'liquid' ? 'default' : 'secondary'} className="text-xs">
                      {product.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg" data-testid={`text-quantity-${index}`}>
                    {scaledQuantity.toFixed(0)}{product.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({product.quantity}{product.unit}/100m²)
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
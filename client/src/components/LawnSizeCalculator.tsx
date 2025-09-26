import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface LawnSizeCalculatorProps {
  onSizeChange: (size: number) => void;
  currentSize: number;
}

export default function LawnSizeCalculator({ onSizeChange, currentSize }: LawnSizeCalculatorProps) {
  const [inputValue, setInputValue] = useState(currentSize.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseFloat(inputValue);
    if (size > 0) {
      onSizeChange(size);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <Card data-testid="card-lawn-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Lawn Size Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lawn-size">Lawn Area (square meters)</Label>
            <div className="relative">
              <Input
                id="lawn-size"
                type="number"
                placeholder="100"
                value={inputValue}
                onChange={handleInputChange}
                className="pr-10"
                min="1"
                step="0.1"
                data-testid="input-lawn-size"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                m²
              </span>
            </div>
          </div>
          <Button type="submit" className="w-full" data-testid="button-calculate">
            Calculate Products
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
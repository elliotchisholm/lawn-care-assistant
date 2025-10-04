import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LawnSizeCalculatorProps {
  onSizeChange: (size: number) => void;
  currentSize: number;
  isSaving?: boolean;
  isLoading?: boolean;
  saveSuccess?: boolean;
}

export default function LawnSizeCalculator({ onSizeChange, currentSize, isSaving, isLoading, saveSuccess }: LawnSizeCalculatorProps) {
  const [inputValue, setInputValue] = useState(currentSize.toString());
  const [showSaved, setShowSaved] = useState(false);

  // Sync input value with currentSize prop when it changes
  useEffect(() => {
    setInputValue(currentSize.toString());
  }, [currentSize]);

  // Show "saved" indicator briefly after successful save
  useEffect(() => {
    if (saveSuccess) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowSaved(false);
    }
  }, [saveSuccess]);

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
    <Card data-testid="card-lawn-calculator" className="transition-all">
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
                disabled={isLoading || isSaving}
                data-testid="input-lawn-size"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                m²
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 min-h-12 transition-all" 
              disabled={isLoading || isSaving}
              data-testid="button-calculate"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Calculate Products"
              )}
            </Button>
            {showSaved && !isSaving && (
              <div 
                className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-2"
                data-testid="text-saved-indicator"
              >
                <Check className="h-4 w-4" />
                Saved
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
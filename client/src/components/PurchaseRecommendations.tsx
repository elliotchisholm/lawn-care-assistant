import { useState } from "react";
import { ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { usePurchaseRecommendations, DEFAULT_LOOKAHEAD_WEEKS } from "@/hooks/usePurchaseRecommendations";
import { urgencyOf, type PurchaseRecommendation, type Urgency } from "@/lib/purchaseRecommendations";
import { cn } from "@/lib/utils";

interface PurchaseRecommendationsProps {
  lawnSize: number;
}

const WEEK_PRESETS = [2, 4, 8, 12, 26];

const GROUPS: { key: Urgency; label: string }[] = [
  { key: "now", label: "Buy now" },
  { key: "soon", label: "Running low" },
  { key: "later", label: "Later" },
];

const plural = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

export default function PurchaseRecommendations({ lawnSize }: PurchaseRecommendationsProps) {
  const [weeksToAnalyze, setWeeksToAnalyze] = useState(DEFAULT_LOOKAHEAD_WEEKS); // min 1, max 52
  const { recommendations, isLoading } = usePurchaseRecommendations(lawnSize, weeksToAnalyze);

  const title = (
    <span className="flex items-center gap-2">
      <ShoppingCart className="h-5 w-5" />
      Purchase Recommendations
    </span>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  const weeksControl = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" data-testid="label-weeks-selector">
          Look ahead: {plural(weeksToAnalyze)}
        </label>
        <span className="text-xs text-muted-foreground">{lawnSize}m² lawn</span>
      </div>

      <div className="flex gap-2 lg:hidden" role="group" aria-label="Look ahead weeks" data-testid="weeks-presets">
        {WEEK_PRESETS.map((weeks) => (
          <button
            key={weeks}
            type="button"
            aria-pressed={weeks === weeksToAnalyze}
            onClick={() => setWeeksToAnalyze(weeks)}
            className={cn(
              "min-h-11 flex-1 rounded-lg border text-sm font-medium",
              weeks === weeksToAnalyze ? "border-primary bg-primary text-primary-foreground" : "bg-card",
            )}
            data-testid={`button-weeks-${weeks}`}
          >
            {weeks}w
          </button>
        ))}
      </div>

      <div className="hidden lg:block">
        <Slider
          value={[weeksToAnalyze]}
          onValueChange={(value) => setWeeksToAnalyze(value[0])}
          min={1}
          max={52}
          step={1}
          className="w-full"
          data-testid="slider-weeks"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>1 week</span>
          <span>52 weeks</span>
        </div>
      </div>
    </div>
  );

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeksControl}
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Your inventory looks good!</p>
            <p className="text-sm">No immediate purchases needed for the next {plural(weeksToAnalyze)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const indexed = recommendations.map((rec, index) => ({ rec, index }));

  const renderRow = (rec: PurchaseRecommendation, index: number) => (
    <div
      key={`${rec.productName}_${rec.unit}`}
      className="flex items-center justify-between gap-3 p-4 border border-destructive/20 rounded-xl bg-destructive/5 dark:bg-destructive/10"
      data-testid={`purchase-recommendation-${index}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground" data-testid="text-product-name">
            {rec.alternativeName ? `${rec.productName} or ${rec.alternativeName}` : rec.productName}
          </h4>
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-muted-foreground">
            Current: {rec.currentStock}
            {rec.unit}
          </p>
          <p className="text-sm text-muted-foreground">
            Need: {rec.totalNeeded.toFixed(0)}
            {rec.unit}
          </p>
          {rec.weeksUntilEmpty > 0 && (
            <Badge variant="secondary" className="text-xs">
              {rec.weeksUntilEmpty} weeks left
            </Badge>
          )}
          {rec.weeksUntilEmpty === 0 && (
            <Badge variant="destructive" className="text-xs">
              Out of stock
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-lg text-destructive" data-testid="text-suggested-purchase">
          {rec.packageRecommendation ? (
            <>Buy: {rec.packageRecommendation}</>
          ) : (
            <>
              Buy: {rec.suggestedPurchase}
              {rec.unit}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {rec.packageRecommendation && (
            <>
              = {rec.suggestedPurchase}
              {rec.unit} total •{" "}
            </>
          )}
          Shortfall: {rec.shortfall.toFixed(0)}
          {rec.unit}
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="destructive" className="text-xs">
            {recommendations.length} {recommendations.length === 1 ? "item" : "items"} needed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weeksControl}

        <Separator />

        <div className="space-y-5">
          {GROUPS.map(({ key, label }) => {
            const rows = indexed.filter(({ rec }) => urgencyOf(rec) === key);
            if (rows.length === 0) return null;
            return (
              <section key={key} aria-label={label} data-testid={`group-${key}`}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
                <div className="space-y-3">{rows.map(({ rec, index }) => renderRow(rec, index))}</div>
              </section>
            );
          })}
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground text-center">
          Purchase amounts calculated to cover your shortfall for the next {plural(weeksToAnalyze)}
        </div>
      </CardContent>
    </Card>
  );
}

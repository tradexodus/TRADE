import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AdvancedTradingOptionsProps {
  disabled?: boolean;
  currentPrice?: number;
}

export default function AdvancedTradingOptions({
  disabled = false,
  currentPrice = 50000, // Default mock price for BTC/USD
}: AdvancedTradingOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useStopLoss, setUseStopLoss] = useState(false);
  const [useTakeProfit, setUseTakeProfit] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");

  // Calculate default values (5% below for stop loss, 5% above for take profit)
  const defaultStopLoss = (currentPrice * 0.95).toFixed(2);
  const defaultTakeProfit = (currentPrice * 1.05).toFixed(2);

  const handleStopLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setStopLossPrice(value);
    }
  };

  const handleTakeProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setTakeProfitPrice(value);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border rounded-md p-2 bg-muted/20"
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Advanced Options</Label>
        <CollapsibleTrigger asChild>
          <button className="hover:bg-muted p-1 rounded-md">
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="pt-2 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="stop-loss-toggle"
              className={`text-sm ${disabled ? "text-muted-foreground" : ""}`}
            >
              Stop Loss
            </Label>
            <Switch
              id="stop-loss-toggle"
              checked={useStopLoss}
              onCheckedChange={setUseStopLoss}
              disabled={disabled}
            />
          </div>

          {useStopLoss && (
            <div className="pl-2 border-l-2 border-muted space-y-1">
              <div className="flex gap-2 items-center">
                <Input
                  id="stop-loss-price"
                  type="text"
                  value={stopLossPrice || ""}
                  onChange={handleStopLossChange}
                  placeholder={defaultStopLoss}
                  className="h-8 text-sm"
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sell if price falls below this value
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="take-profit-toggle"
              className={`text-sm ${disabled ? "text-muted-foreground" : ""}`}
            >
              Take Profit
            </Label>
            <Switch
              id="take-profit-toggle"
              checked={useTakeProfit}
              onCheckedChange={setUseTakeProfit}
              disabled={disabled}
            />
          </div>

          {useTakeProfit && (
            <div className="pl-2 border-l-2 border-muted space-y-1">
              <div className="flex gap-2 items-center">
                <Input
                  id="take-profit-price"
                  type="text"
                  value={takeProfitPrice || ""}
                  onChange={handleTakeProfitChange}
                  placeholder={defaultTakeProfit}
                  className="h-8 text-sm"
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sell if price rises above this value
              </p>
            </div>
          )}
        </div>

        <div className="pt-1">
          <p className="text-xs text-muted-foreground italic">
            Note: These features are currently for display purposes only
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

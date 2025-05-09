import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TradingStatsCardProps {
  activeTrades: number;
  totalTradeValue: number;
  loading: boolean;
}

export function TradingStatsCard({
  activeTrades,
  totalTradeValue,
  loading,
}: TradingStatsCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg h-full text-sm">
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
        <CardTitle className="flex items-center gap-1 text-xs sm:text-sm">
          <TrendingUp className="h-3 w-3 text-blue-400" />
          <span>Trading</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 p-2 sm:pt-4 sm:p-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Active Trades</p>
            <p className="text-lg font-medium">
              {loading ? "Loading..." : activeTrades}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Total Trade Value</p>
            <p className="text-lg font-medium">
              ${loading ? "Loading..." : totalTradeValue.toFixed(2)}
            </p>
          </div>

          <div className="pt-1">
            <a
              href="/ai-trading"
              className="inline-flex items-center justify-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Start Trading
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

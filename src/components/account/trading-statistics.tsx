import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import {
  ArrowUp,
  ArrowDown,
  BarChart3,
  Repeat,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface TradingStats {
  totalTrades: number;
  profitableTrades: number;
  totalTurnover: number;
  totalProfit: number;
  maxTradeValue: number;
  minTradeValue: number;
  maxProfit: number;
}

export default function TradingStatistics() {
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    profitableTrades: 0,
    totalTurnover: 0,
    totalProfit: 0,
    maxTradeValue: 0,
    minTradeValue: 0,
    maxProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTradingStats();
  }, []);

  async function fetchTradingStats() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch trading data from the trades table
      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id);

      if (trades && trades.length > 0) {
        // Calculate statistics
        const totalTrades = trades.length;
        const profitableTrades = trades.filter(
          (trade) => trade.profit > 0,
        ).length;
        const totalTurnover = trades.reduce(
          (sum, trade) => sum + trade.amount,
          0,
        );
        const totalProfit = trades.reduce(
          (sum, trade) => sum + (trade.profit || 0),
          0,
        );
        const maxTradeValue = Math.max(...trades.map((trade) => trade.amount));
        const minTradeValue = Math.min(...trades.map((trade) => trade.amount));
        const maxProfit = Math.max(...trades.map((trade) => trade.profit || 0));

        setStats({
          totalTrades,
          profitableTrades,
          totalTurnover,
          totalProfit,
          maxTradeValue,
          minTradeValue,
          maxProfit,
        });
      }
    } catch (error) {
      console.error("Error fetching trading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  // Format number with 2 decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  // Calculate percentage of profitable trades
  const profitablePercentage =
    stats.totalTrades > 0
      ? ((stats.profitableTrades / stats.totalTrades) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6 w-full">
      <h3 className="text-lg font-medium">Trading Statistics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trades Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <h4 className="text-2xl font-bold mt-1">{stats.totalTrades}</h4>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        {/* Profitable Trades Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Profitable Trades</p>
              <h4 className="text-2xl font-bold mt-1">
                {profitablePercentage}%
              </h4>
            </div>
            <div className="p-2 rounded-full bg-green-500/10">
              <ArrowUp className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        {/* Trading Turnover Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Trading Turnover</p>
              <h4 className="text-2xl font-bold mt-1">
                ${formatNumber(stats.totalTurnover)}
              </h4>
            </div>
            <div className="p-2 rounded-full bg-blue-500/10">
              <Repeat className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        {/* Trading Profit/Loss Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">
                Trading Profit/Loss
              </p>
              <h4
                className={`text-2xl font-bold mt-1 ${stats.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                ${formatNumber(stats.totalProfit)}
              </h4>
            </div>
            <div
              className={`p-2 rounded-full ${stats.totalProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}
            >
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        </Card>

        {/* Max Trade Value Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Max Trade Value</p>
              <h4 className="text-2xl font-bold mt-1">
                ${formatNumber(stats.maxTradeValue)}
              </h4>
            </div>
            <div className="p-2 rounded-full bg-purple-500/10">
              <Maximize2 className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </Card>

        {/* Min Trade Value Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Min Trade Value</p>
              <h4 className="text-2xl font-bold mt-1">
                ${formatNumber(stats.minTradeValue)}
              </h4>
            </div>
            <div className="p-2 rounded-full bg-orange-500/10">
              <Minimize2 className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </Card>

        {/* Max Profit Per Trade Card */}
        <Card className="p-4 bg-card hover:bg-card/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">
                Max Profit Per Trade
              </p>
              <h4 className="text-2xl font-bold mt-1">
                ${formatNumber(stats.maxProfit)}
              </h4>
            </div>
            <div className="p-2 rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

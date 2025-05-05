import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { ArrowDown, ArrowUp, History } from "lucide-react";

interface TradeHistoryProps {
  userId: string | null;
}

interface Trade {
  id: string;
  created_at: string;
  closed_at: string | null;
  crypto_pair: string;
  amount: number;
  profit_loss: number | null;
  status: string;
  trade_type: string;
}

export default function TradeHistory({ userId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTradeHistory() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("trading_history")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching trade history:", error);
          return;
        }

        setTrades(data || []);
      } catch (error) {
        console.error("Error in trade history fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTradeHistory();
  }, [userId]);

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Trading Activity
        </CardTitle>
        <CardDescription>
          Your recent AI trading history and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trading history yet</p>
            <p className="text-sm">Start trading to see your activity here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Pair</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-right py-3 px-2">Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-muted hover:bg-muted/30"
                  >
                    <td className="py-3 px-2">
                      {formatDate(trade.created_at)}
                    </td>
                    <td className="py-3 px-2">{trade.crypto_pair}</td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted">
                        {trade.trade_type}
                      </span>
                    </td>
                    <td className="py-3 px-2">${trade.amount.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">
                      {trade.profit_loss !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 ${trade.profit_loss > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {trade.profit_loss > 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          ${Math.abs(trade.profit_loss).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { History, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TradeHistoryTable from "./TradeHistoryTable";

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
  ai_reasoning?: string;
}

export default function TradeHistory({ userId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<
    "1h" | "24h" | "7d" | "30d" | "all"
  >("all");

  useEffect(() => {
    async function fetchTradeHistory() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let query = supabase
          .from("trading_history")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        // Apply time filter
        if (timeFilter !== "all") {
          const now = new Date();
          let startTime: Date;

          switch (timeFilter) {
            case "1h":
              startTime = new Date(now.getTime() - 60 * 60 * 1000);
              break;
            case "24h":
              startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case "7d":
              startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "30d":
              startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
          }

          query = query.gte("created_at", startTime.toISOString());
        }

        const { data, error } = await query.limit(10);

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
  }, [userId, timeFilter]);

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="max-w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Trading Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select
              value={timeFilter}
              onValueChange={(value) => setTimeFilter(value as any)}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Filter by time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          Your recent AI trading history and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TradeHistoryTable
          trades={trades}
          isLoading={isLoading}
          formatDate={formatDate}
        />
      </CardContent>
    </Card>
  );
}

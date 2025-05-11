import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp } from "lucide-react";

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

interface TradeHistoryTableProps {
  trades: Trade[];
  isLoading: boolean;
  formatDate: (dateString: string | null) => string;
}

export default function TradeHistoryTable({
  trades,
  isLoading,
  formatDate,
}: TradeHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-md animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No trading history yet</p>
        <p className="text-sm">Start trading to see your activity here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-w-full -mx-2 px-1 sm:mx-0 sm:px-0">
      <table className="w-full table-fixed text-[9px] sm:text-[12px] md:text-[16px]">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 sm:py-3 px-1 sm:px-2">Date</th>
            <th className="text-left py-2 sm:py-3 px-1 sm:px-2">Pair</th>
            <th className="text-left py-2 sm:py-3 px-1 sm:px-2">Type</th>
            <th className="text-left py-2 sm:py-3 px-1 sm:px-2">Amount</th>
            <th className="text-right py-2 sm:py-3 px-1 sm:px-2">P/L</th>
            <th className="text-left py-2 sm:py-3 px-1 sm:px-2">AI</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-muted hover:bg-muted/30"
            >
              <td className="py-2 sm:py-3 px-1 sm:px-2">
                {formatDate(trade.created_at)}
              </td>
              <td className="py-2 sm:py-3 px-1 sm:px-2">{trade.crypto_pair}</td>
              <td className="py-3 px-2">
                <span className="inline-flex items-center rounded-full px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-medium bg-muted">
                  {trade.trade_type}
                </span>
              </td>
              <td className="py-3 px-2">${trade.amount.toFixed(2)}</td>
              <td className="py-2 sm:py-3 px-1 sm:px-2 text-right">
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
              <td className="py-3 px-2">
                {trade.trade_type === "AUTO" && trade.ai_reasoning ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-xs text-left max-w-[150px] truncate text-muted-foreground hover:text-primary transition-colors">
                        {trade.ai_reasoning.substring(0, 30)}...
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[300px]">
                        <p>{trade.ai_reasoning}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : trade.trade_type === "AUTO" ? (
                  <span className="text-xs text-muted-foreground">
                    No reasoning available
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    N/A for manual trades
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

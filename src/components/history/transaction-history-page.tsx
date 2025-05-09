import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeft,
  TrendingUp,
  History,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  created_at: string;
  status: string;
  wallet_address?: string;
  screenshot_url?: string;
};

type Trade = {
  id: string;
  crypto_pair: string;
  trade_type: string;
  amount: number;
  profit_loss: number;
  status: string;
  created_at: string;
  closed_at: string | null;
  duration_minutes?: string;
};

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view history");
          return;
        }

        // Fetch deposits
        const { data: deposits, error: depositsError } = await supabase
          .from("deposits")
          .select("*")
          .eq("user_id", user.id);

        if (depositsError) throw depositsError;

        // Fetch withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.id);

        if (withdrawalsError) throw withdrawalsError;

        // Fetch trading history
        const { data: tradingHistory, error: tradingError } = await supabase
          .from("trading_history")
          .select("*")
          .eq("user_id", user.id);

        if (tradingError) throw tradingError;

        // We're no longer fetching trades data as requested

        // Combine and format transactions
        const formattedDeposits =
          deposits?.map((deposit) => ({
            ...deposit,
            type: "deposit" as const,
          })) || [];

        const formattedWithdrawals =
          withdrawals?.map((withdrawal) => ({
            ...withdrawal,
            type: "withdrawal" as const,
          })) || [];

        // Combine and sort by date (newest first)
        const allTransactions = [
          ...formattedDeposits,
          ...formattedWithdrawals,
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        // Only using trading history, not including trades
        const allTrades = [...(tradingHistory || [])].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setTransactions(allTransactions);
        setTrades(allTrades);
      } catch (error) {
        console.error("Error fetching history:", error);
        setError("Failed to load history");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load history",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading transaction history...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 space-y-1 bg-[#000000]">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">History</h1>
      </div>
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Transaction History</span>
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trading History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  No transactions found
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px]">Amount</TableHead>
                        <TableHead className="hidden md:table-cell w-[180px]">
                          Date
                        </TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Details
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={`${transaction.type}-${transaction.id}`}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {transaction.type === "deposit" ? (
                                <>
                                  <ArrowDownToLine className="h-4 w-4 text-green-500" />
                                  <span>Deposit</span>
                                </>
                              ) : (
                                <>
                                  <ArrowUpFromLine className="h-4 w-4 text-blue-500" />
                                  <span>Withdrawal</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span
                              className={`font-medium ${transaction.type === "deposit" ? "text-green-500" : "text-blue-500"}`}
                            >
                              {transaction.type === "deposit" ? "+" : "-"}$
                              {transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {format(
                              new Date(transaction.created_at),
                              "MMM d, yyyy h:mm a",
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                {
                                  pending: "bg-yellow-500/20 text-yellow-500",
                                  completed: "bg-green-500/20 text-green-500",
                                  rejected: "bg-red-500/20 text-red-500",
                                }[transaction.status] ||
                                "bg-gray-500/20 text-gray-500"
                              }`}
                            >
                              {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {transaction.type === "withdrawal" &&
                            transaction.wallet_address
                              ? `To: ${transaction.wallet_address.substring(0, 6)}...${transaction.wallet_address.substring(
                                  transaction.wallet_address.length - 4,
                                )}`
                              : transaction.type === "deposit" &&
                                  transaction.screenshot_url
                                ? "Receipt uploaded"
                                : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trades">
          {trades.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  No trading history found
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Trading History</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Crypto Pair</TableHead>
                        <TableHead className="hidden md:table-cell w-[80px]">
                          Type
                        </TableHead>
                        <TableHead className="w-[100px]">Amount</TableHead>
                        <TableHead className="w-[120px]">Profit/Loss</TableHead>
                        <TableHead className="hidden md:table-cell w-[180px]">
                          Date
                        </TableHead>
                        <TableHead className="hidden md:table-cell w-[100px]">
                          Status
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Duration
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {trade.crypto_pair}
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            <span className="capitalize">
                              {trade.trade_type}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            ${trade.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span
                              className={`font-medium ${trade.profit_loss >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {trade.profit_loss >= 0 ? "+" : "-"}$
                              {Math.abs(trade.profit_loss).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {format(
                              new Date(trade.created_at),
                              "MMM d, yyyy h:mm a",
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                {
                                  active: "bg-blue-500/20 text-blue-500",
                                  profit: "bg-green-500/20 text-green-500",
                                  loss: "bg-red-500/20 text-red-500",
                                  pending: "bg-yellow-500/20 text-yellow-500",
                                }[trade.status] ||
                                "bg-gray-500/20 text-gray-500"
                              }`}
                            >
                              {trade.status.charAt(0).toUpperCase() +
                                trade.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {trade.duration_minutes
                              ? `${trade.duration_minutes} min`
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

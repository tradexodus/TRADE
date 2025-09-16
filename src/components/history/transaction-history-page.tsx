import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
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
  ExternalLink,
  Activity,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="text-center text-red-700">{error}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading transaction history...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Transaction History</h1>
              <p className="text-sm text-muted-foreground">View all your account activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{trades.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trading</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-6">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No transactions yet</p>
                    <p className="text-sm">Your deposits and withdrawals will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {transactions.map((transaction, index) => (
                      <div key={`${transaction.type}-${transaction.id}`}>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type === "deposit" 
                                ? "bg-green-100 text-green-600" 
                                : "bg-blue-100 text-blue-600"
                            }`}>
                              {transaction.type === "deposit" ? (
                                <ArrowDownToLine className="h-4 w-4" />
                              ) : (
                                <ArrowUpFromLine className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium capitalize">
                                {transaction.type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === "deposit" ? "text-green-600" : "text-blue-600"
                            }`}>
                              {transaction.type === "deposit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                            </p>
                            <Badge
                              variant={
                                transaction.status === "completed" ? "default" :
                                transaction.status === "pending" ? "secondary" : "destructive"
                              }
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                        {index < transactions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            {trades.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No trades yet</p>
                    <p className="text-sm">Your trading history will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trading History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {trades.map((trade, index) => (
                      <div key={trade.id}>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{trade.crypto_pair}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="capitalize">{trade.trade_type}</span>
                                <span>•</span>
                                <span>${trade.amount.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(trade.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              trade.profit_loss >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss.toFixed(2)}
                            </p>
                            <Badge
                              variant={
                                trade.status === "profit" ? "default" :
                                trade.status === "loss" ? "destructive" :
                                trade.status === "active" ? "secondary" : "outline"
                              }
                              className="text-xs"
                            >
                              {trade.status}
                            </Badge>
                          </div>
                        </div>
                        {index < trades.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-4">
          <Separator />
          <div className="text-sm text-muted-foreground flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              to="/terms"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Terms of Service</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/privacy"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/legal"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Legal Notice</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            All transaction data is securely stored and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
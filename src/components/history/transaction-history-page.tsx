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
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeft } from "lucide-react";

type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  created_at: string;
  status: string;
  wallet_address?: string;
  screenshot_url?: string;
};

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view transaction history");
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

        // Combine and format transactions
        const formattedDeposits = deposits.map((deposit) => ({
          ...deposit,
          type: "deposit" as const,
        }));

        const formattedWithdrawals = withdrawals.map((withdrawal) => ({
          ...withdrawal,
          type: "withdrawal" as const,
        }));

        // Combine and sort by date (newest first)
        const allTransactions = [
          ...formattedDeposits,
          ...formattedWithdrawals,
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transaction history");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load transaction history",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Transaction History</h1>
      </div>

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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={`${transaction.type}-${transaction.id}`}>
                    <TableCell>
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
                    <TableCell>
                      <span
                        className={`font-medium ${transaction.type === "deposit" ? "text-green-500" : "text-blue-500"}`}
                      >
                        {transaction.type === "deposit" ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

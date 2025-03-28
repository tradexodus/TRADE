import { useState, useEffect } from "react";
import WithdrawalPasswordDialog from "./withdrawal-password-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState<{
    balance: number;
    profit: number;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawalType, setWithdrawalType] = useState<"balance" | "profit">(
    "balance",
  );

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const { data } = await supabase
          .from("user_accounts")
          .select("balance, profit")
          .eq("id", user.id)
          .single();

        if (data) {
          setAccountData(data);
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
      }
    }

    fetchAccountData();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowPasswordDialog(true);
  }

  async function processWithdrawal() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's current balance and profit
      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", user.id)
        .single();

      if (!accountData) throw new Error("Account not found");

      const withdrawalAmount = parseFloat(amount);
      let fromProfit = 0;
      let fromBalance = 0;

      // Determine withdrawal source based on selected type
      if (withdrawalType === "profit") {
        // Check if there's enough profit
        if (withdrawalAmount > (accountData.profit || 0)) {
          throw new Error("Insufficient profit balance");
        }
        fromProfit = withdrawalAmount;
      } else {
        // Check if there's enough balance
        if (withdrawalAmount > (accountData.balance || 0)) {
          throw new Error("Insufficient balance");
        }
        fromBalance = withdrawalAmount;
      }

      // Create withdrawal record
      const { error } = await supabase.from("withdrawals").insert([
        {
          user_id: user.id,
          amount: withdrawalAmount,
          wallet_address: walletAddress,
          status: "pending",
          from_profit: fromProfit,
          from_balance: fromBalance,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Withdrawal request submitted",
        description:
          "Your withdrawal request is being processed. Funds will be deducted once approved.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit withdrawal request.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Withdraw USDT</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center">
              <div>
                <p className="text-sm text-muted-foreground text-center">
                  Balance
                </p>
                <p className="text-2xl font-bold">
                  {accountData ? accountData.balance.toFixed(2) : "--"} USDT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center">
              <div>
                <p className="text-sm text-muted-foreground text-center">
                  Profit
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {accountData ? accountData.profit.toFixed(2) : "--"} USDT
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              defaultValue="balance"
              className="w-full"
              onValueChange={(value) =>
                setWithdrawalType(value as "balance" | "profit")
              }
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="balance"
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  <span>From Balance</span>
                </TabsTrigger>
                <TabsTrigger value="profit" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>From Profit</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="balance">
                <p className="text-sm text-muted-foreground mb-4">
                  Withdraw from your main balance. Available:{" "}
                  {accountData ? accountData.balance.toFixed(2) : "--"} USDT
                </p>
              </TabsContent>

              <TabsContent value="profit">
                <p className="text-sm text-muted-foreground mb-4">
                  Withdraw from your accumulated profits. Available:{" "}
                  {accountData ? accountData.profit.toFixed(2) : "--"} USDT
                </p>
              </TabsContent>
            </Tabs>
            <div className="space-y-2">
              <Label>Amount (USDT)</Label>
              <Input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Wallet Address (TRC20)</Label>
              <Input
                required
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Make sure to enter the correct wallet address</li>
              <li>Withdrawals are processed within 24 hours</li>
              <li>Minimum withdrawal amount is 1 USDT</li>
              <li>Only TRC20 network is supported</li>
            </ul>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : "Confirm Withdrawal"}
        </Button>
      </form>

      <WithdrawalPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirm={processWithdrawal}
      />
    </div>
  );
}

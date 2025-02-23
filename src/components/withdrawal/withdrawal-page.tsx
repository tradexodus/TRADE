import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's current balance
      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (!accountData) throw new Error("Account not found");

      const withdrawalAmount = parseFloat(amount);
      if (withdrawalAmount > accountData.balance) {
        throw new Error("Insufficient balance");
      }

      const { error } = await supabase.from("withdrawals").insert([
        {
          user_id: user.id,
          amount: withdrawalAmount,
          wallet_address: walletAddress,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request is being processed.",
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
    </div>
  );
}

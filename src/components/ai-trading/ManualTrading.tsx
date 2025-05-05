import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const CRYPTO_PAIRS = [
  "BTC/USD",
  "ETH/USD",
  "BNB/USD",
  "XRP/USD",
  "ADA/USD",
  "SOL/USD",
  "DOT/USD",
  "DOGE/USD",
];

const DURATIONS = [
  { value: "1", label: "1 Minute" },
  { value: "5", label: "5 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "60", label: "1 Hour" },
];

interface ManualTradingProps {
  onTradeComplete?: () => void;
  balance?: number;
}

export default function ManualTrading({
  onTradeComplete,
  balance = 0,
}: ManualTradingProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoPair, setCryptoPair] = useState("BTC/USD");
  const [tradeType, setTradeType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("5");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const handleTrade = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (parseFloat(amount) > balance) {
        toast({
          title: "Insufficient balance",
          description: "You don't have enough balance for this trade",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in to execute trades",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get the user's current balance
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (accountError || !accountData) {
        toast({
          title: "Error",
          description: "Could not retrieve account information",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const tradeAmount = parseFloat(amount);
      const currentBalance = accountData.balance || 0;

      // Calculate expiration time
      const now = new Date();
      const expirationTime = new Date(
        now.getTime() + parseInt(duration) * 60 * 1000,
      );

      // Create a new trade record
      const { error: tradeError } = await supabase
        .from("trading_history")
        .insert({
          user_id: user.id,
          crypto_pair: cryptoPair,
          trade_type: tradeType,
          amount: tradeAmount,
          status: "pending",
          duration_minutes: duration,
          expiration_time: expirationTime.toISOString(),
          original_balance: currentBalance,
        });

      if (tradeError) {
        toast({
          title: "Error",
          description: "Failed to create trade",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update user's balance
      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({ balance: currentBalance - tradeAmount })
        .eq("id", user.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to update balance",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Trade executed",
        description: `Your ${tradeType} trade for ${amount} on ${cryptoPair} has been placed`,
      });

      // Reset form
      setAmount("");

      // Notify parent component
      if (onTradeComplete) {
        onTradeComplete();
      }
    } catch (error) {
      console.error("Trade error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Trading</CardTitle>
        <CardDescription>
          Execute trades manually with your preferred settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crypto-pair">Crypto Pair</Label>
            <Select value={cryptoPair} onValueChange={setCryptoPair}>
              <SelectTrigger id="crypto-pair">
                <SelectValue placeholder="Select crypto pair" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_PAIRS.map((pair) => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trade Type</Label>
            <RadioGroup
              value={tradeType}
              onValueChange={setTradeType}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy" className="font-normal text-green-600">
                  Buy / Long
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell" className="font-normal text-red-600">
                  Sell / Short
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
            />
            {balance > 0 && (
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Available: ${balance.toFixed(2)}</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setAmount(balance.toString())}
                >
                  Max
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full mt-4"
            onClick={handleTrade}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading
              ? "Processing..."
              : `Execute ${tradeType.toUpperCase()} Trade`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import AdvancedTradingOptions from "./AdvancedTradingOptions";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

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

interface ManualTradingProps {
  onTradeComplete?: () => void;
  balance?: number;
}

interface ActiveTrade {
  id: string;
  crypto_pair: string;
  trade_type: string;
  amount: number;
  entry_price: number;
  current_price: number;
  profit_loss: number;
  created_at: string;
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
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [isClosingTrade, setIsClosingTrade] = useState<string | null>(null);

  // Fetch active trades on component mount
  useEffect(() => {
    fetchActiveTrades();
    // Set up interval to update current prices (simulated)
    const interval = setInterval(() => {
      updateTradePrices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveTrades = async () => {
    try {
      // First check if we have stored trades in localStorage
      const storedTradesStr = localStorage.getItem("activeTrades");
      let storedTrades: ActiveTrade[] = [];

      if (storedTradesStr) {
        try {
          storedTrades = JSON.parse(storedTradesStr);
          // If we have stored trades, use them immediately
          if (storedTrades.length > 0) {
            setActiveTrades(
              storedTrades.map((trade) => ({
                ...trade,
                current_price: getSimulatedPrice(
                  trade.crypto_pair,
                  trade.trade_type,
                ),
                profit_loss: calculateProfitLoss({
                  ...trade,
                  current_price: getSimulatedPrice(
                    trade.crypto_pair,
                    trade.trade_type,
                  ),
                }),
              })),
            );
          }
        } catch (e) {
          console.error("Error parsing stored trades:", e);
        }
      }

      // Then fetch from database to ensure we have the latest data
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("trading_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // For each trade, try to find a matching stored trade to preserve price history
        const updatedTrades = data.map((trade) => {
          const storedTrade = storedTrades.find((st) => st.id === trade.id);

          return {
            ...trade,
            entry_price:
              storedTrade?.entry_price || getSimulatedPrice(trade.crypto_pair),
            current_price: getSimulatedPrice(
              trade.crypto_pair,
              trade.trade_type,
            ),
            profit_loss: calculateProfitLoss({
              ...trade,
              entry_price:
                storedTrade?.entry_price ||
                getSimulatedPrice(trade.crypto_pair),
              current_price: getSimulatedPrice(
                trade.crypto_pair,
                trade.trade_type,
              ),
            }),
          };
        });

        setActiveTrades(updatedTrades);
        localStorage.setItem("activeTrades", JSON.stringify(updatedTrades));
      }
    } catch (error) {
      console.error("Error fetching active trades:", error);
    }
  };

  // Simulate price updates
  const updateTradePrices = () => {
    setActiveTrades((prev) => {
      const updatedTrades = prev.map((trade) => {
        // Skew prices to increase probability of losses
        const newPrice = getSimulatedPrice(trade.crypto_pair, trade.trade_type);
        const profitLoss = calculateProfitLoss({
          ...trade,
          current_price: newPrice,
        });

        return {
          ...trade,
          current_price: newPrice,
          profit_loss: profitLoss,
        };
      });

      // Store active trades in localStorage for persistence
      localStorage.setItem("activeTrades", JSON.stringify(updatedTrades));

      return updatedTrades;
    });
  };

  const getSimulatedPrice = (pair: string, tradeType?: string) => {
    // Try to get stored prices from localStorage
    const storedPricesStr = localStorage.getItem("simulatedPrices");
    let storedPrices: Record<string, number> = {};

    if (storedPricesStr) {
      try {
        storedPrices = JSON.parse(storedPricesStr);
      } catch (e) {
        console.error("Error parsing stored prices:", e);
      }
    }

    // Base prices
    const basePrices: Record<string, number> = {
      "BTC/USD": 50000,
      "ETH/USD": 3000,
      "BNB/USD": 400,
      "XRP/USD": 0.5,
      "ADA/USD": 0.4,
      "SOL/USD": 100,
      "DOT/USD": 15,
      "DOGE/USD": 0.1,
    };

    // Use stored price if available, otherwise use base price
    const basePrice = storedPrices[pair] || basePrices[pair] || 1000;

    // Skew the price movement to increase probability of losses
    // If trade type is provided, skew against the position (70% chance of moving against the position)
    let fluctuationBias = 0;
    if (tradeType) {
      // For buy positions, we want prices to go down more often
      // For sell positions, we want prices to go up more often
      const lossDirection = tradeType === "buy" ? -1 : 1;

      // 70% chance of price moving against the position
      if (Math.random() < 0.7) {
        fluctuationBias = lossDirection * 0.015; // Bias towards loss direction
      }
    }

    // Add random fluctuation with bias (±2% base + bias)
    const randomComponent = Math.random() * 0.04 - 0.02;
    const fluctuation = basePrice * (randomComponent + fluctuationBias);
    const newPrice = basePrice + fluctuation;

    // Update stored prices
    storedPrices[pair] = newPrice;
    localStorage.setItem("simulatedPrices", JSON.stringify(storedPrices));

    return newPrice;
  };

  const calculateProfitLoss = (trade: any) => {
    if (!trade.entry_price || !trade.current_price) return 0;

    const priceDiff = trade.current_price - trade.entry_price;
    const multiplier = trade.trade_type === "buy" ? 1 : -1;

    // Calculate base profit/loss
    let profitLoss =
      (priceDiff * multiplier * trade.amount) / trade.entry_price;

    // Apply a slight negative bias to the profit calculation (5% reduction)
    profitLoss *= 0.95;

    return profitLoss;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const handleOpenTrade = async () => {
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
      const entryPrice = getSimulatedPrice(cryptoPair);

      // Create a new trade record
      const { data: newTrade, error: tradeError } = await supabase
        .from("trading_history")
        .insert({
          user_id: user.id,
          crypto_pair: cryptoPair,
          trade_type: tradeType,
          amount: tradeAmount,
          status: "active",
          entry_price: entryPrice,
          original_balance: currentBalance,
          created_at: new Date().toISOString(),
          duration_minutes: null,
        })
        .select()
        .single();

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
        title: "Trade opened",
        description: `Your ${tradeType} position for ${amount} on ${cryptoPair} has been opened`,
      });

      // Add the new trade to active trades
      if (newTrade) {
        setActiveTrades((prev) => [
          {
            ...newTrade,
            entry_price: entryPrice,
            current_price: entryPrice,
            profit_loss: 0,
          },
          ...prev,
        ]);
      }

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

  const handleCloseTrade = async (tradeId: string) => {
    try {
      setIsClosingTrade(tradeId);

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in to close this trade",
          variant: "destructive",
        });
        return;
      }

      // Find the trade to close
      const tradeToClose = activeTrades.find((t) => t.id === tradeId);

      if (!tradeToClose) {
        toast({
          title: "Error",
          description: "Trade not found",
          variant: "destructive",
        });
        return;
      }

      // Get current account balance
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", user.id)
        .single();

      if (accountError || !accountData) {
        toast({
          title: "Error",
          description: "Could not retrieve account information",
          variant: "destructive",
        });
        return;
      }

      // Calculate profit/loss
      const profitLoss = tradeToClose.profit_loss;

      // Update the trade status
      const { error: updateTradeError } = await supabase
        .from("trading_history")
        .update({
          status: "closed",
          close_price: tradeToClose.current_price,
          profit_loss: profitLoss,
          closed_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (updateTradeError) {
        toast({
          title: "Error",
          description: "Failed to close trade",
          variant: "destructive",
        });
        return;
      }

      // Update user's balance and profit
      // Return the original trade amount to balance
      // If profit is positive, add to profit
      // If loss, deduct from balance after returning the amount used
      let newBalance = accountData.balance + tradeToClose.amount;
      let newProfit = accountData.profit || 0;

      if (profitLoss >= 0) {
        // In case of profit, add to profit
        newProfit += profitLoss;
      } else {
        // In case of loss, deduct from balance
        newBalance += profitLoss; // profitLoss is negative, so this is a subtraction
      }

      const { error: updateBalanceError } = await supabase
        .from("user_accounts")
        .update({
          balance: newBalance,
          profit: newProfit,
        })
        .eq("id", user.id);

      if (updateBalanceError) {
        toast({
          title: "Error",
          description: "Failed to update account balance",
          variant: "destructive",
        });
        return;
      }

      // Remove trade from active trades
      setActiveTrades((prev) => {
        const updatedTrades = prev.filter((t) => t.id !== tradeId);
        // Update localStorage after removing the closed trade
        localStorage.setItem("activeTrades", JSON.stringify(updatedTrades));
        return updatedTrades;
      });

      toast({
        title: "Trade closed",
        description: `Your ${tradeToClose.trade_type} position on ${tradeToClose.crypto_pair} has been closed with ${profitLoss >= 0 ? "profit" : "loss"} of ${Math.abs(profitLoss).toFixed(2)}`,
        variant: profitLoss >= 0 ? "default" : "destructive",
      });

      // Notify parent component
      if (onTradeComplete) {
        onTradeComplete();
      }
    } catch (error) {
      console.error("Error closing trade:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while closing the trade",
        variant: "destructive",
      });
    } finally {
      setIsClosingTrade(null);
    }
  };

  return (
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

      <div className="mt-4 space-y-4">
        <AdvancedTradingOptions
          disabled={isLoading}
          currentPrice={
            cryptoPair.startsWith("BTC")
              ? 50000
              : cryptoPair.startsWith("ETH")
                ? 3000
                : 1000
          }
        />

        <Button
          className="w-full"
          onClick={handleOpenTrade}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
        >
          {isLoading
            ? "Processing..."
            : `Open ${tradeType.toUpperCase()} Position`}
        </Button>
      </div>

      {activeTrades.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Active Positions</h3>
          <div className="space-y-3">
            {activeTrades.map((trade) => (
              <div key={trade.id} className="border rounded-lg p-3 bg-card">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Badge
                      variant={
                        trade.trade_type === "buy" ? "success" : "destructive"
                      }
                      className="mr-2"
                    >
                      {trade.trade_type === "buy" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trade.trade_type.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{trade.crypto_pair}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(trade.created_at).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <div className="text-muted-foreground">Amount</div>
                    <div>${trade.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entry Price</div>
                    <div>${trade.entry_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Current Price</div>
                    <div>${trade.current_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">P/L</div>
                    <div
                      className={
                        trade.profit_loss >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      ${trade.profit_loss.toFixed(2)}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCloseTrade(trade.id)}
                  disabled={isClosingTrade === trade.id}
                >
                  {isClosingTrade === trade.id
                    ? "Closing..."
                    : "Close Position"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

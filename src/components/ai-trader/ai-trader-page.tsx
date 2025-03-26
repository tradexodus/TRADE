import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpDown,
  BrainCircuit,
  TrendingUp,
  Clock,
  History,
  Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, formatDistance } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserAccount = {
  account_id: number;
  balance: number;
  profit: number;
};

type TradingSettings = {
  win_probability: number;
  max_profit_percentage: number;
  min_profit_percentage: number;
  max_loss_percentage: number;
};

type TradeHistory = {
  id: string;
  crypto_pair: string;
  trade_type: string;
  amount: number;
  profit_loss: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  duration_minutes: string | null;
};

export default function AITraderPage() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [cryptoPair, setCryptoPair] = useState("BTC/USDT");
  const [tradeType, setTradeType] = useState("buy");
  const [tradeDuration, setTradeDuration] = useState("60");
  const [isTrading, setIsTrading] = useState(false);
  const [autoTradeActive, setAutoTradeActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    win_probability: 0.7,
    max_profit_percentage: 15,
    min_profit_percentage: 5,
    max_loss_percentage: 5,
  });
  const [tradeResult, setTradeResult] = useState<{
    success: boolean;
    profit?: number;
    message: string;
  } | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccountData();
    fetchTradingSettings();
    fetchTradeHistory();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining > 0 && autoTradeActive) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            executeAutoTrade();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = timer as unknown as number;

      return () => clearInterval(timer);
    }
  }, [timeRemaining, autoTradeActive]);

  async function fetchAccountData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      if (accountData) {
        setAccount(accountData);
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTradingSettings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // First check if user has settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("trading_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching trading settings:", settingsError);
        return;
      }

      if (settingsData) {
        setTradingSettings({
          win_probability: settingsData.win_probability,
          max_profit_percentage: settingsData.max_profit_percentage,
          min_profit_percentage: settingsData.min_profit_percentage,
          max_loss_percentage: settingsData.max_loss_percentage,
        });
      } else {
        // Create default settings for user
        const { error: insertError } = await supabase
          .from("trading_settings")
          .insert({
            user_id: user.id,
            win_probability: 0.7,
            max_profit_percentage: 15,
            min_profit_percentage: 5,
            max_loss_percentage: 5,
          });

        if (insertError) {
          console.error(
            "Error creating default trading settings:",
            insertError,
          );
        }
      }
    } catch (error) {
      console.error("Error in trading settings:", error);
    }
  }

  async function fetchTradeHistory() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("trading_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trade history:", error);
        return;
      }

      if (data) {
        setTradeHistory(data);
      }
    } catch (error) {
      console.error("Error fetching trade history:", error);
    }
  }

  // This function has been moved to the AuthLayout component to run globally

  async function handleTrade() {
    if (!account) return;

    const tradeAmount = parseFloat(amount);

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (tradeAmount > account.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You don't have enough balance for this trade",
      });
      return;
    }

    setIsTrading(true);
    setTradeResult(null);

    try {
      // Simulate AI trading with random outcome
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // Use user's trading settings to determine outcome
      const isWin = Math.random() < tradingSettings.win_probability;

      // Calculate profit or loss based on settings
      let profitPercentage;
      if (isWin) {
        // Generate profit between min and max profit percentage
        profitPercentage =
          Math.random() *
            (tradingSettings.max_profit_percentage -
              tradingSettings.min_profit_percentage) +
          tradingSettings.min_profit_percentage;
      } else {
        // Generate loss up to max loss percentage (negative value)
        profitPercentage =
          -1 * (Math.random() * tradingSettings.max_loss_percentage);
      }

      const profitAmount = (tradeAmount * profitPercentage) / 100;
      const roundedProfit = Math.round(profitAmount * 100) / 100;

      // Calculate new balance and profit values
      // Only decrease balance for losses, don't add profits to balance
      const newBalance =
        roundedProfit < 0 ? account.balance + roundedProfit : account.balance;
      // Only accumulate positive profits, ignore losses
      const newProfit =
        roundedProfit > 0
          ? (account.profit || 0) + roundedProfit
          : account.profit || 0;

      const now = new Date();
      const tradeData = {
        user_id: user.id,
        crypto_pair: cryptoPair,
        trade_type: tradeType,
        amount: tradeAmount,
        profit_loss: roundedProfit,
        status: roundedProfit > 0 ? "profit" : "loss",
        created_at: now.toISOString(),
        closed_at: now.toISOString(),
      };

      // Create a record of the trade in both tables
      try {
        // Insert into trades table
        const { error: tradeError } = await supabase
          .from("trades")
          .insert(tradeData);

        if (tradeError) {
          console.error("Error creating trade record:", tradeError);
          // Continue execution even if trade record creation fails
        }

        // Insert into trading_history table
        const { error: historyError } = await supabase
          .from("trading_history")
          .insert({
            ...tradeData,
            duration_minutes: "0", // Instant trade
          });

        if (historyError) {
          console.error("Error creating trade history record:", historyError);
          // Continue execution even if history record creation fails
        }
      } catch (insertError) {
        console.error("Failed to insert trade records:", insertError);
        // Continue execution even if trade record creation fails
      }

      // Update account balance and profit in database
      const { error } = await supabase
        .from("user_accounts")
        .update({
          balance: newBalance,
          profit: newProfit,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh account data and trade history
      fetchAccountData();
      fetchTradeHistory();

      // Set trade result
      setTradeResult({
        success: roundedProfit > 0,
        profit: roundedProfit,
        message:
          roundedProfit > 0
            ? `Trade successful! You made a profit of ${roundedProfit.toFixed(2)}`
            : `Trade completed with a loss of ${Math.abs(roundedProfit).toFixed(2)}`,
      });

      toast({
        title: roundedProfit > 0 ? "Trade Successful" : "Trade Completed",
        description:
          roundedProfit > 0
            ? `You made a profit of ${roundedProfit.toFixed(2)}`
            : `You had a loss of ${Math.abs(roundedProfit).toFixed(2)}`,
        variant: roundedProfit > 0 ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Trade error:", error);
      toast({
        variant: "destructive",
        title: "Trade failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsTrading(false);
      setAmount("");
    }
  }

  function startAutoTrading() {
    if (!account) return;

    const tradeAmount = parseFloat(amount);

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (tradeAmount > account.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You don't have enough balance for this trade",
      });
      return;
    }

    // Set timer based on selected duration
    const durationInSeconds = parseInt(tradeDuration) * 60;
    setTimeRemaining(durationInSeconds);
    setAutoTradeActive(true);
    setTradeResult(null);

    toast({
      title: "Auto Trading Started",
      description: `Trading will complete in ${formatDuration(durationInSeconds)}`,
    });

    // Create a pending trade record
    createPendingTrade(tradeAmount);
  }

  async function createPendingTrade(tradeAmount: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const now = new Date();

      // Insert into trading_history table as pending
      const { error: historyError, data: newTrade } = await supabase
        .from("trading_history")
        .insert({
          user_id: user.id,
          crypto_pair: cryptoPair,
          trade_type: tradeType,
          amount: tradeAmount,
          profit_loss: null,
          status: "pending",
          created_at: now.toISOString(),
          closed_at: null,
          duration_minutes: tradeDuration,
        })
        .select()
        .single();

      if (historyError) {
        console.error("Error creating pending trade record:", historyError);
      } else {
        // Instead of using setTimeout which won't work if the page is closed,
        // we'll rely on the checkPendingTrades function that runs periodically
        // This ensures trades are processed even if the user closes the browser
        console.log(
          `Trade ${newTrade.id} scheduled to complete in ${tradeDuration} minutes`,
        );

        // Refresh trade history to show the pending trade
        fetchTradeHistory();
      }
    } catch (error) {
      console.error("Error creating pending trade:", error);
    }
  }

  async function executeAutoTrade() {
    if (!account || !autoTradeActive) return;

    setIsTrading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const tradeAmount = parseFloat(amount);
      const now = new Date();

      // Find the pending trade
      const { data: pendingTrades } = await supabase
        .from("trading_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingTrades && pendingTrades.length > 0) {
        const pendingTrade = pendingTrades[0];

        // Process the trade directly instead of using the edge function
        try {
          // Get user's trading settings
          const { data: settingsData, error: settingsError } = await supabase
            .from("trading_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (settingsError)
            throw new Error("Failed to fetch trading settings");

          // Use user's trading settings to determine outcome
          const isWin = Math.random() < settingsData.win_probability;

          // Calculate profit or loss based on settings
          let profitPercentage;
          if (isWin) {
            // Generate profit between min and max profit percentage
            profitPercentage =
              Math.random() *
                (settingsData.max_profit_percentage -
                  settingsData.min_profit_percentage) +
              settingsData.min_profit_percentage;
          } else {
            // Generate loss up to max loss percentage (negative value)
            profitPercentage =
              -1 * (Math.random() * settingsData.max_loss_percentage);
          }

          const profitAmount = (pendingTrade.amount * profitPercentage) / 100;
          const roundedProfit = Math.round(profitAmount * 100) / 100;

          // Update the trade record
          const { error: updateError } = await supabase
            .from("trading_history")
            .update({
              profit_loss: roundedProfit,
              status: roundedProfit > 0 ? "profit" : "loss",
              closed_at: now.toISOString(),
            })
            .eq("id", pendingTrade.id);

          if (updateError)
            throw new Error(`Failed to update trade: ${updateError.message}`);

          // Create a record in trades table
          const { error: tradeInsertError } = await supabase
            .from("trades")
            .insert({
              user_id: user.id,
              crypto_pair: pendingTrade.crypto_pair,
              trade_type: pendingTrade.trade_type,
              amount: pendingTrade.amount,
              profit_loss: roundedProfit,
              status: roundedProfit > 0 ? "profit" : "loss",
              created_at: pendingTrade.created_at,
              closed_at: now.toISOString(),
            });

          if (tradeInsertError) {
            console.error("Error creating trade record:", tradeInsertError);
          }

          // Get user's account data
          const { data: accountData, error: accountError } = await supabase
            .from("user_accounts")
            .select("*")
            .eq("id", user.id)
            .single();

          if (accountError) throw new Error("Failed to fetch account data");

          // Calculate new balance and profit values
          const newBalance =
            roundedProfit < 0
              ? accountData.balance + roundedProfit
              : accountData.balance;
          const newProfit =
            roundedProfit > 0
              ? (accountData.profit || 0) + roundedProfit
              : accountData.profit || 0;

          // Update account balance and profit
          const { error: accountUpdateError } = await supabase
            .from("user_accounts")
            .update({
              balance: newBalance,
              profit: newProfit,
            })
            .eq("id", user.id);

          if (accountUpdateError)
            throw new Error(
              `Failed to update account: ${accountUpdateError.message}`,
            );

          // Refresh account data and trade history
          await fetchAccountData();
          await fetchTradeHistory();

          // Set trade result based on the processed trade
          setTradeResult({
            success: roundedProfit > 0,
            profit: roundedProfit,
            message:
              roundedProfit > 0
                ? `Auto trade completed! You made a profit of ${roundedProfit.toFixed(2)}`
                : `Auto trade completed with a loss of ${Math.abs(roundedProfit).toFixed(2)}`,
          });

          toast({
            title: "Auto Trade Completed",
            description:
              roundedProfit > 0
                ? `You made a profit of ${roundedProfit.toFixed(2)}`
                : `You had a loss of ${Math.abs(roundedProfit).toFixed(2)}`,
            variant: roundedProfit > 0 ? "default" : "destructive",
          });
        } catch (processError: any) {
          throw new Error(`Failed to process trade: ${processError.message}`);
        }
      } else {
        throw new Error("No pending trade found");
      }
    } catch (error: any) {
      console.error("Auto trade error:", error);
      toast({
        variant: "destructive",
        title: "Auto trade failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsTrading(false);
      setAutoTradeActive(false);
      setAmount("");
    }
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (minutes === 1) {
      return remainingSeconds > 0
        ? `1 minute ${remainingSeconds} seconds`
        : "1 minute";
    } else {
      return remainingSeconds > 0
        ? `${minutes} minutes ${remainingSeconds} seconds`
        : `${minutes} minutes`;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "profit":
        return "text-green-500";
      case "loss":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Trader</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* TradingView Widget */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <span>Live Chart</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              <div className="h-full flex items-center justify-center bg-gray-800 rounded-md">
                <div className="text-center p-6">
                  <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    Live Chart
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Trading pair: {cryptoPair}
                  </p>
                  <p className="text-sm text-gray-500">
                    Chart visualization is currently simplified for performance
                    reasons.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Overview */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-blue-400" />
                <span>Crypto Market Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px] overflow-auto">
              <div className="w-full h-full p-4 bg-gray-800 rounded-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                        ₿
                      </div>
                      <div>
                        <div className="font-medium">Bitcoin</div>
                        <div className="text-sm text-gray-400">BTC</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$63,245.82</div>
                      <div className="text-sm text-green-500">+2.4%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        Ξ
                      </div>
                      <div>
                        <div className="font-medium">Ethereum</div>
                        <div className="text-sm text-gray-400">ETH</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$3,452.17</div>
                      <div className="text-sm text-green-500">+1.8%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        S
                      </div>
                      <div>
                        <div className="font-medium">Solana</div>
                        <div className="text-sm text-gray-400">SOL</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$142.89</div>
                      <div className="text-sm text-red-500">-0.7%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                        B
                      </div>
                      <div>
                        <div className="font-medium">Binance Coin</div>
                        <div className="text-sm text-gray-400">BNB</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$567.32</div>
                      <div className="text-sm text-green-500">+0.9%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                        X
                      </div>
                      <div>
                        <div className="font-medium">Ripple</div>
                        <div className="text-sm text-gray-400">XRP</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$0.5423</div>
                      <div className="text-sm text-red-500">-1.2%</div>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-gray-500">
                    Market data updated: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <span>Account Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Balance
                  </p>
                  <p className="text-2xl font-mono mt-1 text-blue-400">
                    $
                    {loading
                      ? "Loading..."
                      : (account?.balance || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Winnings
                  </p>
                  <p className="text-2xl font-mono mt-1 text-green-500">
                    $
                    {loading
                      ? "Loading..."
                      : "+" + (account?.profit || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Settings */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                <span>Trading Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Win Probability (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tradingSettings.win_probability * 100}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        setTradingSettings((prev) => ({
                          ...prev,
                          win_probability: value / 100,
                        }));
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Profit Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tradingSettings.min_profit_percentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setTradingSettings((prev) => ({
                          ...prev,
                          min_profit_percentage: value,
                        }));
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Profit Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tradingSettings.max_profit_percentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setTradingSettings((prev) => ({
                          ...prev,
                          max_profit_percentage: value,
                        }));
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Loss Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tradingSettings.max_loss_percentage}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setTradingSettings((prev) => ({
                          ...prev,
                          max_loss_percentage: value,
                        }));
                      }
                    }}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      if (!user) return;

                      const { error } = await supabase
                        .from("trading_settings")
                        .update({
                          win_probability: tradingSettings.win_probability,
                          min_profit_percentage:
                            tradingSettings.min_profit_percentage,
                          max_profit_percentage:
                            tradingSettings.max_profit_percentage,
                          max_loss_percentage:
                            tradingSettings.max_loss_percentage,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("user_id", user.id);

                      if (error) {
                        console.error("Error updating settings:", error);
                        toast({
                          variant: "destructive",
                          title: "Settings Update Failed",
                          description: "Failed to update trading settings",
                        });
                      } else {
                        toast({
                          title: "Settings Updated",
                          description:
                            "Your trading settings have been updated",
                        });
                      }
                    } catch (error) {
                      console.error("Settings update error:", error);
                    }
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trading History */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-400" />
                <span>Trading History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                {tradeHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No trading history yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tradeHistory.map((trade) => (
                      <div
                        key={trade.id}
                        className="border rounded-md p-3 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{trade.crypto_pair}</div>
                          <div
                            className={`font-medium ${getStatusColor(trade.status)}`}
                          >
                            {trade.status === "pending"
                              ? "PENDING"
                              : trade.profit_loss && trade.profit_loss > 0
                                ? "PROFIT"
                                : "LOSS"}
                          </div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <div className="text-muted-foreground">
                            {trade.trade_type.toUpperCase()} $
                            {trade.amount.toFixed(2)}
                          </div>
                          <div
                            className={
                              trade.status === "pending"
                                ? "text-yellow-500"
                                : trade.profit_loss && trade.profit_loss > 0
                                  ? "text-green-500"
                                  : "text-red-500"
                            }
                          >
                            {trade.status === "pending"
                              ? "In Progress"
                              : trade.profit_loss
                                ? (trade.profit_loss > 0 ? "+" : "") +
                                  trade.profit_loss.toFixed(2)
                                : ""}
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <div>
                            Started:{" "}
                            {format(
                              new Date(trade.created_at),
                              "MMM dd, HH:mm:ss",
                            )}
                          </div>
                          {trade.closed_at ? (
                            <div>
                              Completed:{" "}
                              {format(
                                new Date(trade.closed_at),
                                "MMM dd, HH:mm:ss",
                              )}
                            </div>
                          ) : (
                            <div>Duration: {trade.duration_minutes} min</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Trading Interface */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-400" />
                <span>AI Trading</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="manual" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="auto">Auto</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Crypto Pair</Label>
                    <Select value={cryptoPair} onValueChange={setCryptoPair}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crypto pair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                        <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                        <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                        <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                        <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Trade Type</Label>
                    <Select value={tradeType} onValueChange={setTradeType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trade type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleTrade}
                    disabled={isTrading || loading || !amount}
                  >
                    {isTrading ? "Processing..." : "Execute Trade"}
                  </Button>

                  {tradeResult && (
                    <div
                      className={`p-3 rounded-md mt-4 ${tradeResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                    >
                      {tradeResult.message}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="auto" className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Trading Amount (USDT)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={autoTradeActive}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Duration</Label>
                    <Select
                      value={tradeDuration}
                      onValueChange={setTradeDuration}
                      disabled={autoTradeActive}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trading duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                        <SelectItem value="360">6 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select defaultValue="medium" disabled={autoTradeActive}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {autoTradeActive && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 rounded-md">
                      <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                      <span>
                        Trading in progress: {formatDuration(timeRemaining)}
                      </span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={
                      autoTradeActive
                        ? () => {
                            if (timerRef.current) {
                              clearInterval(timerRef.current);
                            }
                            setAutoTradeActive(false);
                            setTimeRemaining(0);
                            toast({
                              title: "Auto Trading Cancelled",
                              description: "Auto trading has been cancelled",
                            });
                          }
                        : startAutoTrading
                    }
                    disabled={
                      (!autoTradeActive && (loading || !amount)) || isTrading
                    }
                    variant={autoTradeActive ? "destructive" : "default"}
                  >
                    {isTrading
                      ? "Processing..."
                      : autoTradeActive
                        ? "Cancel Auto Trading"
                        : "Start AI Trading"}
                  </Button>

                  {tradeResult && (
                    <div
                      className={`p-3 rounded-md mt-4 ${tradeResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                    >
                      {tradeResult.message}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

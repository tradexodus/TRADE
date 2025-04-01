import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpDown,
  BrainCircuit,
  TrendingUp,
  Clock,
  History,
  Settings,
} from "lucide-react";
import {
  MobileAiMarketAnalysis,
  DesktopAiMarketAnalysis,
} from "./AiMarketAnalysisSection";
import { useAiMarketAnalysis } from "@/hooks/useAiMarketAnalysis";
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
  expiration_time?: string | null;
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
    // Add a global flag to prevent multiple simultaneous trade processing
    window.isProcessingTrade = false;

    fetchAccountData();
    fetchTradingSettings();
    fetchTradeHistory();

    // Listen for trade processing events from AuthenticatedLayout
    const handleTradesProcessed = (event: CustomEvent) => {
      console.log(
        `${event.detail.count} trades were processed, refreshing data`,
      );
      fetchAccountData();
      fetchTradeHistory();
    };

    window.addEventListener(
      "tradesProcessed",
      handleTradesProcessed as EventListener,
    );

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener(
        "tradesProcessed",
        handleTradesProcessed as EventListener,
      );
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

      // Get the account data
      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!accountData) return;

      // Set account data - we don't check for pending trades here anymore
      // as that's handled by the AuthenticatedLayout component
      setAccount(accountData);
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

  async function startAutoTrading() {
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

    try {
      // Immediately deduct the trade amount from user's balance
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // Update account balance in database
      const newBalance = account.balance - tradeAmount;
      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({
          balance: newBalance,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local account state
      setAccount({
        ...account,
        balance: newBalance,
      });

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
      await createPendingTrade(tradeAmount);
    } catch (error: any) {
      console.error("Failed to start auto trading:", error);
      toast({
        variant: "destructive",
        title: "Failed to start trading",
        description: error.message || "Something went wrong",
      });
      setAutoTradeActive(false);
      setTimeRemaining(0);
    } finally {
      setIsTrading(false);
    }
  }

  async function createPendingTrade(tradeAmount: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const now = new Date();
      const durationMinutes = parseInt(tradeDuration);
      const expiryTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

      console.log(
        `Creating trade with expiry time: ${expiryTime.toISOString()}`,
      );

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
          expiration_time: expiryTime.toISOString(), // Store the exact expiry time
        })
        .select()
        .single();

      if (historyError) {
        console.error("Error creating pending trade record:", historyError);

        // If we failed to create the trade record, refund the user's balance
        const { error: refundError } = await supabase
          .from("user_accounts")
          .update({
            balance: account!.balance + tradeAmount, // Refund the amount
          })
          .eq("id", user.id);

        if (refundError) {
          console.error("Error refunding balance:", refundError);
        } else {
          // Update local account state
          setAccount({
            ...account!,
            balance: account!.balance + tradeAmount,
          });
        }

        throw new Error("Failed to create trade record");
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
      throw error; // Rethrow to handle in the calling function
    }
  }

  async function executeAutoTrade(tradeId?: string) {
    // Set a flag to track if this function is already running
    if (window.isProcessingTrade) {
      console.log(
        "Trade processing already in progress, skipping duplicate call",
      );
      return;
    }

    window.isProcessingTrade = true;
    setIsTrading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const now = new Date();

      // Find the pending trade - don't rely on local state
      let query = supabase
        .from("trading_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending");

      // If a specific trade ID is provided, use it
      if (tradeId) {
        query = query.eq("id", tradeId);
      }

      const { data: pendingTrades } = await query.order("created_at", {
        ascending: false,
      });

      if (pendingTrades && pendingTrades.length > 0) {
        const pendingTrade = pendingTrades[0];

        // Verify that the trade has actually expired
        const createdAt = new Date(pendingTrade.created_at);
        const durationMinutes = parseInt(pendingTrade.duration_minutes);
        const expiryTime = new Date(
          createdAt.getTime() + durationMinutes * 60 * 1000,
        );

        if (now.getTime() < expiryTime.getTime()) {
          console.log(
            `Trade ${pendingTrade.id} has not expired yet. Expires at ${expiryTime.toISOString()}`,
          );

          // If this is an auto trade that was triggered by the UI timer, update the UI
          if (autoTradeActive) {
            // Calculate remaining time and update UI
            const remainingMs = expiryTime.getTime() - now.getTime();
            setTimeRemaining(Math.floor(remainingMs / 1000));
          }

          setIsTrading(false);
          return;
        }

        console.log(
          `Processing expired trade ${pendingTrade.id}. Expired at ${expiryTime.toISOString()}`,
        );

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

          // Check if the trade has already been processed
          const { data: existingTrade } = await supabase
            .from("trading_history")
            .select("status, closed_at")
            .eq("id", pendingTrade.id)
            .single();

          // Only process the trade if it's still pending
          if (existingTrade && existingTrade.status !== "pending") {
            console.log(
              `Trade ${pendingTrade.id} has already been processed, skipping`,
            );
            setIsTrading(false);
            return;
          }

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
          // For profit trades: add the profit to the balance
          // For loss trades: subtract the loss from the balance
          // Don't add back the initial investment as it's already in the balance
          let newBalance = accountData.balance;

          // Add profit or subtract loss
          newBalance += roundedProfit;

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
                : `You lost ${Math.abs(roundedProfit).toFixed(2)}`,
            variant: roundedProfit > 0 ? "default" : "destructive",
          });
        } catch (processError: any) {
          throw new Error(`Failed to process trade: ${processError.message}`);
        }
      } else {
        // No pending trade found, but don't throw an error
        console.log(
          "No pending trade found, this may have been processed already",
        );

        // Reset UI state
        if (autoTradeActive) {
          setAutoTradeActive(false);
          setTimeRemaining(0);
        }

        setIsTrading(false);
        return;
      }
    } catch (error: any) {
      console.error("Auto trade error:", error);

      // Only show toast for errors that aren't related to missing trades
      if (error.message !== "No pending trade found") {
        toast({
          variant: "destructive",
          title: "Auto trade failed",
          description: error.message || "Something went wrong",
        });
      }
    } finally {
      setIsTrading(false);
      setAutoTradeActive(false);
      setAmount("");
      // Reset the processing flag
      window.isProcessingTrade = false;
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
    <div className="container mx-auto px-3 md:px-4 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-blue-400 md:hidden" />
            AI Trader
          </h1>
          {/* Mobile Balance Card - Next to Title */}
          <div className="md:hidden bg-gray-900/80 rounded-lg p-1.5 shadow-md ml-2">
            <div className="flex gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Balance
                </p>
                <p className="text-xs font-mono text-blue-400">
                  ${loading ? "..." : (account?.balance || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Profit
                </p>
                <p className="text-xs font-mono text-green-500">
                  ${loading ? "..." : "+" + (account?.profit || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-gray-900/80 rounded-lg p-2 shadow-md">
            <div className="flex gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Balance
                </p>
                <p className="text-base font-mono text-blue-400">
                  ${loading ? "..." : (account?.balance || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Profit
                </p>
                <p className="text-base font-mono text-green-500">
                  ${loading ? "..." : "+" + (account?.profit || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Combined Layout */}
      <div className="block md:hidden space-y-3">
        {/* AI Trading Interface */}
        <Card className="overflow-hidden border-0 shadow-md w-full max-w-[400px] mx-auto">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-blue-400" />
              <span>AI Trading</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="manual" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="manual" className="text-sm">
                  Manual
                </TabsTrigger>
                <TabsTrigger value="auto" className="text-sm">
                  Auto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">Crypto Pair</Label>
                  <Select value={cryptoPair} onValueChange={setCryptoPair}>
                    <SelectTrigger className="h-9">
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

                <div className="space-y-1">
                  <Label className="text-sm">Trade Type</Label>
                  <Select value={tradeType} onValueChange={setTradeType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Amount (USDT)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button
                  className="w-full h-9 mt-2 text-sm"
                  onClick={handleTrade}
                  disabled={isTrading || loading || !amount}
                >
                  {isTrading ? "Processing..." : "Execute Trade"}
                </Button>

                {tradeResult && (
                  <div
                    className={`p-2 text-xs rounded-md mt-2 ${tradeResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                  >
                    {tradeResult.message}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="auto" className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">AI Trading Amount (USDT)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={autoTradeActive}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Trading Duration</Label>
                  <Select
                    value={tradeDuration}
                    onValueChange={setTradeDuration}
                    disabled={autoTradeActive}
                  >
                    <SelectTrigger className="h-9">
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

                <div className="space-y-1">
                  <Label className="text-sm">Risk Level</Label>
                  <Select defaultValue="medium" disabled={autoTradeActive}>
                    <SelectTrigger className="h-9">
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
                  <div className="flex items-center justify-center gap-2 p-2 text-xs bg-blue-500/10 rounded-md">
                    <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span>Trading: {formatDuration(timeRemaining)}</span>
                  </div>
                )}

                <Button
                  className="w-full h-9 mt-2 text-sm"
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
                    className={`p-2 text-xs rounded-md mt-2 ${tradeResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                  >
                    {tradeResult.message}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* TradingView Widget - Mobile */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span>Live Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[200px]">
            <div className="h-full w-full bg-gray-800 rounded-md overflow-hidden">
              <iframe
                title="TradingView Chart Mobile"
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_mobile_chart&symbol=${cryptoPair.replace("/", "")}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=0&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=www.tradingview.com&utm_medium=widget_new&utm_campaign=chart&utm_term=BTCUSDT`}
                style={{ width: "100%", height: "100%" }}
                frameBorder="0"
                allowTransparency={true}
              ></iframe>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis - Mobile */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-blue-400" />
              <span>AI Market Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[220px] overflow-auto bg-gradient-to-b from-gray-900 to-gray-950">
            <MobileAiMarketAnalysis />
          </CardContent>
        </Card>

        {/* Trading History - Mobile */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-blue-400" />
              <span>Trading History</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px] p-3">
              {tradeHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No trading history yet
                </div>
              ) : (
                <div className="space-y-3">
                  {tradeHistory.map((trade) => (
                    <div
                      key={trade.id}
                      className="border rounded-md p-2 space-y-1 bg-gray-900/30"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm">
                          {trade.crypto_pair}
                        </div>
                        <div
                          className={`font-medium text-sm ${getStatusColor(trade.status)}`}
                        >
                          {trade.status === "pending"
                            ? "PENDING"
                            : trade.profit_loss && trade.profit_loss > 0
                              ? "PROFIT"
                              : "LOSS"}
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
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

                      <div className="flex flex-col text-xs text-muted-foreground">
                        <div>
                          Started:{" "}
                          {format(new Date(trade.created_at), "MMM dd, HH:mm")}
                        </div>
                        {trade.closed_at ? (
                          <div>
                            Completed:{" "}
                            {format(new Date(trade.closed_at), "MMM dd, HH:mm")}
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
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          {/* AI Trading Interface */}
          <Card className="overflow-hidden border-0 shadow-lg w-full">
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

          {/* Account Info Card removed */}

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
        </div>

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
              <div className="h-full w-full bg-gray-800 rounded-md overflow-hidden">
                <iframe
                  title="TradingView Chart Desktop"
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_desktop_chart&symbol=${cryptoPair.replace("/", "")}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=www.tradingview.com&utm_medium=widget_new&utm_campaign=chart&utm_term=BTCUSDT`}
                  style={{ width: "100%", height: "100%" }}
                  frameBorder="0"
                  allowTransparency={true}
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-400" />
                <span>AI Market Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px] overflow-auto bg-gradient-to-b from-gray-900 to-gray-950">
              <DesktopAiMarketAnalysis />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

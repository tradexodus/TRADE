import { useState, useEffect, useRef } from "react";
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
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Bot } from "lucide-react";
import { Database } from "@/types/supabase";
import AdvancedTradingOptions from "./AdvancedTradingOptions";

const DURATIONS = [
  { value: "1", label: "1 Minute" },
  { value: "10", label: "10 Minutes" },
  { value: "60", label: "1 Hour" },
  { value: "360", label: "6 Hours" },
  { value: "720", label: "12 Hours" },
  { value: "1440", label: "24 Hours" },
];

interface AutoTradingProps {
  onTradeComplete?: () => void;
  balance?: number;
  userId?: string;
}

export default function AutoTrading({
  onTradeComplete,
  balance = 0,
  userId,
  maxAttempts = Infinity,
  attemptsUsed = 0,
  neuronLevel = { name: "Beginner" },
  nextResetTime = "Tomorrow",
}: AutoTradingProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("60");
  const [riskLevel, setRiskLevel] = useState([50]); // 0-100 scale
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tradeExecuted, setTradeExecuted] = useState(false);
  const [tradeResult, setTradeResult] = useState<{
    profit: number;
    isWin: boolean;
  } | null>(null);
  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isVerified, setIsVerified] = useState<
    "not_verified" | "pending" | "verified"
  >("not_verified");
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const timerIntervalRef = useRef<number | null>(null);
  const tradeIntervalRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  // Check verification status on component mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsVerified("not_verified");
        setIsCheckingVerification(false);
        return;
      }

      const { data: verification } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("id", user.id)
        .single();

      if (verification) {
        setIsVerified(verification.status);
      } else {
        setIsVerified("not_verified");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setIsVerified("not_verified");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const startAutoTrading = async () => {
    try {
      // Check verification status first
      if (isVerified !== "verified") {
        toast({
          title: "Account verification required",
          description:
            "Please verify your account in the Profile section before starting auto trading",
          variant: "destructive",
        });
        return;
      }

      // Validate amount is provided and positive
      if (!amount) {
        toast({
          title: "Missing amount",
          description: "Please enter an amount to start auto trading",
          variant: "destructive",
        });
        return;
      }

      if (parseFloat(amount) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        return;
      }

      const tradeAmount = parseFloat(amount);

      // Enhanced balance validation with detailed feedback
      if (tradeAmount > balance) {
        const shortfall = (tradeAmount - balance).toFixed(2);
        toast({
          title: "Insufficient balance",
          description: `Your balance (${balance.toFixed(2)}) is less than the trading amount (${tradeAmount.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }

      // Minimum trade amount validation
      const MIN_TRADE_AMOUNT = 10;
      if (tradeAmount < MIN_TRADE_AMOUNT) {
        toast({
          title: "Amount too small",
          description: `Minimum auto trading amount is ${MIN_TRADE_AMOUNT}`,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      // Get the current user with error handling
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        toast({
          title: "Authentication error",
          description: "Failed to verify your account: " + error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          title: "Authentication error",
          description: "Please log in to use auto trading",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user already has an active auto trading session
      if (isRunning) {
        toast({
          title: "Session already active",
          description: "You already have an active auto trading session",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create a pending trade record when auto trading starts
      const currentUserId = data.user.id;
      const expirationTime = new Date();
      expirationTime.setMinutes(
        expirationTime.getMinutes() + parseInt(duration),
      );

      // Generate a random crypto pair
      const cryptoPairs = [
        "BTC/USD",
        "ETH/USD",
        "SOL/USD",
        "BNB/USD",
        "XRP/USD",
      ];
      const randomPair =
        cryptoPairs[Math.floor(Math.random() * cryptoPairs.length)];

      // Record the auto trading attempt in the auto_trading_attempts table
      // Use Dubai time (GMT+4) for the attempt date
      const dubaiTime = new Date();
      dubaiTime.setHours(dubaiTime.getHours() + 4); // Adjust to GMT+4 (Dubai time)
      const today = dubaiTime.toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      // Try using the check_and_increment_attempts function
      try {
        const { data: functionResult, error: functionError } =
          await supabase.rpc("check_and_increment_attempts", {
            user_id_param: currentUserId,
            max_attempts_param: maxAttempts === Infinity ? 1000 : maxAttempts,
          });

        if (functionError) {
          console.error(
            "Error using check_and_increment_attempts function:",
            functionError,
          );
          toast({
            title: "Warning",
            description:
              "Failed to record trading attempt: " + functionError.message,
            variant: "destructive",
          });
          // Don't proceed with the trade if we can't track attempts
          setIsLoading(false);
          return;
        }

        // Check if we've reached the daily limit
        if (functionResult === false) {
          toast({
            title: "Daily limit reached",
            description: `You've reached your daily limit of ${maxAttempts} auto trading attempts. Try again tomorrow.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log("Successfully recorded auto trading attempt");

        // Refresh the attempts count
        if (onTradeComplete) {
          onTradeComplete();
        }
      } catch (error) {
        console.error(
          "Unexpected error recording auto trading attempt:",
          error,
        );
        toast({
          title: "Warning",
          description:
            "Failed to record trading attempt due to an unexpected error",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error: pendingTradeError } = await supabase
        .from("trading_history")
        .insert({
          user_id: currentUserId,
          amount: tradeAmount,
          crypto_pair: randomPair,
          trade_type: "AUTO",
          status: "pending",
          duration_minutes: duration,
          expiration_time: expirationTime.toISOString(),
          original_balance: balance,
        });

      if (pendingTradeError) {
        console.error(
          "Error creating pending trade record:",
          pendingTradeError,
        );
        toast({
          title: "Error",
          description: "Failed to create trade record",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update user's balance to reflect the pending amount
      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({ balance: balance - tradeAmount })
        .eq("id", currentUserId);

      if (updateError) {
        console.error("Error updating balance for pending trade:", updateError);
        toast({
          title: "Error",
          description: "Failed to update balance",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Start the auto trading session
      setIsRunning(true);
      setTimeRemaining(parseInt(duration) * 60); // Convert minutes to seconds

      toast({
        title: "Auto trading started",
        description: `AI will execute trades for ${duration} minutes with your settings`,
      });

      // Notify parent component to refresh balance
      if (onTradeComplete) {
        onTradeComplete();
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Auto trading error:", error);
      toast({
        title: "Error starting auto trading",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Auto trading cannot be stopped once started
  // This function is kept for internal use by the component
  const stopAutoTrading = () => {
    // Only called internally when time expires
    setIsRunning(false);
    setTimeRemaining(0);
    setProgress(0);
    setErrorMessage(null);
    setRetryCount(0);
    setIsRetrying(false);

    // Clear the timer interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Clear the trade interval
    if (tradeIntervalRef.current) {
      clearInterval(tradeIntervalRef.current);
      tradeIntervalRef.current = null;
    }

    // Clear any retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // If there was a trade executed, call the onTradeComplete callback
    if (tradeExecuted && onTradeComplete) {
      onTradeComplete();
    }
  };

  // Function to execute auto trades
  const executeAutoTrade = async () => {
    try {
      // Prevent duplicate trade processing
      if (tradeInProgress) {
        console.log("Trade already in progress, skipping");
        return;
      }

      // Validate trading is still active
      if (!isRunning) {
        console.log("Auto trading session is no longer active");
        return;
      }

      // Clear any previous error messages if not retrying
      if (!isRetrying) {
        setErrorMessage(null);
      }

      // Reset retry state if this is a new trade attempt
      if (!isRetrying) {
        setRetryCount(0);
      }

      // Set trade in progress flag
      setTradeInProgress(true);

      // Get the current user if userId is not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error during auto trade:", error);
          toast({
            title: "Authentication error",
            description: "Failed to verify your account during trading",
            variant: "destructive",
          });
          stopAutoTrading();
          return;
        }

        currentUserId = data.user?.id;

        if (!currentUserId) {
          console.error("No user ID available for auto trading");
          toast({
            title: "Session error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          stopAutoTrading();
          return;
        }
      }

      // Verify amount is still valid
      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount)) {
        console.error("Invalid trade amount format for auto trading");
        toast({
          title: "Invalid amount format",
          description: "The trading amount is not a valid number",
          variant: "destructive",
        });
        stopAutoTrading();
        return;
      }

      if (tradeAmount <= 0) {
        console.error("Non-positive trade amount for auto trading");
        toast({
          title: "Invalid amount",
          description: "Trading amount must be greater than zero",
          variant: "destructive",
        });
        stopAutoTrading();
        return;
      }

      // Check if amount exceeds current balance
      if (tradeAmount > balance) {
        console.error("Trade amount exceeds available balance");
        toast({
          title: "Insufficient balance",
          description: `Your balance ($${balance.toFixed(2)}) is less than the trading amount ($${tradeAmount.toFixed(2)})`,
          variant: "destructive",
        });
        stopAutoTrading();
        return;
      }

      // Get user's trading settings
      let settingsData = null;
      let settingsError = null;
      try {
        const response = await supabase
          .from("trading_settings")
          .select("*")
          .eq("user_id", currentUserId)
          .single();

        settingsData = response.data;
        settingsError = response.error;

        if (settingsError && settingsError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error
          console.error("Error fetching trading settings:", settingsError);

          // Create a more descriptive error message based on the error code
          let errorDescription = "Failed to retrieve your trading settings";

          if (settingsError.code === "PGRST109") {
            errorDescription =
              "Database connection error. Please try again later.";
          } else if (settingsError.code === "PGRST118") {
            errorDescription = "Permission denied accessing trading settings.";
          } else if (settingsError.code === "PGRST104") {
            errorDescription =
              "Trading settings table not found. Please contact support.";
          } else if (settingsError.code === "PGRST105") {
            errorDescription =
              "Column not found in trading settings. Please contact support.";
          } else if (settingsError.code === "PGRST301") {
            errorDescription = "Session expired. Please log in again.";
          } else if (settingsError.code) {
            errorDescription = `${errorDescription}: ${settingsError.code} - ${settingsError.message || "Database error"}`;
          } else {
            errorDescription = `${errorDescription}: ${settingsError.message || "Database error"}`;
          }

          toast({
            title: "Settings error",
            description: errorDescription,
            variant: "destructive",
          });
        }
      } catch (error) {
        // Handle unexpected errors during settings fetch
        console.error("Unexpected error fetching trading settings:", error);

        // Create more descriptive error message based on error type
        let errorTitle = "Settings error";
        let errorDescription = "";

        if (error instanceof TypeError) {
          errorDescription =
            "Network or type error while retrieving settings. Please check your connection.";
        } else if (error instanceof SyntaxError) {
          errorDescription =
            "Invalid response format from server. Please contact support.";
        } else if (
          error instanceof Error &&
          error.message.includes("timeout")
        ) {
          errorDescription =
            "Request timed out while retrieving settings. Please try again later.";
        } else if (
          error instanceof Error &&
          error.message.includes("offline")
        ) {
          errorDescription =
            "You appear to be offline. Please check your internet connection.";
        } else {
          errorDescription = `Unexpected error retrieving trading settings: ${error instanceof Error ? error.message : String(error)}`;
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
      }

      // Define default settings
      const defaultSettings = {
        win_probability: 0.65, // 65% chance to win
        min_profit_percentage: 0.8, // 0.8%
        max_profit_percentage: 1.5, // 1.5%
        max_loss_percentage: 0.95, // 0.95%
      };

      // Validate settings or use defaults
      let validatedSettings;
      if (!settingsError && settingsData) {
        // Validate each setting field and use default if invalid
        validatedSettings = {
          win_probability: isValidProbability(settingsData.win_probability)
            ? settingsData.win_probability
            : defaultSettings.win_probability,
          min_profit_percentage: isValidPercentage(
            settingsData.min_profit_percentage,
          )
            ? settingsData.min_profit_percentage
            : defaultSettings.min_profit_percentage,
          max_profit_percentage: isValidPercentage(
            settingsData.max_profit_percentage,
          )
            ? settingsData.max_profit_percentage
            : defaultSettings.max_profit_percentage,
          max_loss_percentage: isValidPercentage(
            settingsData.max_loss_percentage,
          )
            ? settingsData.max_loss_percentage
            : defaultSettings.max_loss_percentage,
        };

        // Log if any settings were invalid and replaced
        const invalidSettings = [];
        if (!isValidProbability(settingsData.win_probability))
          invalidSettings.push("win_probability");
        if (!isValidPercentage(settingsData.min_profit_percentage))
          invalidSettings.push("min_profit_percentage");
        if (!isValidPercentage(settingsData.max_profit_percentage))
          invalidSettings.push("max_profit_percentage");
        if (!isValidPercentage(settingsData.max_loss_percentage))
          invalidSettings.push("max_loss_percentage");

        if (invalidSettings.length > 0) {
          console.warn(
            `Invalid settings detected and replaced with defaults: ${invalidSettings.join(", ")}`,
          );
        }
      } else {
        // Use default settings if none found
        console.log("Using default trading settings");
        validatedSettings = { ...defaultSettings };
      }

      // Adjust based on risk level
      const riskFactor = riskLevel[0] / 50; // 0-2 scale where 1 is medium risk
      const settings = {
        win_probability: Math.max(
          0.5,
          Math.min(
            0.8,
            validatedSettings.win_probability * (1 - (riskFactor - 1) * 0.2),
          ),
        ),
        min_profit_percentage:
          validatedSettings.min_profit_percentage *
          (1 + (riskFactor - 1) * 0.5),
        max_profit_percentage:
          validatedSettings.max_profit_percentage *
          (1 + (riskFactor - 1) * 0.5),
        max_loss_percentage:
          validatedSettings.max_loss_percentage * (1 + (riskFactor - 1) * 0.2),
      };

      // Execute the trade with validated settings
      await processTrade(currentUserId, tradeAmount, settings);
    } catch (error) {
      console.error("Error executing auto trade:", error);

      // Determine if this is a network error
      const isNetworkError =
        error instanceof Error &&
        (error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("connection") ||
          error.message.toLowerCase().includes("timeout") ||
          error.message.toLowerCase().includes("offline") ||
          error.message.toLowerCase().includes("internet") ||
          error.message.toLowerCase().includes("unreachable") ||
          error.message.toLowerCase().includes("failed to fetch"));

      // Create a more descriptive error message based on error type
      let errorMsg = "";
      let errorTitle = "";

      if (isNetworkError) {
        errorTitle = "Network error";
        errorMsg = `Network error: ${error instanceof Error ? error.message : "Connection issue detected"}. Will retry automatically.`;
      } else if (
        error instanceof Error &&
        error.message.includes("Database error")
      ) {
        errorTitle = "Database error";
        errorMsg = error.message;
      } else if (
        error instanceof Error &&
        error.message.includes("Permission denied")
      ) {
        errorTitle = "Permission error";
        errorMsg =
          "You don't have permission to perform this action. Please contact support.";
      } else if (error instanceof Error && error.message.includes("timeout")) {
        errorTitle = "Timeout error";
        errorMsg = "The operation timed out. Please try again later.";
      } else if (
        error instanceof Error &&
        error.message.includes("rate limit")
      ) {
        errorTitle = "Rate limit exceeded";
        errorMsg =
          "You've reached the rate limit for trading operations. Please wait a moment before trying again.";
      } else {
        errorTitle = "Trading error";
        errorMsg =
          error instanceof Error ? error.message : "Failed to execute trade";
      }

      setErrorMessage(errorMsg);

      // Show toast only if not retrying or if this is a new error type
      if (!isRetrying) {
        toast({
          title: errorTitle,
          description: errorMsg,
          variant: "destructive",
        });
      }

      // Implement retry logic for network errors
      const MAX_RETRIES = 3;
      if (isNetworkError && retryCount < MAX_RETRIES && isRunning) {
        setRetryCount((prev) => prev + 1);
        setIsRetrying(true);

        // Exponential backoff: 2^retry * 1000ms (2s, 4s, 8s)
        const retryDelay = Math.pow(2, retryCount) * 1000;

        console.log(
          `Retrying trade in ${retryDelay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        );

        // Set up retry timeout
        retryTimeoutRef.current = window.setTimeout(() => {
          if (isRunning) {
            console.log(`Retry attempt ${retryCount}/${MAX_RETRIES}`);
            executeAutoTrade();
          }
        }, retryDelay) as unknown as number;
      } else if (isNetworkError && retryCount >= MAX_RETRIES) {
        // Max retries reached
        setErrorMessage(
          `Network error persists after ${MAX_RETRIES} retry attempts. Please check your connection.`,
        );
        setIsRetrying(false);
      } else {
        // Not a network error or not running anymore
        setIsRetrying(false);
      }
    } finally {
      // Reset the trade in progress flag only if not retrying
      if (!isRetrying) {
        setTradeInProgress(false);
      }
    }
  };

  // Helper functions for settings validation
  const isValidProbability = (value: any): boolean => {
    return (
      typeof value === "number" && !isNaN(value) && value >= 0 && value <= 1
    );
  };

  const isValidPercentage = (value: any): boolean => {
    return (
      typeof value === "number" && !isNaN(value) && value > 0 && value < 100
    );
  };

  // Generate AI reasoning for auto trades
  const generateAiReasoning = (
    isWin: boolean,
    profitLoss: number,
    settings: any,
    cryptoPair: string,
  ): string => {
    const riskLevel =
      riskLevel[0] < 33 ? "low" : riskLevel[0] < 66 ? "medium" : "high";
    const marketConditions = [
      "bullish",
      "bearish",
      "volatile",
      "stable",
      "consolidating",
    ];
    const randomMarketCondition =
      marketConditions[Math.floor(Math.random() * marketConditions.length)];

    const profitLossAbs = Math.abs(profitLoss).toFixed(2);
    const profitLossPercentage = (
      (Math.abs(profitLoss) / parseFloat(amount)) *
      100
    ).toFixed(2);

    if (isWin) {
      return `AI detected favorable ${randomMarketCondition} conditions for ${cryptoPair}. With ${riskLevel} risk profile, executed trade resulting in ${profitLossAbs} profit (${profitLossPercentage}%). Technical indicators showed strong momentum and optimal entry point. Win probability was calculated at ${(settings.win_probability * 100).toFixed(0)}% based on market analysis.`;
    } else {
      return `AI detected ${randomMarketCondition} conditions for ${cryptoPair}, but market moved against prediction. With ${riskLevel} risk profile, trade resulted in ${profitLossAbs} loss (${profitLossPercentage}%). Risk management limited downside to ${settings.max_loss_percentage.toFixed(2)}%. Technical indicators showed mixed signals with win probability at ${(settings.win_probability * 100).toFixed(0)}%.`;
    }
  };

  // Process the trade and update the database
  const processTrade = async (
    userId: string,
    amount: number,
    settings: {
      win_probability: number;
      min_profit_percentage: number;
      max_profit_percentage: number;
      max_loss_percentage: number;
    },
  ) => {
    // First check if there's an existing pending trade to update
    const { data: pendingTrades, error: fetchError } = await supabase
      .from("trading_history")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("trade_type", "AUTO")
      .order("created_at", { ascending: false })
      .limit(1);

    const hasPendingTrade = pendingTrades && pendingTrades.length > 0;
    const pendingTradeId = hasPendingTrade ? pendingTrades[0].id : null;
    // Validate inputs before processing
    if (!userId) {
      throw new Error("User ID is required for processing trades");
    }

    if (isNaN(amount)) {
      throw new Error("Trade amount must be a valid number");
    }

    if (amount <= 0) {
      throw new Error("Trade amount must be greater than zero");
    }

    if (!settings) {
      throw new Error("Trading settings are required");
    }

    if (typeof settings.win_probability !== "number") {
      throw new Error("Win probability must be a valid number");
    }

    if (typeof settings.min_profit_percentage !== "number") {
      throw new Error("Minimum profit percentage must be a valid number");
    }

    if (typeof settings.max_profit_percentage !== "number") {
      throw new Error("Maximum profit percentage must be a valid number");
    }

    if (typeof settings.max_loss_percentage !== "number") {
      throw new Error("Maximum loss percentage must be a valid number");
    }
    // Determine if the trade is a win or loss based on probability
    const isWin = Math.random() < settings.win_probability;

    // Calculate profit or loss
    let profitLoss = 0;
    if (isWin) {
      // Random profit percentage between min and max
      const profitPercentage =
        settings.min_profit_percentage +
        Math.random() *
          (settings.max_profit_percentage - settings.min_profit_percentage);
      profitLoss = amount * (profitPercentage / 100);
    } else {
      // Loss percentage
      profitLoss = -amount * (settings.max_loss_percentage / 100);
    }

    // Round to 2 decimal places
    profitLoss = parseFloat(profitLoss.toFixed(2));

    // Update the UI with the trade result
    setTradeResult({
      profit: profitLoss,
      isWin,
    });
    setTradeExecuted(true);

    // Generate a random crypto pair
    const cryptoPairs = ["BTC/USD", "ETH/USD", "SOL/USD", "BNB/USD", "XRP/USD"];
    const randomPair =
      cryptoPairs[Math.floor(Math.random() * cryptoPairs.length)];

    // Generate AI reasoning for this trade
    const aiReasoning = generateAiReasoning(
      isWin,
      profitLoss,
      settings,
      randomPair,
    );

    // If there's a pending trade, update it; otherwise insert a new one
    let tradeError;
    if (pendingTradeId) {
      const { error } = await supabase
        .from("trading_history")
        .update({
          status: "COMPLETED",
          profit_loss: profitLoss,
          closed_at: new Date().toISOString(),
          ai_reasoning: aiReasoning,
        })
        .eq("id", pendingTradeId);
      tradeError = error;
    } else {
      // Insert a new trade record if no pending trade was found
      const { error } = await supabase.from("trading_history").insert({
        user_id: userId,
        amount: amount,
        crypto_pair: randomPair,
        trade_type: "AUTO",
        status: "COMPLETED",
        profit_loss: profitLoss,
        original_balance: balance,
        closed_at: new Date().toISOString(),
        ai_reasoning: aiReasoning,
      });
      tradeError = error;
    }

    if (tradeError) {
      console.error("Error recording trade history:", tradeError);
      // Enhanced error message with error code and details
      const errorCode = tradeError.code || "UNKNOWN";
      const errorDetails = tradeError.details || "";

      // Provide more specific error messages based on error code
      let errorMessage = "Failed to record trade history";

      if (errorCode === "23505") {
        errorMessage = "Duplicate trade record detected";
      } else if (errorCode === "23503") {
        errorMessage = "Referenced record does not exist";
      } else if (errorCode === "42P01") {
        errorMessage = "Trading history table not found";
      } else if (errorCode === "42703") {
        errorMessage = "Missing column in trading history table";
      } else if (errorCode.startsWith("PGRST")) {
        errorMessage = `API error: ${tradeError.message}`;
      }

      throw new Error(
        `Database error (${errorCode}): ${errorMessage}. ${tradeError.message}${errorDetails ? ` Details: ${errorDetails}` : ""}`,
      );
    }

    // Update user account balance
    try {
      // First get current profit value
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("profit")
        .eq("id", userId)
        .single();

      if (accountError) {
        throw new Error(
          `Failed to get current profit: ${accountError.message}`,
        );
      }

      const currentProfit = accountData?.profit || 0;
      const newProfit = currentProfit + profitLoss;

      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({
          balance: balance + profitLoss,
          profit: newProfit,
        })
        .eq("id", userId);
    } catch (error) {
      // Handle unexpected errors during the update operation
      console.error("Unexpected error during account update:", error);
      if (error instanceof Error) {
        throw error; // Re-throw if it's already an Error object
      } else {
        throw new Error(
          `Unexpected error during account update: ${String(error)}`,
        );
      }
    }

    // Call the onTradeComplete callback if provided
    if (onTradeComplete) {
      onTradeComplete();
    }
  };

  // Set up the countdown timer when auto trading is running
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      // Calculate the total duration in seconds
      const totalDuration = parseInt(duration) * 60;

      // Set up the interval to update the timer every second
      timerIntervalRef.current = window.setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Time's up, stop auto trading
            stopAutoTrading();
            return 0;
          }

          // Update progress percentage
          const newTime = prevTime - 1;
          const progressPercentage = 100 - (newTime / totalDuration) * 100;
          setProgress(progressPercentage);

          return newTime;
        });
      }, 1000) as unknown as number;

      // Clean up the interval when component unmounts or trading stops
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
  }, [isRunning, timeRemaining, duration]);

  // Set up the auto trading execution at random intervals
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      // Execute first trade after a random delay (5-15 seconds)
      const initialDelay = 5000 + Math.random() * 10000;

      const executeFirstTradeTimeout = setTimeout(() => {
        executeAutoTrade();

        // Set up random interval trades
        const minInterval = 30000; // 30 seconds
        const maxInterval = 120000; // 2 minutes

        // Clear any existing interval first to prevent duplicates
        if (tradeIntervalRef.current) {
          clearInterval(tradeIntervalRef.current);
        }

        tradeIntervalRef.current = window.setInterval(
          () => {
            // Only execute if still running
            if (isRunning && timeRemaining > 15) {
              // Ensure at least 15 seconds left
              executeAutoTrade();
            }
          },
          minInterval + Math.random() * (maxInterval - minInterval),
        ) as unknown as number;
      }, initialDelay);

      // Clean up
      return () => {
        clearTimeout(executeFirstTradeTimeout);
        if (tradeIntervalRef.current) {
          clearInterval(tradeIntervalRef.current);
          tradeIntervalRef.current = null;
        }
      };
    }
  }, [isRunning, timeRemaining]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return "00:00";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {!isRunning ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="auto-amount">Amount (USD)</Label>
            <Input
              id="auto-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              disabled={isRunning}
            />
            {balance > 0 && (
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Available: ${balance.toFixed(2)}</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setAmount(balance.toString())}
                  disabled={isRunning}
                >
                  Max
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-duration">Session Duration</Label>
            <Select
              value={duration}
              onValueChange={setDuration}
              disabled={isRunning}
            >
              <SelectTrigger id="auto-duration">
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

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Risk Level</Label>
              <span className="text-sm text-muted-foreground">
                {riskLevel[0] < 33
                  ? "Low"
                  : riskLevel[0] < 66
                    ? "Medium"
                    : "High"}
              </span>
            </div>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              value={riskLevel}
              onValueChange={setRiskLevel}
              disabled={isRunning}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="mt-4">
            <AdvancedTradingOptions disabled={isRunning} />
          </div>

          <div className="space-y-4">
            {isVerified !== "verified" && !isCheckingVerification && (
              <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <div className="text-center space-y-2">
                  <p className="text-yellow-500 font-medium text-sm">
                    Account verification required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isVerified === "pending"
                      ? "Your verification is being reviewed. Auto trading will be available once verified."
                      : "Please verify your account in the Profile section to start auto trading."}
                  </p>
                </div>
              </div>
            )}
            {maxAttempts !== Infinity && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Daily attempts:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      attemptsUsed >= maxAttempts ? "text-red-500" : ""
                    }
                  >
                    {attemptsUsed} / {maxAttempts}
                  </span>
                  <div className="relative group">
                    <div className="cursor-help text-muted-foreground hover:text-foreground">
                      ⓘ
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      <p>
                        Your {neuronLevel?.name} level allows {maxAttempts} auto
                        trading attempts per day.
                      </p>
                      <p className="mt-1">
                        Attempts reset at midnight (GMT+4).
                      </p>
                      <p className="mt-1">Next reset: {nextResetTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              onClick={startAutoTrading}
              disabled={
                isLoading ||
                isCheckingVerification ||
                isVerified !== "verified" ||
                !amount ||
                parseFloat(amount) <= 0 ||
                (maxAttempts !== Infinity && attemptsUsed >= maxAttempts)
              }
            >
              {isCheckingVerification
                ? "Checking verification..."
                : isLoading
                  ? "Processing..."
                  : isVerified !== "verified"
                    ? "Account Verification Required"
                    : maxAttempts !== Infinity && attemptsUsed >= maxAttempts
                      ? "Daily Limit Reached"
                      : "Start Auto Trading"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Session in progress</span>
              <span className="text-xl font-mono">{formatTimeRemaining()}</span>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Amount: ${parseFloat(amount).toFixed(2)}</span>
              <span>
                Risk:{" "}
                {riskLevel[0] < 33
                  ? "Low"
                  : riskLevel[0] < 66
                    ? "Medium"
                    : "High"}
              </span>
            </div>

            <div className="bg-muted/30 p-4 rounded-md space-y-2">
              <h4 className="text-sm font-medium">AI Trading Status</h4>
              {errorMessage ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-500">
                    Error: {errorMessage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRetrying
                      ? `Retrying... (Attempt ${retryCount}/${3})`
                      : "AI will continue to attempt trades after resolving this issue."}
                  </p>
                </div>
              ) : tradeResult ? (
                <div className="space-y-2">
                  <p
                    className={`text-sm font-medium ${tradeResult.isWin ? "text-green-500" : "text-red-500"}`}
                  >
                    {tradeResult.isWin ? "Profit" : "Loss"}: $
                    {Math.abs(tradeResult.profit).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tradeInProgress
                      ? "AI is executing a trade..."
                      : "AI is continuing to analyze market conditions for optimal trading opportunities."}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {tradeInProgress
                    ? "AI is executing a trade..."
                    : "AI is analyzing market conditions and will execute trades automatically based on your risk preferences."}
                </p>
              )}
            </div>

            <div className="w-full mt-4 p-3 bg-muted/50 rounded-md border border-muted-foreground/20 text-center text-sm text-muted-foreground">
              <Bot className="h-4 w-4 inline-block mr-2" />
              Auto trading will complete in {formatTimeRemaining()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

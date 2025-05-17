import { Suspense, lazy, useState, useEffect, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MousePointer, AlertTriangle } from "lucide-react";
import TradingViewChart from "@/components/ai-trading/TradingViewChart";
import MarketSentiment from "@/components/ai-trading/MarketSentiment";
import { useToast } from "@/components/ui/use-toast";
import { MobileAccountInfo } from "@/components/ai-trading/AccountInfo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AccountInfo = lazy(() => import("@/components/ai-trading/AccountInfo"));
const ManualTrading = lazy(
  () => import("@/components/ai-trading/ManualTrading"),
);
const AutoTrading = lazy(() => import("@/components/ai-trading/AutoTrading"));
const TradeHistory = lazy(() => import("@/components/ai-trading/TradeHistory"));

export default function AiTrading() {
  const { toast } = useToast();
  const [userData, setUserData] = useState<{
    userId: string | null;
    balance: number;
    profit: number;
    neuronLevel?: any;
    attemptsUsed?: number;
    maxAttempts?: number;
    nextResetTime?: string;
  }>({
    userId: null,
    balance: 0,
    profit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tradingMode, setTradingMode] = useState<"manual" | "auto">("manual");

  // Fetch user account data and trading attempts
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user account data
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", user.id)
        .single();

      if (accountError) {
        console.error("Error fetching account data:", accountError);
        setIsLoading(false);
        return;
      }

      // Get user's deposits to calculate total deposit amount
      const { data: depositsData } = await supabase
        .from("deposits")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "approved");

      // Calculate total deposit amount from deposits table
      const totalDepositAmount = depositsData
        ? depositsData.reduce((sum, deposit) => sum + (deposit.amount || 0), 0)
        : 0;

      const { getNeuronLevel, NEURON_LEVELS } = await import(
        "@/lib/neuron-levels"
      );
      const neuronLevel = getNeuronLevel(totalDepositAmount);

      // Get user's auto trading attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("auto_trading_attempts")
        .select("attempts_used, last_reset")
        .eq("user_id", user.id)
        .single();

      // Calculate next reset time (midnight GMT+4)
      const now = new Date();
      const dubaiTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
      );
      const nextReset = new Date(dubaiTime);
      nextReset.setHours(24, 0, 0, 0); // Set to next midnight in Dubai time

      // Format the next reset time in user's local timezone
      const nextResetFormatted = nextReset.toLocaleString();

      // If no attempts record exists yet, user has used 0 attempts
      let attemptsUsed = 0;

      if (attemptsData) {
        // Check if the last reset was today in Dubai time
        const lastResetDate = new Date(attemptsData.last_reset);
        const lastResetDubaiDate = new Date(
          lastResetDate.toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
        ).setHours(0, 0, 0, 0);

        const todayDubaiDate = new Date(
          dubaiTime.toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
        ).setHours(0, 0, 0, 0);

        // Only count attempts if they were made today
        if (lastResetDubaiDate === todayDubaiDate) {
          attemptsUsed = attemptsData.attempts_used;
        }
      }
      const maxAttempts = neuronLevel.dailyAutoTradingAttempts;

      setUserData({
        userId: user.id,
        balance: accountData?.balance || 0,
        profit: accountData?.profit || 0,
        neuronLevel,
        attemptsUsed,
        maxAttempts,
        nextResetTime: nextResetFormatted,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh user data after trade completion
  const handleTradeComplete = async () => {
    if (!userData.userId) return;
    await fetchUserData();
  };

  // Simulate market volatility notification
  useEffect(() => {
    // Show a market volatility notification after 5 seconds
    const timer = setTimeout(() => {
      toast({
        title: "High Market Volatility Detected",
        description:
          "BTC/USD is experiencing significant price movements. Trade with caution.",
        variant: "default",
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-0 space-y-4 py-0 max-w-full pb-20 md:pb-4">
        <div className="flex items-center justify-between">
          <MobileAccountInfo />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Suspense
            fallback={
              <div className="h-32 bg-muted rounded-md animate-pulse"></div>
            }
          >
            <AccountInfo />
          </Suspense>

          {/* Mobile-first order: TradingView chart first, then Market Sentiment */}
          <div className="md:col-span-2 md:order-2 order-1">
            <TradingViewChart height={500} />
          </div>

          <MarketSentiment className="md:col-span-2 md:order-1 order-2" />

          {/* Desktop trading card */}
          <Card className="w-full hidden md:block md:order-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {tradingMode === "auto" ? (
                    <>
                      <Bot className="h-5 w-5" />
                      Auto Trading
                    </>
                  ) : (
                    <>
                      <MousePointer className="h-5 w-5" />
                      Manual Trading
                    </>
                  )}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    <Button
                      variant={tradingMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTradingMode("manual")}
                    >
                      <MousePointer className="h-4 w-4 mr-1" />
                      Manual
                    </Button>
                    <Button
                      variant={tradingMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTradingMode("auto")}
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      Auto
                    </Button>
                  </div>
                </div>
              </div>
              <CardDescription>
                {tradingMode === "auto"
                  ? "Let AI execute trades automatically based on your settings"
                  : "Execute trades manually with your preferred settings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tradingMode === "manual" ? (
                <Suspense
                  fallback={
                    <div className="h-64 bg-muted rounded-md animate-pulse"></div>
                  }
                >
                  <ManualTrading
                    balance={userData.balance}
                    onTradeComplete={handleTradeComplete}
                  />
                </Suspense>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-200 bg-muted rounded-md animate-pulse"></div>
                  }
                >
                  <AutoTrading
                    balance={userData.balance}
                    userId={userData.userId}
                    onTradeComplete={handleTradeComplete}
                    attemptsUsed={userData.attemptsUsed}
                    maxAttempts={userData.maxAttempts}
                    nextResetTime={userData.nextResetTime}
                    neuronLevel={userData.neuronLevel}
                  />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>

        <Suspense
          fallback={
            <div className="h-64 bg-muted rounded-md animate-pulse"></div>
          }
        >
          <TradeHistory userId={userData.userId} />
        </Suspense>

        {/* Mobile bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex justify-around md:hidden z-50">
          <Sheet
            open={isSheetOpen && tradingMode === "manual"}
            onOpenChange={(open) => {
              setIsSheetOpen(open);
              if (open) setTradingMode("manual");
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant={tradingMode === "manual" ? "default" : "outline"}
                className="flex-1 mx-1"
                onClick={() => setTradingMode("manual")}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Manual Trading
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Execute trades manually with your preferred settings
                </p>
                <Suspense
                  fallback={
                    <div className="h-64 bg-muted rounded-md animate-pulse"></div>
                  }
                >
                  <ManualTrading
                    balance={userData.balance}
                    onTradeComplete={handleTradeComplete}
                  />
                </Suspense>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={isSheetOpen && tradingMode === "auto"}
            onOpenChange={(open) => {
              setIsSheetOpen(open);
              if (open) setTradingMode("auto");
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant={tradingMode === "auto" ? "default" : "outline"}
                className="flex-1 mx-1"
                onClick={() => setTradingMode("auto")}
              >
                <Bot className="h-4 w-4 mr-2" />
                Auto
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Auto Trading
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let AI execute trades automatically based on your settings
                </p>
                <Suspense
                  fallback={
                    <div className="h-64 bg-muted rounded-md animate-pulse"></div>
                  }
                >
                  <AutoTrading
                    balance={userData.balance}
                    userId={userData.userId}
                    onTradeComplete={handleTradeComplete}
                    attemptsUsed={userData.attemptsUsed}
                    maxAttempts={userData.maxAttempts}
                    nextResetTime={userData.nextResetTime}
                    neuronLevel={userData.neuronLevel}
                  />
                </Suspense>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

import { Suspense, lazy, useState, useEffect } from "react";
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
import EmergencyStopButton from "@/components/ai-trading/EmergencyStopButton";
import { useToast } from "@/components/ui/use-toast";

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
  }>({
    userId: null,
    balance: 0,
    profit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tradingMode, setTradingMode] = useState<"manual" | "auto">("manual");

  // Fetch user account data
  useEffect(() => {
    async function fetchUserData() {
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

        setUserData({
          userId: user.id,
          balance: accountData?.balance || 0,
          profit: accountData?.profit || 0,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Refresh user data after trade completion
  const handleTradeComplete = async () => {
    if (!userData.userId) return;

    try {
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", userData.userId)
        .single();

      if (accountError) {
        console.error("Error refreshing account data:", accountError);
        return;
      }

      setUserData((prev) => ({
        ...prev,
        balance: accountData?.balance || prev.balance,
        profit: accountData?.profit || prev.profit,
      }));
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
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

  const handleEmergencyStop = () => {
    // Reset trading mode and refresh data
    setTradingMode("manual");
    handleTradeComplete();
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            AI Trading
          </h1>
          <EmergencyStopButton
            userId={userData.userId}
            onEmergencyStop={handleEmergencyStop}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Suspense
            fallback={
              <div className="h-32 bg-muted rounded-md animate-pulse"></div>
            }
          >
            <AccountInfo />
          </Suspense>

          <MarketSentiment className="md:col-span-2" />

          <Card className="w-full">
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
                  />
                </Suspense>
              )}
            </CardContent>
          </Card>
          <div className="md:col-span-2">
            <TradingViewChart height={500} />
          </div>
        </div>

        <Suspense
          fallback={
            <div className="h-64 bg-muted rounded-md animate-pulse"></div>
          }
        >
          <TradeHistory userId={userData.userId} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

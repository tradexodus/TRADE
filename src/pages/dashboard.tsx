import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";
import { AiMarketAnalysisCard } from "@/components/dashboard/AiMarketAnalysisCard";
import { TradingViewMarketOverview } from "@/components/dashboard/trading-view-market-overview";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TradingStatsCard } from "@/components/dashboard/TradingStatsCard";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);
  const [activeTrades, setActiveTrades] = useState<number>(0);
  const [totalTradeValue, setTotalTradeValue] = useState<number>(0);
  const [followedTraders, setFollowedTraders] = useState<number>(0);
  const [traderPerformance, setTraderPerformance] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<{
    account_id?: string;
  } | null>(null);

  const tradingViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No need to initialize TradingView widget with script injection
    // We'll use a direct iframe approach instead

    async function fetchDashboardData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch account balance and data
        const { data: userData } = await supabase
          .from("user_accounts")
          .select("balance, account_id, profit")
          .eq("id", user.id)
          .single();

        if (userData) {
          setBalance(userData.balance || 0);
          setProfit(userData.profit || 0);
          setAccountData(userData);
        }

        // Fetch active trades
        const { data: tradesData, error: tradesError } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (tradesData) {
          setActiveTrades(tradesData.length);
          // Calculate total value of active trades
          const totalValue = tradesData.reduce(
            (sum, trade) => sum + (trade.amount || 0),
            0,
          );
          setTotalTradeValue(totalValue);
        }

        // Fetch followed traders
        const { data: followedData } = await supabase
          .from("followed_traders")
          .select("*")
          .eq("follower_id", user.id);

        if (followedData) {
          setFollowedTraders(followedData.length);

          // Calculate average performance if there are followed traders
          if (followedData.length > 0) {
            const { data: performanceData } = await supabase
              .from("trader_performance")
              .select("performance_30d")
              .in(
                "trader_id",
                followedData.map((item) => item.trader_id),
              );

            if (performanceData && performanceData.length > 0) {
              const avgPerformance =
                performanceData.reduce(
                  (sum, item) => sum + (item.performance_30d || 0),
                  0,
                ) / performanceData.length;

              setTraderPerformance(
                `${avgPerformance > 0 ? "+" : ""}${avgPerformance.toFixed(1)}% (30d)`,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-1 sm:px-1 space-y-1 sm:space-y-2 py-0 sm:py-0">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            Dashboard
          </h1>
        </div>

        {/* Dashboard Grid Layout - Mobile Optimized */}
        <div className="grid gap-3 sm:gap-4 md:gap-3 grid-cols-1 md:grid-cols-12">
          {/* Mobile: Full-width Balance Card */}
          <div className="col-span-2 md:col-span-6 flex">
            <BalanceCard
              accountId={accountData?.account_id}
              balance={balance}
              profit={profit}
              loading={loading}
              className="flex max-w-[382.263px]"
            />
          </div>

          {/* Mobile: Two cards in one row */}
          <div className="col-span-1 md:col-span-3">
            <TradingStatsCard
              activeTrades={activeTrades}
              totalTradeValue={totalTradeValue}
              loading={loading}
            />
          </div>

          {/* Second Row: AI Market Analysis */}
          <div className="col-span-1 md:col-span-3">
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                  <span>AI Market Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AiMarketAnalysisCard />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Market Overview Widget - Full width at the bottom */}
      <div className="mt-4 sm:mt-3">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              <span>Market Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[380px] sm:max-h-none overflow-auto">
            <TradingViewMarketOverview />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

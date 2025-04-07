import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Wallet,
  ArrowUpDown,
  Users,
  User,
  BrainCircuit,
  LineChart,
} from "lucide-react";
import { AiMarketAnalysisCard } from "@/components/dashboard/AiMarketAnalysisCard";
import { TradingViewMarketOverview } from "@/components/dashboard/trading-view-market-overview";
import { useEffect, useState, useRef } from "react";
import { getNeuronLevel } from "@/lib/neuron-levels";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [balance, setBalance] = useState<number | null>(null);
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
          .select("balance, account_id")
          .eq("id", user.id)
          .single();

        if (userData) {
          setBalance(userData.balance || 0);
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
      <div className="container mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6 py-4 sm:py-6">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            Dashboard
          </h1>
        </div>

        {/* Mobile-optimized layout */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {/* Account Balance Card - Full width on mobile */}
          <Card className="col-span-2 md:col-span-1 overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span>Account Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Available Balance
                </p>
                {loading ? (
                  <p className="text-xl sm:text-2xl font-mono text-blue-400">
                    Loading...
                  </p>
                ) : (
                  <p className="text-xl sm:text-2xl font-mono text-blue-400">
                    ${balance?.toFixed(2) || "0.00"}
                  </p>
                )}
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <span>Updated just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Market Analysis Card */}
          <Card className="col-span-2 md:col-span-1 overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BrainCircuit className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span>AI Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AiMarketAnalysisCard />
            </CardContent>
          </Card>

          {/* Deposit/Withdrawal Card */}
          <Card className="col-span-1 overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
              <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3 p-3 sm:p-4">
              <div className="space-y-3">
                <a href="/deposit" className="w-full max-w-none">
                  <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    <ArrowUpDown className="h-4 w-4" />
                    Deposit
                  </button>
                </a>
                <a href="/withdrawal" className="w-full max-w-none static">
                  <button className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground h-14 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    <ArrowUpDown className="h-4 w-4" />
                    Withdraw
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* User Status Card - Simplified for mobile */}
          <Card className="col-span-1 overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
              <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                <span>Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-3 p-3 sm:p-4">
              <div className="space-y-2">
                {/* Account ID */}
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Account ID
                  </span>
                  <span className="text-sm font-mono truncate">
                    {accountData?.account_id || "Not available"}
                  </span>
                </div>

                {/* Neuron Level Progress */}
                {balance !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Neuron Level
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: getNeuronLevel(balance).color }}
                      >
                        {getNeuronLevel(balance).name}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full overflow-hidden"
                      style={{
                        backgroundColor: `${getNeuronLevel(balance).bgColor}50`,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${getNeuronLevel(balance).progressPercentage}%`,
                          backgroundColor: getNeuronLevel(balance).color,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span>{getNeuronLevel(balance).progressPercentage}%</span>
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                    <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-400"></span>
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market Overview Widget - Full width at the bottom */}
      <div className="mt-4 sm:mt-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-2 sm:py-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              <span>Market Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TradingViewMarketOverview />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

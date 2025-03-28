import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Wallet,
  ArrowUpDown,
  Users,
  Clock,
  BrainCircuit,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTrades, setActiveTrades] = useState<number>(0);
  const [totalTradeValue, setTotalTradeValue] = useState<number>(0);
  const [followedTraders, setFollowedTraders] = useState<number>(0);
  const [traderPerformance, setTraderPerformance] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const tradingViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize TradingView widget
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        ["BINANCE:BTCUSDT|1D"],
        ["BINANCE:ETHUSDT|1D"],
        ["BINANCE:SOLUSDT|1D"],
      ],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: "medium",
      gridLineColor: "rgba(242, 242, 242, 0.19)",
      backgroundColor: "rgba(15, 15, 15, 0)",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    });

    const container = document.getElementById("tradingview-widget-container");
    if (container) {
      // Clear any existing content
      container.innerHTML = "";
      // Create widget container
      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      container.appendChild(widgetContainer);
      // Add script
      container.appendChild(script);
    }

    async function fetchDashboardData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch account balance
        const { data: accountData } = await supabase
          .from("user_accounts")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (accountData) {
          setBalance(accountData.balance || 0);
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
      <div className="container mx-auto px-4 space-y-6 py-6">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Account Balance Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span>Account Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Available Balance
                </p>
                {loading ? (
                  <p className="text-2xl font-mono text-blue-400">Loading...</p>
                ) : (
                  <p className="text-2xl font-mono text-blue-400">
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
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-blue-400" />
                <span>AI Market Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="p-0 overflow-auto bg-black"
              style={{ maxHeight: "200px" }}
            >
              <div className="w-full h-full">
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between p-2 border border-gray-700 rounded-md hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold shadow-md">
                        ₿
                      </div>
                      <div>
                        <div className="font-medium text-sm">Bitcoin</div>
                        <div className="text-xs text-gray-400">BTC/USDT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-xs">AI Prediction</div>
                      <div className="text-xs text-green-500">Strong Buy</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 border border-gray-700 rounded-md hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        Ξ
                      </div>
                      <div>
                        <div className="font-medium text-sm">Ethereum</div>
                        <div className="text-xs text-gray-400">ETH/USDT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-xs">AI Prediction</div>
                      <div className="text-xs text-green-500">Buy</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 border border-gray-700 rounded-md hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        S
                      </div>
                      <div>
                        <div className="font-medium text-sm">Solana</div>
                        <div className="text-xs text-gray-400">SOL/USDT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-xs">AI Prediction</div>
                      <div className="text-xs text-yellow-500">Neutral</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Trades Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>Active Trades</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Active
                </p>
                {loading ? (
                  <p className="text-2xl font-mono text-blue-400">Loading...</p>
                ) : (
                  <p className="text-2xl font-mono text-blue-400">
                    {activeTrades}
                  </p>
                )}
                <div className="flex justify-between text-xs">
                  <span>Total Value:</span>
                  <span className="font-medium">
                    ${loading ? "--" : totalTradeValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Traders Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-blue-400" />
                <span>Copy Traders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Following
                </p>
                {loading ? (
                  <p className="text-2xl font-mono text-blue-400">Loading...</p>
                ) : (
                  <p className="text-2xl font-mono text-blue-400">
                    {followedTraders}
                  </p>
                )}
                <div className="flex justify-between text-xs">
                  <span>Performance:</span>
                  <span
                    className={
                      traderPerformance.includes("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {loading ? "--" : traderPerformance || "No data"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TradingView Crypto Pricing Widget */}
        <div className="mt-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span>Crypto Market Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: "400px" }}>
                <div
                  id="tradingview-widget-container"
                  className="w-full h-full"
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

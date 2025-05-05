import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  LineChart,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  HelpCircle,
  TrendingDown,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type AssetAllocation = {
  name: string;
  symbol: string;
  percentage: number;
  value: number;
  color: string;
};

type Trader = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  total_profit: number | null;
  win_rate: number | null;
  followers_count: number | null;
  days_trading?: number;
  capacity?: number;
  mock_copiers?: number;
  closed_portfolios?: number;
  roi?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  avg_trade_duration?: number;
  profit_factor?: number;
  risk_reward_ratio?: number;
  monthly_return?: number;
  yearly_return?: number;
  performance_data?: PerformanceDataPoint[];
  // Lead Trader Overview data
  copier_pnl?: number;
  aum?: number; // Assets Under Management
  profit_sharing?: number; // Percentage
  leading_margin_balance?: number;
  min_copy_amount?: number;
  // Asset allocation data
  asset_allocation?: AssetAllocation[];
};

type PerformanceDataPoint = {
  date: string;
  roi: number;
  pnl: number;
};

export default function TraderDetailPage() {
  const { traderId } = useParams<{ traderId: string }>();
  const navigate = useNavigate();
  const [trader, setTrader] = useState<Trader | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chartView, setChartView] = useState<"roi" | "pnl">("roi");
  const { toast } = useToast();

  useEffect(() => {
    if (traderId) {
      fetchTraderDetails(traderId);
      checkIfFollowing(traderId);
    }
  }, [traderId]);

  // Generate mock performance data for the chart
  function generateMockPerformanceData(): PerformanceDataPoint[] {
    const data: PerformanceDataPoint[] = [];
    const now = new Date();
    let cumulativeRoi = 0;
    let cumulativePnl = 0;

    // Generate data for the last 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random daily ROI between -1.5% and +2.5%
      const dailyRoiChange = (Math.random() * 4 - 1.5) / 100;
      cumulativeRoi += dailyRoiChange;

      // Random daily PnL between -$300 and +$500
      const dailyPnlChange = Math.random() * 800 - 300;
      cumulativePnl += dailyPnlChange;

      data.push({
        date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        roi: parseFloat((cumulativeRoi * 100).toFixed(2)), // Convert to percentage and round to 2 decimal places
        pnl: parseFloat(cumulativePnl.toFixed(2)), // Round to 2 decimal places
      });
    }

    return data;
  }

  async function fetchTraderDetails(id: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("traders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Enhance trader data with mock data for now
      const mockPerformanceData = generateMockPerformanceData();

      // Generate mock asset allocation data
      const mockAssetAllocation = [
        {
          name: "Bitcoin",
          symbol: "BTC",
          percentage: 45,
          value: 155250,
          color: "#F7931A",
        },
        {
          name: "Ethereum",
          symbol: "ETH",
          percentage: 30,
          value: 103500,
          color: "#627EEA",
        },
        {
          name: "Solana",
          symbol: "SOL",
          percentage: 15,
          value: 51750,
          color: "#00FFA3",
        },
        {
          name: "Cardano",
          symbol: "ADA",
          percentage: 5,
          value: 17250,
          color: "#0033AD",
        },
        {
          name: "Polkadot",
          symbol: "DOT",
          percentage: 5,
          value: 17250,
          color: "#E6007A",
        },
      ];

      const enhancedTrader = {
        ...data,
        days_trading: 120,
        capacity: 500,
        mock_copiers: 245,
        closed_portfolios: 32,
        roi: 28.5,
        sharpe_ratio: 1.8,
        max_drawdown: 12.3,
        avg_trade_duration: 3.2, // in days
        profit_factor: 2.4,
        risk_reward_ratio: 1.7,
        monthly_return: 4.2,
        yearly_return: 32.6,
        performance_data: mockPerformanceData,
        // Lead Trader Overview mock data
        copier_pnl: 12450.75,
        aum: 345000,
        profit_sharing: 20, // 20%
        leading_margin_balance: 50000,
        min_copy_amount: 1000,
        // Asset allocation mock data
        asset_allocation: mockAssetAllocation,
      };

      setTrader(enhancedTrader);
    } catch (error) {
      console.error("Error fetching trader details:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch trader details",
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkIfFollowing(traderId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("copy_trading_relationships")
        .select("*")
        .eq("user_id", user.id)
        .eq("trader_id", traderId)
        .eq("status", "active");

      if (error) throw error;
      setIsFollowing(data && data.length > 0);
    } catch (error) {
      console.error("Error checking if following:", error);
    }
  }

  async function handleCopyTrader() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please login to copy traders",
        });
        return;
      }

      if (!traderId) return;

      const { error } = await supabase
        .from("copy_trading_relationships")
        .upsert({
          user_id: user.id,
          trader_id: traderId,
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You are now copying this trader",
      });

      setIsFollowing(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  async function handleStopCopying() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !traderId) return;

      const { error } = await supabase
        .from("copy_trading_relationships")
        .update({ status: "stopped" })
        .eq("user_id", user.id)
        .eq("trader_id", traderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have stopped copying this trader",
      });

      setIsFollowing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-muted-foreground">
        Loading trader details...
      </div>
    );
  }

  if (error || !trader) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/copy-trading")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-red-500">Error: {error || "Trader not found"}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8 bg-background text-foreground">
      {/* Back button */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/copy-trading")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Copy Trading
        </Button>
      </div>

      {/* 1. Trader Profile Header */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trader.avatar_url || undefined} />
              <AvatarFallback>{trader.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{trader.name}</h1>
              <p className="text-muted-foreground mt-1">
                {trader.bio || "No bio available"}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Top Performer</Badge>
                <Badge variant="outline">High Win Rate</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
            {isFollowing ? (
              <Button variant="destructive" onClick={handleStopCopying}>
                Stop Copying
              </Button>
            ) : (
              <Button onClick={handleCopyTrader}>Copy Trader</Button>
            )}
            <Button variant="outline">Mock Copy</Button>
            <Button variant="ghost">Compare</Button>
          </div>
        </div>
      </div>

      {/* 2. Key Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{trader.days_trading}</div>
            <p className="text-sm text-muted-foreground">Days Trading</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {trader.followers_count || 0}/{trader.capacity}
            </div>
            <p className="text-sm text-muted-foreground">Copiers / Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{trader.mock_copiers}</div>
            <p className="text-sm text-muted-foreground">Mock Copiers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{trader.closed_portfolios}</div>
            <p className="text-sm text-muted-foreground">Closed Portfolios</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {/* ROI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      Return on Investment (ROI)
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Percentage return on investment since account
                          inception
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold text-green-500">
                    +{trader.roi}%
                  </span>
                </div>
                <Progress
                  value={Math.min(trader.roi || 0, 100)}
                  className="h-2"
                />
              </div>

              {/* Sharpe Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Sharpe Ratio</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Measures risk-adjusted return. Higher is better ({">"}
                          1 is good)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">{trader.sharpe_ratio}</span>
                </div>
                <Progress
                  value={Math.min((trader.sharpe_ratio || 0) * 33, 100)}
                  className="h-2"
                />
              </div>

              {/* Max Drawdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Maximum Drawdown</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Largest drop from peak to trough. Lower is better
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold text-red-500">
                    -{trader.max_drawdown}%
                  </span>
                </div>
                <Progress
                  value={Math.min(trader.max_drawdown || 0, 100)}
                  className="h-2"
                />
              </div>

              {/* Win Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Win Rate</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Percentage of trades that are profitable
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">
                    {(trader.win_rate || 0) * 100}%
                  </span>
                </div>
                <Progress
                  value={(trader.win_rate || 0) * 100}
                  className="h-2"
                />
              </div>

              {/* Profit Factor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Profit Factor</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Ratio of gross profit to gross loss. Higher is better
                          ({">"}1.5 is good)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">{trader.profit_factor}</span>
                </div>
                <Progress
                  value={Math.min((trader.profit_factor || 0) * 33, 100)}
                  className="h-2"
                />
              </div>

              {/* Risk/Reward Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Risk/Reward Ratio</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Average profit on winning trades vs average loss on
                          losing trades
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">
                    {trader.risk_reward_ratio}:1
                  </span>
                </div>
                <Progress
                  value={Math.min((trader.risk_reward_ratio || 0) * 33, 100)}
                  className="h-2"
                />
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Performance Chart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="chart-view"
                  checked={chartView === "pnl"}
                  onCheckedChange={(checked) =>
                    setChartView(checked ? "pnl" : "roi")
                  }
                />
                <Label htmlFor="chart-view">
                  {chartView === "roi" ? "ROI (%)" : "Profit & Loss ($)"}
                </Label>
              </div>
              <div className="text-sm text-muted-foreground">Last 30 days</div>
            </div>

            <div className="h-[300px] w-full">
              {trader?.performance_data &&
              trader.performance_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={trader.performance_data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        chartView === "roi" ? `${value}%` : `${value}`
                      }
                    />
                    <RechartsTooltip
                      formatter={(value, name) => {
                        return [
                          chartView === "roi" ? `${value}%` : `${value}`,
                          chartView === "roi" ? "ROI" : "P&L",
                        ];
                      }}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={chartView === "roi" ? "roi" : "pnl"}
                      name={
                        chartView === "roi"
                          ? "Return on Investment"
                          : "Profit & Loss"
                      }
                      stroke={chartView === "roi" ? "#10b981" : "#6366f1"}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No performance data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Trader Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {/* Copier PnL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Copier PnL</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Total profit and loss generated for copiers
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold text-green-500">
                    ${trader.copier_pnl?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* AUM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Assets Under Management</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Total value of assets being managed by this trader
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">
                    ${trader.aum?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Profit Sharing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Profit Sharing</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Percentage of profits shared with the trader
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">{trader.profit_sharing}%</span>
                </div>
              </div>

              {/* Leading Margin Balance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Leading Margin Balance</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Trader's own capital at risk
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">
                    ${trader.leading_margin_balance?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Minimum Copy Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Minimum Copy Amount</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">
                          Minimum amount required to copy this trader
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="font-bold">
                    ${trader.min_copy_amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trader.asset_allocation && trader.asset_allocation.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={trader.asset_allocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        nameKey="name"
                      >
                        {trader.asset_allocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name, props) => {
                          const entry = props.payload;
                          return [
                            `${value}% (${entry.value.toLocaleString()})`,
                            entry.name,
                          ];
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {trader.asset_allocation.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <span className="font-medium">
                          {asset.name} ({asset.symbol})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.percentage}%</span>
                        <span className="text-sm text-muted-foreground">
                          ${asset.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                No asset allocation data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

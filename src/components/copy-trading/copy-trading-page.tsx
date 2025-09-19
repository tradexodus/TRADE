import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LineChart, 
  TrendingUp, 
  Users, 
  ArrowLeft, 
  Star, 
  Copy, 
  ExternalLink,
  UserPlus,
  Activity,
  Award
} from "lucide-react";
import { ApplicationRequirementsDialog } from "./application-requirements-dialog";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Trader = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  total_profit: number;
  win_rate: number;
  followers_count: number;
};

export default function CopyTradingPage() {
  const navigate = useNavigate();
  console.log("Rendering CopyTradingPage");
  const [traders, setTraders] = useState<Trader[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followedTraders, setFollowedTraders] = useState<string[]>([]);
  const [showRequirementsDialog, setShowRequirementsDialog] = useState(false);
  const [userRequirements, setUserRequirements] = useState<{
    tradesCount: number;
    balance: number;
    isVerified: boolean;
  } | null>(null);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTraders();
    fetchFollowedTraders();
  }, []);

  async function fetchTraders() {
    try {
      const { data, error } = await supabase
        .from("traders")
        .select("*")
        .order("total_profit", { ascending: false });

      if (error) throw error;
      setTraders(data || []);
    } catch (error) {
      console.error("Error fetching traders:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch traders",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchFollowedTraders() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("copy_trading_relationships")
        .select("trader_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setFollowedTraders(data?.map((r) => r.trader_id) || []);
    } catch (error) {
      console.error("Error fetching followed traders:", error);
    }
  }

  async function handleCopyTrader(traderId: string) {
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

      setFollowedTraders((prev) => [...prev, traderId]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  async function handleStopCopying(traderId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

      setFollowedTraders((prev) => prev.filter((id) => id !== traderId));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  const handleApplyNowClick = async () => {
    setIsLoadingRequirements(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please login to apply as a trader",
        });
        return;
      }

      // Fetch user's trade count
      const { data: tradesData, error: tradesError } = await supabase
        .from("trading_history")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      if (tradesError) throw tradesError;

      // Fetch user's balance
      const { data: userData, error: userError } = await supabase
        .from("user_accounts")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Fetch user verification status from user_verifications table
      const { data: verificationData } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("id", user.id)
        .single();

      setUserRequirements({
        tradesCount: tradesData?.length || 0,
        balance: userData?.balance || 0,
        isVerified: verificationData?.status === "verified",
      });

      setShowRequirementsDialog(true);
    } catch (error: any) {
      console.error("Error fetching user requirements:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to check application eligibility",
      });
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  const handleSubmitApplication = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("trader_applications").insert({
      user_id: user.id,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="text-center text-red-700">Error: {error}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading traders...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Copy Trading</h1>
              <p className="text-sm text-muted-foreground">Follow and copy successful traders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Traders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{traders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Following
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{followedTraders.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Become a Trader Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Become a Lead Trader
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share your trading expertise and earn from followers copying your trades
            </p>
            <div className="space-y-3">
              {[
                "Earn commission from every follower's trade",
                "Build your reputation as a successful trader",
                "Access advanced analytics and insights",
                "Get featured on our top traders list"
              ].map((benefit, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{benefit}</p>
                </div>
              ))}
            </div>
            <Button 
              onClick={handleApplyNowClick}
              disabled={isLoadingRequirements}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoadingRequirements ? "Checking Requirements..." : "Apply Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="top-traders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="top-traders" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Top Traders</span>
            </TabsTrigger>
            <TabsTrigger value="my-copies" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>My Copies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-traders" className="mt-6">
            {traders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No traders available</p>
                    <p className="text-sm">Check back later for new traders to follow</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {traders.map((trader, index) => (
                  <Card key={trader.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Trader Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={trader.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {trader.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{trader.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{trader.followers_count} followers</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            #{index + 1}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Profit</p>
                            <p className="font-bold text-green-600">
                              ${trader.total_profit.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Win Rate</p>
                            <p className="font-bold text-blue-600">
                              {(trader.win_rate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Chart Placeholder */}
                        <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center">
                          <LineChart className="h-8 w-8 text-muted-foreground/50" />
                          <span className="ml-2 text-sm text-muted-foreground">Performance Chart</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/copy-trading/${trader.id}`);
                            }}
                          >
                            View Details
                          </Button>
                          {followedTraders.includes(trader.id) ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopCopying(trader.id);
                              }}
                            >
                              Stop Copying
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTrader(trader.id);
                              }}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Trader
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-copies" className="mt-6">
            {followedTraders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No traders copied yet</p>
                    <p className="text-sm">Start following traders to see them here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {traders
                  .filter((trader) => followedTraders.includes(trader.id))
                  .map((trader, index) => (
                    <Card key={trader.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Trader Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={trader.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {trader.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{trader.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{trader.followers_count} followers</span>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                              Following
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">Total Profit</p>
                              <p className="font-bold text-green-600">
                                ${trader.total_profit.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">Win Rate</p>
                              <p className="font-bold text-blue-600">
                                {(trader.win_rate * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Chart Placeholder */}
                          <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center">
                            <LineChart className="h-8 w-8 text-muted-foreground/50" />
                            <span className="ml-2 text-sm text-muted-foreground">Performance Chart</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/copy-trading/${trader.id}`);
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopCopying(trader.id);
                              }}
                            >
                              Stop Copying
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-4">
          <Separator />
          <div className="text-sm text-muted-foreground flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              to="/terms"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Terms of Service</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/privacy"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/legal"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Legal Notice</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Copy trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>

      <ApplicationRequirementsDialog
        open={showRequirementsDialog}
        onOpenChange={setShowRequirementsDialog}
        userRequirements={userRequirements}
        onSubmitApplication={handleSubmitApplication}
      />
    </div>
  );
}
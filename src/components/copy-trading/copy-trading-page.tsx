import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, TrendingUp, Users } from "lucide-react";
import { ApplicationRequirementsDialog } from "./application-requirements-dialog";
import { useNavigate } from "react-router-dom";

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

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading traders...</div>;
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

  return (
    <div className="container mx-auto space-y-8 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Copy Trading</h1>
      </div>

      <div className="">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Be a Futures Lead Trader</h2>
            <p className="text-muted-foreground">
              Share your trading expertise and earn from followers copying your
              trades
            </p>
          </div>
          <Button
            onClick={handleApplyNowClick}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Apply Now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="top-traders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top-traders" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Traders
          </TabsTrigger>
          <TabsTrigger value="my-copies" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Copies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-traders" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {traders.map((trader) => (
              <Card
                key={trader.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/copy-trading/${trader.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={trader.avatar_url} />
                      <AvatarFallback>{trader.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{trader.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {trader.followers_count} followers
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Profit</span>
                      <span className="font-medium text-green-500">
                        ${trader.total_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Win Rate</span>
                      <span className="font-medium">
                        {(trader.win_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-[100px] w-full">
                    <LineChart className="h-full w-full text-muted-foreground/30" />
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {followedTraders.includes(trader.id) ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleStopCopying(trader.id)}
                      >
                        Stop Copying
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleCopyTrader(trader.id)}
                      >
                        Copy Trader
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-copies" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {traders
              .filter((trader) => followedTraders.includes(trader.id))
              .map((trader) => (
                <Card
                  key={trader.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => navigate(`/copy-trading/${trader.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={trader.avatar_url} />
                        <AvatarFallback>{trader.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{trader.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {trader.followers_count} followers
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Profit</span>
                        <span className="font-medium text-green-500">
                          ${trader.total_profit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Win Rate</span>
                        <span className="font-medium">
                          {(trader.win_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-[100px] w-full">
                      <LineChart className="h-full w-full text-muted-foreground/30" />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleStopCopying(trader.id)}
                      >
                        Stop Copying
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
      <ApplicationRequirementsDialog
        open={showRequirementsDialog}
        onOpenChange={setShowRequirementsDialog}
        userRequirements={userRequirements}
        onSubmitApplication={handleSubmitApplication}
      />
    </div>
  );
}

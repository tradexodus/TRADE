import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingViewAdvancedChart } from "@/components/dashboard/trading-view-advanced-chart";
import { AiMarketAnalysisCard } from "@/components/dashboard/AiMarketAnalysisCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  User,
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

type UserAccount = {
  account_id: number;
  balance: number;
  profit?: number;
};

type UserProfile = {
  name?: string;
  email?: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate("/login");
        return;
      }

      const user = session.user;

      setProfile({
        name: user.user_metadata?.name || "User",
        email: user.email,
      });

      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      if (accountError) {
        console.error("Error fetching account:", accountError);
        return;
      }

      setAccount(accountData);
      setLoading(false);
    }

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Hamburger Menu */}
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <img
            src="/images/tempo-image-20250222T194809206Z.png"
            alt="Exodus Trade©"
            className="h-8"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="/images/tempo-image-20250222T194809206Z.png"
                    alt="Exodus Trade©"
                    className="h-8"
                  />
                </div>
                <SheetTitle className="text-lg font-bold">
                  {profile?.name || "User"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-sm font-medium">
                  Account ID: {account?.account_id}
                </p>
              </SheetHeader>
              <Separator className="my-4" />
              <nav className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/account")}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0052CC]" />
                    Account
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/dashboard")}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-[#0052CC]" />
                    Dashboard
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/copy-trading")}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0052CC]" />
                    Copy Trading
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Follow top traders
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/deposit")}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownToLine className="h-4 w-4 text-[#0052CC]" />
                    Deposit
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/withdrawal")}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-[#0052CC]" />
                    Withdrawal
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/history")}
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#0052CC]" />
                    Transaction History
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl"
                  onClick={() => navigate("/settings")}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#0052CC]" />
                    Settings
                  </div>
                </Button>
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="justify-between rounded-xl text-red-500"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </div>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 space-y-6">
        <BalanceCard
          accountId={account?.account_id?.toString()}
          balance={account?.balance || null}
          profit={account?.profit || null}
          loading={loading}
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <TradingViewAdvancedChart
                symbol="NASDAQ:AAPL"
                height={500}
                theme="dark"
                allowSymbolChange={true}
              />
            </div>
          </CardContent>
        </Card>

        <AiMarketAnalysisCard />
      </main>
    </div>
  );
}

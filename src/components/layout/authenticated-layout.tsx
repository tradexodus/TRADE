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
  BrainCircuit,
  Users,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type UserProfile = {
  name?: string;
  email?: string;
  account_id?: string;
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile({
        name: user.user_metadata?.name || "User",
        email: user.email,
        account_id: accountData?.account_id,
      });
      setLoading(false);
    }

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex flex-col w-[270px] border-r bg-gradient-to-r from-blue-900/30 to-blue-800/10 p-0 shadow-lg backdrop-blur-sm">
        <div className="p-6 border-b border-blue-700/20 bg-blue-900/20 backdrop-filter backdrop-blur-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-wide">neurotrade</h2>
            <p className="text-sm text-white/90">{profile?.email}</p>
            <p className="text-sm text-white/60">
              Account ID: {loading ? "Loading..." : profile?.account_id}
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-3 p-4 flex-1">
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/account")}
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-400" />
              Account
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/dashboard")}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-blue-400" />
              Dashboard
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/ai-trader")}
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-blue-400" />
              AI Trader
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/copy-trading")}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              Copy Trading
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/deposit")}
          >
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="h-5 w-5 text-blue-400" />
              Deposit
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/withdrawal")}
          >
            <div className="flex items-center gap-3">
              <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
              Withdrawal
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/history")}
          >
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-blue-400" />
              Transaction History
            </div>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => navigate("/settings")}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-400" />
              Settings
            </div>
          </Button>
          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:translate-x-1 mt-2 border-t border-blue-800/30 pt-5"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                Log out
              </div>
            </Button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header with Hamburger Menu (mobile only) */}
        <header className="border-b md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              className="p-0"
              onClick={() => navigate("/dashboard")}
            >
              <img
                src="/images/tempo-image-20250222T194809206Z.png"
                alt="NeuroTrade"
                className="h-8"
              />
            </Button>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 bg-gradient-to-r from-blue-900/30 to-blue-800/10 p-0"
                >
                  <SheetHeader className="p-6 border-b border-blue-700/20 bg-blue-900/20">
                    <div className="space-y-1">
                      <SheetTitle className="text-xl font-bold tracking-wide">
                        neurotrade
                      </SheetTitle>
                      <p className="text-sm text-white/90">{profile?.email}</p>
                      <p className="text-sm text-white/60">
                        Account ID:{" "}
                        {loading ? "Loading..." : profile?.account_id}
                      </p>
                    </div>
                  </SheetHeader>
                  <nav className="flex flex-col gap-3 p-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/account")}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-blue-400" />
                        Account
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/dashboard")}
                    >
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5 text-blue-400" />
                        Dashboard
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/ai-trader")}
                    >
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="h-5 w-5 text-blue-400" />
                        AI Trader
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/copy-trading")}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-400" />
                        Copy Trading
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/deposit")}
                    >
                      <div className="flex items-center gap-3">
                        <ArrowDownToLine className="h-5 w-5 text-blue-400" />
                        Deposit
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/withdrawal")}
                    >
                      <div className="flex items-center gap-3">
                        <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
                        Withdrawal
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/history")}
                    >
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-blue-400" />
                        Transaction History
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-200 hover:translate-x-1"
                      onClick={() => navigate("/settings")}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-blue-400" />
                        Settings
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:translate-x-1 mt-2 border-t border-blue-800/30 pt-5"
                      onClick={handleSignOut}
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5" />
                        Log out
                      </div>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-background">
      {/* Header with Hamburger Menu */}
      <header className="border-b">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-black p-0">
              <SheetHeader className="p-6 border-b border-white/10">
                <div className="space-y-1">
                  <SheetTitle className="text-lg font-bold">
                    neurotrade
                  </SheetTitle>
                  <p className="text-sm text-white/90">{profile?.email}</p>
                  <p className="text-sm text-white/60">
                    Account ID: {loading ? "Loading..." : profile?.account_id}
                  </p>
                </div>
              </SheetHeader>
              <nav>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/account")}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/dashboard")}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/ai-trader")}
                >
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    AI Trader
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/copy-trading")}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Copy Trading
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/deposit")}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownToLine className="h-4 w-4" />
                    Deposit
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/withdrawal")}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4" />
                    Withdrawal
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/history")}
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Transaction History
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => navigate("/settings")}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-3 text-red-500 hover:text-red-400 hover:bg-white/10"
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
      <main className="p-6">{children}</main>
    </div>
  );
}

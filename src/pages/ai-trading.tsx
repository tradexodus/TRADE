import { Suspense, lazy, useState, useEffect } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { supabase } from "@/lib/supabase";

const AccountInfo = lazy(() => import("@/components/ai-trading/AccountInfo"));
const ManualTrading = lazy(
  () => import("@/components/ai-trading/ManualTrading"),
);
const AutoTrading = lazy(() => import("@/components/ai-trading/AutoTrading"));
const TradeHistory = lazy(() => import("@/components/ai-trading/TradeHistory"));

export default function AiTrading() {
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

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6 py-4 sm:py-6">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            AI Trading
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Suspense
            fallback={
              <div className="h-32 bg-muted rounded-md animate-pulse"></div>
            }
          >
            <AccountInfo />
          </Suspense>

          <div className="grid gap-4 grid-rows-2">
            <Suspense
              fallback={
                <div className="h-32 bg-muted rounded-md animate-pulse"></div>
              }
            >
              <ManualTrading
                balance={userData.balance}
                onTradeComplete={handleTradeComplete}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="h-32 bg-muted rounded-md animate-pulse"></div>
              }
            >
              <AutoTrading
                balance={userData.balance}
                userId={userData.userId}
                onTradeComplete={handleTradeComplete}
              />
            </Suspense>
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

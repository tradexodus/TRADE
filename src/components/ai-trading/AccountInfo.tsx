import { useEffect, useState } from "react";
import { ArrowUpDown, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

type UserAccount = {
  balance: number;
  profit: number;
  account_id: number;
};

export function MobileAccountInfo() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("user_accounts")
          .select("balance, profit, account_id")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching account data:", error);
          return;
        }

        setAccount(data);
      } catch (error) {
        console.error("Error in fetchAccountData:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();

    // Set up a subscription to listen for changes to the user's account
    const channel = supabase
      .channel("account_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_accounts",
          filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`,
        },
        (payload) => {
          setAccount(payload.new as UserAccount);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mobile version to be positioned in the top right
  if (loading) {
    return (
      <div className="md:hidden flex items-center gap-2 animate-pulse">
        <div className="h-6 w-16 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="md:hidden flex items-center gap-3">
      <div className="text-left">
        <div className="text-xs text-muted-foreground">Balance :</div>
        <div className="text-sm font-mono font-medium text-blue-400">
          ${account?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>
      <div className="text-left">
        <div className="text-xs text-muted-foreground">Profit :</div>
        <div className="text-sm font-mono font-medium text-green-500">
          ${account?.profit?.toFixed(2) || "0.00"}
        </div>
      </div>
    </div>
  );
}

export default function AccountInfo() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("user_accounts")
          .select("balance, profit, account_id")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching account data:", error);
          return;
        }

        setAccount(data);
      } catch (error) {
        console.error("Error in fetchAccountData:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();

    // Set up a subscription to listen for changes to the user's account
    const channel = supabase
      .channel("account_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_accounts",
          filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`,
        },
        (payload) => {
          setAccount(payload.new as UserAccount);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Desktop version remains unchanged
  return (
    <div className="hidden md:block bg-background rounded-lg overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3 px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span>Account Information</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Balance
              </p>
              <p className="text-2xl font-mono text-blue-400">
                ${account?.balance?.toFixed(2) || "0.00"}
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <span>Updated just now</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Profit
              </p>
              <p className="text-2xl font-mono text-green-500">
                ${account?.profit?.toFixed(2) || "0.00"}
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Cumulative gains</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

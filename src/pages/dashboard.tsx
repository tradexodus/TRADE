import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserAccount = {
  account_id: number;
  balance: number;
  profit?: number;
};

export default function Dashboard() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccountData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("id", user.id)
        .single();

      if (accountData) {
        setAccount(accountData);
      }
      setLoading(false);
    }

    fetchAccountData();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 pb-8">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              <span>Account Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account ID
                </p>
                <p className="text-2xl font-mono mt-1">
                  {loading ? "Loading..." : account?.account_id || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Balance
                </p>
                <p className="text-2xl font-mono mt-1 text-blue-400">
                  ${loading ? "Loading..." : (account?.balance || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Profit
                </p>
                <p className="text-2xl font-mono mt-1 text-green-500">
                  $
                  {loading
                    ? "Loading..."
                    : ((account?.profit || 0) > 0 ? "+" : "") +
                      (account?.profit || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

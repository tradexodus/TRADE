import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserAccount = {
  account_id: number;
  balance: number;
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono">
                {loading ? "Loading..." : account?.account_id || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono">
                ${loading ? "Loading..." : (account?.balance || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

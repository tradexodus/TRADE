import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowUpDown, User } from "lucide-react";
import { getNeuronLevel } from "@/lib/neuron-levels";

interface BalanceCardProps {
  accountId?: string;
  balance: number | null;
  profit: number | null;
  loading: boolean;
}

export function BalanceCard({
  accountId,
  balance,
  profit,
  loading,
}: BalanceCardProps) {
  return (
    <Card className="w-[600px] overflow-hidden border-0 shadow-lg h-full">
      <CardHeader className=" from-blue-900/30 to-blue-800/10 py-2 sm:py-2">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
          <span>Account Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {/* Left column - Balance information */}
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Available Balance
            </p>
            {loading ? (
              <p className="text-xl sm:text-2xl font-mono text-blue-400">
                Loading...
              </p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-mono text-blue-400">
                  ${balance?.toFixed(2) || "0.00"}
                </p>
                <p className="text-sm font-mono text-green-500">
                  Profit: ${profit?.toFixed(2) || "0.00"}
                </p>
                <div className="flex gap-2 mt-2">
                  <a
                    href="/deposit"
                    className="inline-flex items-center justify-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/30 hover:bg-blue-500/30 transition-colors"
                  >
                    <Wallet className="h-3 w-3 mr-1" />
                    Deposit
                  </a>
                  <a
                    href="/withdrawal"
                    className="inline-flex items-center justify-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/30 hover:bg-blue-500/30 transition-colors"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Withdraw
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Right column - Account information */}
          <div className="space-y-3">
            {/* Account ID */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Account ID</span>
              <span className="text-sm font-mono truncate">
                {loading ? "Loading..." : accountId || "Not available"}
              </span>
            </div>

            {/* Neuron Level Progress */}
            {balance !== null && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Neuron Level
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: getNeuronLevel(balance).color }}
                  >
                    {getNeuronLevel(balance).name}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{
                    backgroundColor: `${getNeuronLevel(balance).bgColor}50`,
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${getNeuronLevel(balance).progressPercentage}%`,
                      backgroundColor: getNeuronLevel(balance).color,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{getNeuronLevel(balance).progressPercentage}%</span>
                </div>
              </div>
            )}

            {/* Account Status */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-400"></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Wallet } from "lucide-react";
import { WithdrawalPasswordDialog } from "./withdrawal-password-dialog";

export default function WithdrawalPage() {
  const [withdrawalType, setWithdrawalType] = useState<"profit" | "balance">(
    "profit",
  );
  const [amount, setAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userProfit, setUserProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [hasWithdrawalPassword, setHasWithdrawalPassword] =
    useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Fetch user account data
        const { data: accountData, error: accountError } = await supabase
          .from("user_accounts")
          .select("balance, profit")
          .eq("id", user.id)
          .single();

        if (accountError) throw accountError;

        if (accountData) {
          setUserBalance(accountData.balance || 0);
          setUserProfit(accountData.profit || 0);
        }

        // Check if user is verified
        const { data: verificationData, error: verificationError } =
          await supabase
            .from("user_verifications")
            .select("status")
            .eq("id", user.id)
            .single();

        if (!verificationError && verificationData) {
          setIsVerified(verificationData.status === "verified");
        }

        // Check if user has a withdrawal password set
        const { data: securitySettings, error: securityError } = await supabase
          .from("user_security_settings")
          .select("withdrawal_password")
          .eq("id", user.id)
          .single();

        if (!securityError && securitySettings) {
          setHasWithdrawalPassword(!!securitySettings.withdrawal_password);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load account information",
        });
      }
    }

    fetchUserData();
  }, [toast]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmount(value);
    }
  };

  const validateWithdrawal = () => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Invalid Wallet Address",
        description: "Please enter a valid TRC20 wallet address",
      });
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
      });
      return false;
    }

    const amountValue = parseFloat(amount);

    if (withdrawalType === "profit" && amountValue > userProfit) {
      toast({
        variant: "destructive",
        title: "Insufficient Profit",
        description: "You cannot withdraw more than your available profit",
      });
      return false;
    }

    if (withdrawalType === "balance" && amountValue > userBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You cannot withdraw more than your available balance",
      });
      return false;
    }

    if (!isVerified) {
      toast({
        variant: "destructive",
        title: "Account Not Verified",
        description:
          "You need to verify your account before making withdrawals",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateWithdrawal()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmWithdrawal = () => {
    if (hasWithdrawalPassword) {
      // If user has a withdrawal password, show password dialog
      setShowPasswordDialog(true);
    } else {
      // If no withdrawal password is set, proceed with withdrawal
      processWithdrawal();
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Verify the withdrawal password
      const { data: securitySettings, error } = await supabase
        .from("user_security_settings")
        .select("withdrawal_password")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (securitySettings?.withdrawal_password !== password) {
        toast({
          variant: "destructive",
          title: "Incorrect Password",
          description: "The withdrawal password you entered is incorrect.",
        });
        setIsLoading(false);
        return;
      }

      // Password is correct, proceed with withdrawal
      await processWithdrawal();
    } catch (error: any) {
      console.error("Error verifying withdrawal password:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to verify withdrawal password",
      });
      setIsLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setShowConfirmDialog(false);
  };

  const processWithdrawal = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const amountValue = parseFloat(amount);
      let fromBalance = 0;
      let fromProfit = 0;

      if (withdrawalType === "profit") {
        fromProfit = amountValue;
      } else {
        // For balance withdrawal, we take directly from balance
        fromBalance = amountValue;
      }

      // Create withdrawal record
      const { data, error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: amountValue,
        wallet_address: walletAddress,
        status: "pending",
        from_balance: fromBalance,
        from_profit: fromProfit,
      });

      if (error) throw error;

      // No longer updating user account balance immediately
      // Balance and profit will only be updated after withdrawal approval

      toast({
        title: "Withdrawal Request Submitted",
        description:
          "Your withdrawal request has been submitted and is being processed",
      });

      // Reset form
      setAmount("");
      setWalletAddress("");

      // Refresh user data
      const { data: accountData } = await supabase
        .from("user_accounts")
        .select("balance, profit")
        .eq("id", user.id)
        .single();

      if (accountData) {
        setUserBalance(accountData.balance || 0);
        setUserProfit(accountData.profit || 0);
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal request",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setShowPasswordDialog(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-2 sm:px-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Withdraw Funds</h1>
          <p className="text-muted-foreground">
            Withdraw your funds to your TRC20 wallet
          </p>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-card/80 p-4 sm:p-6 rounded-xl shadow-sm border-0 w-full">
            <h3 className="text-lg font-medium mb-2 text-muted-foreground">
              Available Balance
            </h3>
            <p className="text-3xl font-bold">${userBalance.toFixed(2)}</p>
          </div>
          <div className="bg-card/80 p-4 sm:p-6 rounded-xl shadow-sm border-0 w-full">
            <h3 className="text-lg font-medium mb-2 text-muted-foreground">
              Available Profit
            </h3>
            <p className="text-3xl font-bold">${userProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* Withdrawal Type Selection */}
        <div className="bg-card/80 p-4 sm:p-6 rounded-xl shadow-sm border-0 w-full">
          <h3 className="text-xl font-medium mb-4 text-muted-foreground">
            Withdrawal Type
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={withdrawalType === "profit" ? "default" : "secondary"}
              className={`flex-1 h-16 rounded-xl transition-all ${withdrawalType === "profit" ? "shadow-md" : "shadow-none"}`}
              onClick={() => setWithdrawalType("profit")}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-medium">Profit Withdrawal</span>
                <span className="text-xs text-muted-foreground">
                  Withdraw only from your trading profits
                </span>
              </div>
            </Button>
            <Button
              variant={withdrawalType === "balance" ? "default" : "secondary"}
              className={`flex-1 h-16 rounded-xl transition-all ${withdrawalType === "balance" ? "shadow-md" : "shadow-none"}`}
              onClick={() => setWithdrawalType("balance")}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-medium">Balance Withdrawal</span>
                <span className="text-xs text-muted-foreground">
                  Withdraw from your total account balance
                </span>
              </div>
            </Button>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-card/80 p-4 sm:p-6 rounded-xl shadow-sm border-0 w-full">
          <h3 className="text-xl font-medium mb-4 text-muted-foreground">
            Withdrawal Details
          </h3>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium mb-2 text-muted-foreground"
              >
                Amount to Withdraw ($)
              </label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                className="w-full bg-background/50 border-muted rounded-lg h-12"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Maximum: $
                {withdrawalType === "profit"
                  ? userProfit.toFixed(2)
                  : userBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <label
                htmlFor="wallet"
                className="block text-sm font-medium mb-2 text-muted-foreground"
              >
                TRC20 Wallet Address
              </label>
              <Input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your TRC20 wallet address"
                className="w-full bg-background/50 border-muted rounded-lg h-12"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !isVerified || !hasWithdrawalPassword}
                className="w-full h-12 rounded-lg shadow-md"
              >
                {isLoading ? "Processing..." : "Request Withdrawal"}
              </Button>
              {!isVerified && (
                <p className="text-sm text-destructive/90 mt-3 px-2">
                  You need to verify your account before making withdrawals.
                  Please visit the Account page.
                </p>
              )}
              {!hasWithdrawalPassword && (
                <p className="text-sm text-destructive/90 mt-3 px-2">
                  You need to set a withdrawal password before making
                  withdrawals. Please visit the Settings page to set up your
                  withdrawal password.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-secondary/50 p-4 sm:p-6 rounded-lg border border-border w-full">
          <div className="flex items-start gap-4">
            <Wallet className="h-6 w-6 text-primary mt-1" />
            <div>
              <h4 className="text-lg font-medium mb-2">
                Important Information
              </h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Withdrawals are typically processed within 24-48 hours</li>
                <li>Minimum withdrawal amount is $50</li>
                <li>
                  Make sure your wallet address is correct - incorrect addresses
                  may result in permanent loss of funds
                </li>
                <li>
                  For security reasons, withdrawals to new wallet addresses may
                  require additional verification
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to withdraw ${amount} from your{" "}
              {withdrawalType === "profit" ? "profits" : "balance"} to the
              following wallet address:
              <div className="mt-2 p-2 bg-secondary rounded-md overflow-x-auto">
                <code className="text-xs">{walletAddress}</code>
              </div>
              <p className="mt-2">
                Please verify this information is correct before proceeding.
              </p>
              {hasWithdrawalPassword && (
                <p className="mt-2 text-sm font-medium text-amber-500">
                  You will need to enter your withdrawal password to complete
                  this transaction.
                </p>
              )}
              {!hasWithdrawalPassword && (
                <p className="mt-2 text-sm font-medium text-amber-500">
                  For added security, consider setting a withdrawal password in
                  your account settings.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmWithdrawal}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm Withdrawal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdrawal Password Dialog */}
      <WithdrawalPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        isLoading={isLoading}
      />
    </div>
  );
}

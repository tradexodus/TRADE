import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink, Wallet, AlertTriangle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  const navigate = useNavigate();
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
      setShowPasswordDialog(true);
    } else {
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

      navigate("/dashboard");
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

  const maxAmount = withdrawalType === "profit" ? userProfit : userBalance;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Withdraw Funds</h1>
              <p className="text-sm text-muted-foreground">Request a withdrawal from your account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Account Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${userBalance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Available Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${userProfit.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant={withdrawalType === "profit" ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => setWithdrawalType("profit")}
              >
                <div className="text-left">
                  <div className="font-medium">Profit Withdrawal</div>
                  <div className="text-xs text-muted-foreground">
                    Withdraw only from your trading profits
                  </div>
                </div>
              </Button>
              <Button
                variant={withdrawalType === "balance" ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => setWithdrawalType("balance")}
              >
                <div className="text-left">
                  <div className="font-medium">Balance Withdrawal</div>
                  <div className="text-xs text-muted-foreground">
                    Withdraw from your total account balance
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Minimum $50"
                className="text-lg"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum: $50</span>
                <span>Maximum: ${maxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">TRC20 Wallet Address</Label>
              <Input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your TRC20 wallet address"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Only TRC20 USDT addresses are supported
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Warnings */}
        {(!isVerified || !hasWithdrawalPassword) && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  {!isVerified && (
                    <p className="text-sm text-amber-700">
                      <strong>Account verification required:</strong> You need to verify your account before making withdrawals. Visit the Account page to complete verification.
                    </p>
                  )}
                  {!hasWithdrawalPassword && (
                    <p className="text-sm text-amber-700">
                      <strong>Withdrawal password required:</strong> Set up a withdrawal password in Settings for enhanced security.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !isVerified || !hasWithdrawalPassword}
          className="w-full h-12 text-base font-medium"
        >
          {isLoading ? "Processing..." : "Request Withdrawal"}
        </Button>

        {/* Important Information */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Withdrawals are processed within 24-48 hours",
                "Minimum withdrawal amount is $50",
                "Double-check your wallet address - incorrect addresses may result in permanent loss",
                "New wallet addresses may require additional verification",
                "All withdrawals are sent as USDT via TRC20 network"
              ].map((info, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{info}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-4">
          <Separator />
          <div className="text-sm text-muted-foreground flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              to="/terms"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Terms of Service</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/privacy"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              to="/legal"
              className="flex items-center hover:text-primary transition-colors"
            >
              <span>Legal Notice</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            By using our withdrawal service, you agree to our terms and conditions.
          </p>
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

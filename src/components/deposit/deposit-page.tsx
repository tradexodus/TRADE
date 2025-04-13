import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNeuronLevel } from "@/lib/neuron-levels";
import { Separator } from "@/components/ui/separator";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [walletAddress, setWalletAddress] = useState("iorefunwe9032rf");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWalletAddress() {
      const { data } = await supabase
        .from("wallet_settings")
        .select("wallet_address")
        .single();
      if (data) {
        setWalletAddress(data.wallet_address);
      }
    }
    fetchWalletAddress();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let screenshotUrl = "";
      if (screenshot) {
        const { data, error: uploadError } = await supabase.storage
          .from("deposit-screenshots")
          .upload(`${user.id}/${Date.now()}-${screenshot.name}`, screenshot, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;
        screenshotUrl = data.path;
      }

      const depositAmount = parseFloat(amount);

      // Insert the deposit record - neuron level will be updated only after approval
      const { error } = await supabase.from("deposits").insert([
        {
          user_id: user.id,
          amount: depositAmount,
          status: "pending",
          screenshot_url: screenshotUrl,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Deposit request submitted",
        description: "Your deposit request is being processed.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Deposit USDT</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>USDT Wallet Address (TRC20)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input value={walletAddress} readOnly />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  toast({
                    title: "Copied!",
                    description: "Wallet address copied to clipboard",
                  });
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (USDT)</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction Screenshot</Label>
                <Input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Copy the USDT wallet address above (TRC20 network)</li>
                <li>Send USDT from your wallet to this address</li>
                <li>Take a screenshot of the successful transaction</li>
                <li>Enter the amount and upload the screenshot</li>
                <li>Submit the deposit request</li>
                <li>Wait for approval (usually within 24 hours)</li>
              </ol>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Confirm Deposit"}
          </Button>
        </form>
      </div>

      {/* Partnership Logos */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Supported Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            <div className="flex flex-col items-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png"
                alt="Mastercard"
                className="h-12 object-contain"
              />
              <span className="text-xs text-muted-foreground mt-1">
                Mastercard
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png"
                alt="Visa"
                className="h-12 object-contain"
              />
              <span className="text-xs text-muted-foreground mt-1">Visa</span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                alt="Tether"
                className="h-12 object-contain"
              />
              <span className="text-xs text-muted-foreground mt-1">Tether</span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png"
                alt="PayPal"
                className="h-12 object-contain"
              />
              <span className="text-xs text-muted-foreground mt-1">PayPal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies and Terms */}
      <div className="mt-8 text-center space-y-4">
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
          By using our deposit service, you agree to our terms and conditions.
        </p>
      </div>
    </div>
  );
}

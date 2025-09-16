import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCircle,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNeuronLevel } from "@/lib/neuron-levels";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { TRC20Icon, BEP20Icon, ERC20Icon } from "@/components/ui/network-icons";

const NETWORKS = [
  {
    id: "trc20",
    name: "TRC20",
    icon: TRC20Icon,
    description: "Tron Network - Low fees",
    address: "TRC20WalletAddressDefault123456789",
  },
  {
    id: "bep20",
    name: "BEP20",
    icon: BEP20Icon,
    description: "BSC Network - Fast transactions",
    address: "0xBEP20WalletAddressDefault123456789",
  },
  {
    id: "erc20",
    name: "ERC20",
    icon: ERC20Icon,
    description: "Ethereum Network - Most secure",
    address: "0xERC20WalletAddressDefault123456789",
  },
];

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [walletAddresses, setWalletAddresses] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWalletAddresses() {
      try {
        // Try to get the wallet addresses for all networks
        const { data, error } = await supabase
          .from("wallet_settings")
          .select("*")
          .single();

        if (error) {
          console.error("Error fetching wallet addresses:", error);

          // Create default wallet addresses for all networks
          const defaultAddresses = {
            trc20_address: NETWORKS[0].address,
            bep20_address: NETWORKS[1].address,
            erc20_address: NETWORKS[2].address,
          };

          const { data: insertData, error: insertError } = await supabase
            .from("wallet_settings")
            .insert([defaultAddresses])
            .select("*")
            .single();

          if (insertError) {
            console.error(
              "Error creating default wallet addresses:",
              insertError,
            );
            // Use hardcoded defaults as fallback
            setWalletAddresses({
              trc20: NETWORKS[0].address,
              bep20: NETWORKS[1].address,
              erc20: NETWORKS[2].address,
            });
          } else if (insertData) {
            setWalletAddresses({
              trc20: insertData.trc20_address || NETWORKS[0].address,
              bep20: insertData.bep20_address || NETWORKS[1].address,
              erc20: insertData.erc20_address || NETWORKS[2].address,
            });
          }
        } else if (data) {
          setWalletAddresses({
            trc20: data.trc20_address || NETWORKS[0].address,
            bep20: data.bep20_address || NETWORKS[1].address,
            erc20: data.erc20_address || NETWORKS[2].address,
          });
        }
      } catch (err) {
        console.error("Unexpected error in fetchWalletAddresses:", err);
        // Use hardcoded defaults as ultimate fallback
        setWalletAddresses({
          trc20: NETWORKS[0].address,
          bep20: NETWORKS[1].address,
          erc20: NETWORKS[2].address,
        });
      }
    }
    fetchWalletAddresses();
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

      // Insert the deposit record with network information
      const { error } = await supabase.from("deposits").insert([
        {
          user_id: user.id,
          amount: depositAmount,
          status: "pending",
          screenshot_url: screenshotUrl,
          network: selectedNetwork.id,
          wallet_address: walletAddresses[selectedNetwork.id],
        },
      ]);

      if (error) throw error;

      toast({
        title: "Deposit request submitted",
        description: `Your ${selectedNetwork.name} deposit request is being processed.`,
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

  const handleCopyAddress = () => {
    const address =
      walletAddresses[selectedNetwork.id] || selectedNetwork.address;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAddress =
    walletAddresses[selectedNetwork.id] || selectedNetwork.address;

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
              <h1 className="text-xl font-semibold">Deposit USDT</h1>
              <p className="text-sm text-muted-foreground">
                Add funds to your account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Network Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Network</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <selectedNetwork.icon className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">{selectedNetwork.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedNetwork.description}
                      </p>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandEmpty>No network found.</CommandEmpty>
                    <CommandGroup>
                      {NETWORKS.map((network) => (
                        <CommandItem
                          key={network.id}
                          value={network.id}
                          onSelect={(currentValue) => {
                            const selected = NETWORKS.find(
                              (n) => n.id === currentValue,
                            );
                            if (selected) {
                              setSelectedNetwork(selected);
                            }
                            setOpen(false);
                          }}
                          className="flex items-center gap-3 p-3"
                        >
                          <network.icon className="h-8 w-8" />
                          <div className="flex-1">
                            <p className="font-medium">{network.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {network.description}
                            </p>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedNetwork.id === network.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Wallet Address Card */}
        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              USDT Wallet Address ({selectedNetwork.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={currentAddress}
                readOnly
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                onClick={handleCopyAddress}
                variant="outline"
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Only send USDT via {selectedNetwork.name} network to this address
            </p>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deposit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum 1 USDT"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum deposit: 1 USDT
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Transaction Screenshot</Label>
                <Input
                  id="screenshot"
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear screenshot of your transaction
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">How to Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  `Select your preferred network (${selectedNetwork.name})`,
                  "Copy the USDT wallet address above",
                  `Send USDT from your wallet (${selectedNetwork.name} network only)`,
                  "Take a screenshot of the successful transaction",
                  "Enter the amount and upload the screenshot",
                  "Submit and wait for approval (within 24 hours)",
                ].map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : `Confirm ${selectedNetwork.name} Deposit`}
          </Button>
        </form>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Supported Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-8 items-center">
              <div className="flex flex-col items-center">
                <img
                  src="https://assets.coingecko.com/coins/images/325/large/Tether.png"
                  alt="Tether"
                  className="h-10 w-10 object-contain"
                />
                <span className="text-xs text-muted-foreground mt-1">USDT</span>
              </div>
              {NETWORKS.map((network) => (
                <div key={network.id} className="flex flex-col items-center">
                  <network.icon className="h-10 w-10" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {network.name}
                  </span>
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
            By using our deposit service, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
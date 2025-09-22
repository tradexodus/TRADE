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
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNeuronLevel } from "@/lib/neuron-levels";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { uploadFileToStorage } from "@/lib/file-upload";

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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
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

  const nextStep = () => {
    if (currentStep === 1 && !copied) {
      toast({
        variant: "destructive",
        title: "Please copy the wallet address first",
        description: "You need to copy the wallet address before proceeding.",
      });
      return;
    }
    
    if (currentStep === 2 && (!amount || parseFloat(amount) < 1)) {
      toast({
        variant: "destructive",
        title: "Please enter a valid amount",
        description: "Amount must be at least 1 USDT.",
      });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!screenshot) {
      toast({
        variant: "destructive",
        title: "Screenshot required",
        description: "Please upload a transaction screenshot.",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let screenshotUrl = "";
      if (screenshot) {
        // Use the new safe upload system
        const uploadResult = await uploadFileToStorage(
          screenshot, 
          "deposit-screenshots", 
          "transactions"
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload screenshot");
        }

        screenshotUrl = uploadResult.data!.storagePath;
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
        description: error instanceof Error ? error.message : "Failed to submit deposit request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCopyAddress = async () => {
    const address =
      walletAddresses[selectedNetwork.id] || selectedNetwork.address;
    
    try {
      // Check if we can use the modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
      } else {
        // Use fallback method
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }
      
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // If all copy methods fail, just mark as copied and show the address
      setCopied(true);
      toast({
        title: "Address Ready",
        description: "Please manually copy the address below",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentAddress =
    walletAddresses[selectedNetwork.id] || selectedNetwork.address;

  const progress = (currentStep / totalSteps) * 100;

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
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Deposit USDT</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps} - {
                  currentStep === 1 ? "Copy Wallet Address" :
                  currentStep === 2 ? "Enter Amount" :
                  "Upload Screenshot"
                }
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Copy Wallet Address */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
                                    setCopied(false); // Reset copied state when network changes
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
              <Card className={cn("border-2", copied ? "border-green-500/50 bg-green-50/50" : "border-primary/20")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", copied ? "bg-green-500" : "bg-primary")}></div>
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
                      type="button"
                      onClick={handleCopyAddress}
                      variant={copied ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only send USDT via {selectedNetwork.name} network to this address
                  </p>
                  {copied && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      ✓ Address copied! You can now proceed to the next step.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Instructions for Step 1 */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Step 1: Copy Wallet Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm">Select your preferred network ({selectedNetwork.name})</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className={cn("w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium shrink-0 mt-0.5", 
                        copied ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")}>
                        2
                      </div>
                      <p className="text-sm">Click the copy button to copy the wallet address</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enter Deposit Amount</CardTitle>
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
                      className="text-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum deposit: 1 USDT
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions for Step 2 */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Step 2: Enter Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm">Enter the amount of USDT you want to deposit</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-sm">Make sure the amount matches what you'll send from your wallet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Upload Screenshot */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Transaction Screenshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      Upload a clear screenshot of your successful transaction
                    </p>
                    {screenshot && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Screenshot uploaded: {screenshot.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Deposit Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Network:</span>
                      <span className="text-sm font-medium">{selectedNetwork.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <span className="text-sm font-medium">{amount} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Wallet Address:</span>
                      <span className="text-sm font-mono text-xs">{currentAddress.slice(0, 10)}...{currentAddress.slice(-10)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions for Step 3 */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Step 3: Upload Screenshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm">Send {amount} USDT to the copied address using {selectedNetwork.name} network</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-sm">Take a screenshot of the successful transaction</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-sm">Upload the screenshot and submit your deposit request</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? "Processing..." : `Submit ${selectedNetwork.name} Deposit`}
              </Button>
            )}
          </div>
        </form>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-8">
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
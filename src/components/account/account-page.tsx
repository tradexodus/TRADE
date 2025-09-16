import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BrainCircuit, 
  User, 
  Shield, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle,
  ExternalLink,
  Star,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import VerificationForm from "./verification-form";
import TradingStatistics from "./trading-statistics";
import { getNeuronLevel, NEURON_LEVELS } from "@/lib/neuron-levels";

export default function AccountPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [isVerified, setIsVerified] = useState<
    "not_verified" | "pending" | "verified"
  >("not_verified");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [totalDepositAmount, setTotalDepositAmount] = useState(0);
  const [neuronLevel, setNeuronLevel] = useState(NEURON_LEVELS[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setNickname(profile.nickname || "");

      // Set total deposit amount and neuron level
      const depositAmount = profile.total_deposit_amount || 0;
      setTotalDepositAmount(depositAmount);

      // Get neuron level based on total deposit amount
      const level = getNeuronLevel(depositAmount);
      setNeuronLevel(level);
    }

    // Get verification status
    const { data: verification } = await supabase
      .from("user_verifications")
      .select("status")
      .eq("id", user.id)
      .single();

    if (verification) {
      setIsVerified(verification.status);
    }

    setIsEmailVerified(user.email_confirmed_at != null);
  }

  async function updateNickname() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id, nickname });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update nickname",
      });
    } else {
      toast({
        title: "Success",
        description: "Nickname updated successfully",
      });
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="destructive">Not Verified</Badge>;
    }
  };

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
              <h1 className="text-xl font-semibold">Account Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account information and verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Account Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Neuron Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded-full"
                  style={{ backgroundColor: `${neuronLevel.bgColor}40` }}
                >
                  <BrainCircuit
                    className="h-4 w-4"
                    style={{ color: neuronLevel.color }}
                  />
                </div>
                <p className="font-bold" style={{ color: neuronLevel.color }}>
                  {neuronLevel.name}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                ${totalDepositAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Identity</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Verification</span>
            </TabsTrigger>
            <TabsTrigger value="neurons" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span>Neurons</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Identity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nickname */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">Display Nickname</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your nickname"
                      className="flex-1"
                    />
                    <Button onClick={updateNickname}>Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be displayed in your trading profile
                  </p>
                </div>

                <Separator />

                {/* Email Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <h3 className="font-medium">Email Verification</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Email verification status</p>
                      <p className="text-xs text-muted-foreground">
                        Verify your email to secure your account
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationIcon(isEmailVerified ? "verified" : "not_verified")}
                      {getVerificationBadge(isEmailVerified ? "verified" : "not_verified")}
                    </div>
                  </div>
                  {!isEmailVerified && (
                    <Button variant="outline" size="sm" className="w-full">
                      Resend Verification Email
                    </Button>
                  )}
                </div>

                <Separator />

                {/* ID Verification Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <h3 className="font-medium">Identity Verification</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">ID verification status</p>
                      <p className="text-xs text-muted-foreground">
                        Required for withdrawals and higher limits
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationIcon(isVerified)}
                      {getVerificationBadge(isVerified)}
                    </div>
                  </div>
                  {isVerified === "not_verified" && (
                    <Button className="w-full">
                      Start Verification Process
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getVerificationIcon(isVerified)}
                    <div>
                      <p className="font-medium">Current Status</p>
                      <p className="text-sm text-muted-foreground">
                        {isVerified === "verified" && "Your identity has been verified"}
                        {isVerified === "pending" && "Your documents are being reviewed"}
                        {isVerified === "not_verified" && "Identity verification required"}
                      </p>
                    </div>
                  </div>
                  {getVerificationBadge(isVerified)}
                </div>

                {/* Verification Form */}
                {isVerified === "not_verified" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">Required Documents</h3>
                      <div className="space-y-2">
                        {[
                          "Government-issued photo ID (passport, driver's license, or national ID)",
                          "Clear, high-resolution photos of both sides",
                          "Ensure all text is readable and corners are visible",
                          "Documents must be valid and not expired"
                        ].map((requirement, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-sm">{requirement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <VerificationForm
                      onVerificationSubmitted={() => setIsVerified("pending")}
                    />
                  </div>
                )}

                {/* Pending Message */}
                {isVerified === "pending" && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <Clock className="h-12 w-12 mx-auto text-amber-500" />
                        <div>
                          <p className="font-medium text-amber-700">
                            Verification in Progress
                          </p>
                          <p className="text-sm text-amber-600 mt-2">
                            We are currently reviewing your submitted documents. This
                            process typically takes 1-3 business days. You'll receive
                            an email notification once the review is complete.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Verified Message */}
                {isVerified === "verified" && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                        <div>
                          <p className="font-medium text-green-700">
                            Identity Verified Successfully
                          </p>
                          <p className="text-sm text-green-600 mt-2">
                            Your identity has been verified. You now have full access
                            to all platform features including withdrawals and higher
                            trading limits.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="neurons" className="mt-6">
            <div className="space-y-6">
              {/* Current Level Card */}
              <Card className="border-2" style={{ borderColor: `${neuronLevel.color}40` }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" style={{ color: neuronLevel.color }} />
                    Current Neuron Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div
                      className="inline-flex p-4 rounded-full"
                      style={{ backgroundColor: `${neuronLevel.bgColor}40` }}
                    >
                      <BrainCircuit
                        className="h-10 w-10"
                        style={{ color: neuronLevel.color }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: neuronLevel.color }}
                      >
                        {neuronLevel.name} Level
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {neuronLevel.name === "Elite"
                          ? "You've reached the highest level!"
                          : "Deposit more to increase your neurons level"}
                      </p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${neuronLevel.minAmount.toLocaleString()}</span>
                        {neuronLevel.maxAmount ? (
                          <span>${neuronLevel.maxAmount.toLocaleString()}</span>
                        ) : (
                          <span>∞</span>
                        )}
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${neuronLevel.progressPercentage}%`,
                            backgroundColor: neuronLevel.color,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          {neuronLevel.name === "Elite"
                            ? "Maximum level achieved"
                            : `${neuronLevel.progressPercentage}% to next level`}
                        </p>
                        <Badge
                          style={{
                            backgroundColor: `${neuronLevel.bgColor}80`,
                            color: neuronLevel.color,
                          }}
                        >
                          {neuronLevel.percentage}% Rate
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Deposits
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: neuronLevel.color }}
                      >
                        ${totalDepositAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Levels */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Neuron Levels</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {NEURON_LEVELS.map((level, index) => (
                      <div key={level.name}>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-full"
                              style={{ backgroundColor: `${level.bgColor}80` }}
                            >
                              <BrainCircuit
                                className="h-4 w-4"
                                style={{ color: level.color }}
                              />
                            </div>
                            <div>
                              <p
                                className="font-medium"
                                style={{ color: level.color }}
                              >
                                {level.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {level.maxAmount
                                  ? `$${level.minAmount.toLocaleString()} - $${level.maxAmount.toLocaleString()}`
                                  : `$${level.minAmount.toLocaleString()}+`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {level.dailyAutoTradingAttempts === Infinity
                                  ? "Unlimited auto trading"
                                  : `${level.dailyAutoTradingAttempts} trades/day`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={level.name === neuronLevel.name ? "default" : "outline"}
                              style={{
                                backgroundColor: level.name === neuronLevel.name ? level.color : "transparent",
                                borderColor: level.color,
                                color: level.name === neuronLevel.name ? "white" : level.color,
                              }}
                            >
                              {level.percentage}%
                            </Badge>
                            {totalDepositAmount >= level.minAmount && (
                              <p className="text-xs text-green-500 mt-1">Unlocked</p>
                            )}
                          </div>
                        </div>
                        {index < NEURON_LEVELS.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
            Your account security and verification status are protected and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
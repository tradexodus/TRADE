import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "identity" | "neurons" | "verification"
  >("identity");
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

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Tabs for multi-menu design */}
        <div className="border-b">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("identity")}
              className={`pb-2 font-medium text-sm transition-colors ${activeTab === "identity" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Identity Info
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`pb-2 font-medium text-sm transition-colors ${activeTab === "verification" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              ID Verification
            </button>
            <button
              onClick={() => setActiveTab("neurons")}
              className={`pb-2 font-medium text-sm transition-colors ${activeTab === "neurons" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Neurons Level
            </button>
          </div>
        </div>

        {/* Trading Profile Tab */}
        {activeTab === "trading" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Trading Profile</h2>
            <div className="space-y-4">
              {/* Nickname */}
              <div className="space-y-2">
                <Label>Nickname</Label>
                <div className="flex gap-2">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter nickname"
                  />
                  <Button onClick={updateNickname}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Identity Info Tab */}
        {activeTab === "identity" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Identity Info</h2>
            <div className="space-y-4">
              {/* Email Verification Status */}
              <div className="space-y-2">
                <Label>Email Status</Label>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded text-sm ${isEmailVerified ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}
                  >
                    {isEmailVerified ? "Verified" : "Not Verified"}
                  </div>
                  {!isEmailVerified && (
                    <Button variant="outline" size="sm">
                      Resend Verification
                    </Button>
                  )}
                </div>
              </div>

              {/* ID Verification Status */}
              <div className="space-y-2">
                <Label>ID Verification Status</Label>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded text-sm ${
                      {
                        not_verified: "bg-red-500/20 text-red-500",
                        pending: "bg-yellow-500/20 text-yellow-500",
                        verified: "bg-green-500/20 text-green-500",
                      }[isVerified]
                    }`}
                  >
                    {
                      {
                        not_verified: "Not Verified",
                        pending: "Pending",
                        verified: "Verified",
                      }[isVerified]
                    }
                  </div>
                  {isVerified === "not_verified" && (
                    <Button
                      onClick={() => {
                        setIsDialogOpen(true);
                      }}
                    >
                      Verify Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ID Verification Tab */}
        {activeTab === "verification" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">ID Verification</h2>
            <div className="space-y-4">
              {/* Verification Status */}
              <div className="space-y-2">
                <Label>Verification Status</Label>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded text-sm ${
                      {
                        not_verified: "bg-red-500/20 text-red-500",
                        pending: "bg-yellow-500/20 text-yellow-500",
                        verified: "bg-green-500/20 text-green-500",
                      }[isVerified]
                    }`}
                  >
                    {
                      {
                        not_verified: "Not Verified",
                        pending: "Pending Review",
                        verified: "Verified",
                      }[isVerified]
                    }
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              {isVerified === "not_verified" && (
                <VerificationForm
                  onVerificationSubmitted={() => setIsVerified("pending")}
                />
              )}

              {/* Pending Message */}
              {isVerified === "pending" && (
                <div className="p-6 border rounded-lg bg-yellow-500/10">
                  <div className="text-center space-y-4">
                    <p className="text-yellow-500 font-medium">
                      Your verification is being reviewed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We are currently reviewing your submitted documents. This
                      process typically takes 1-3 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Verified Message */}
              {isVerified === "verified" && (
                <div className="p-6 border rounded-lg bg-green-500/10">
                  <div className="text-center space-y-4">
                    <p className="text-green-500 font-medium">
                      Your identity has been verified
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You now have full access to all platform features.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Neurons Level Tab */}
        {activeTab === "neurons" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Neurons Level</h2>
            <div className="p-6 border rounded-lg">
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
                <h3
                  className="text-lg font-medium"
                  style={{ color: neuronLevel.color }}
                >
                  {neuronLevel.name} Level
                </h3>
                <p className="text-sm text-muted-foreground">
                  {neuronLevel.name === "Elite"
                    ? "You've reached the highest level!"
                    : "Deposit more to increase your neurons level"}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>${neuronLevel.minAmount.toLocaleString()}</span>
                  {neuronLevel.maxAmount ? (
                    <span>${neuronLevel.maxAmount.toLocaleString()}</span>
                  ) : (
                    <span>∞</span>
                  )}
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full"
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
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${neuronLevel.bgColor}80`,
                      color: neuronLevel.color,
                    }}
                  >
                    {neuronLevel.percentage}% Rate
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-sm font-medium text-gray-300">
                    Total Deposits
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: neuronLevel.color }}
                  >
                    ${totalDepositAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Neuron Levels</h3>
              <div className="space-y-3">
                {NEURON_LEVELS.map((level) => (
                  <div
                    key={level.name}
                    className="flex justify-between items-center p-4 border rounded-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    style={{
                      borderColor: level.color,
                    }}
                    onClick={() => {
                      // This is just for interactivity, doesn't change actual level
                      if (totalDepositAmount >= level.minAmount) {
                        toast({
                          title: `${level.name} Level`,
                          description: `You are ${level.name === neuronLevel.name ? "currently at" : "eligible for"} this level.`,
                        });
                      } else {
                        toast({
                          title: `${level.name} Level`,
                          description: `You need ${(level.minAmount - totalDepositAmount).toLocaleString()} more to reach this level.`,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: `${level.bgColor}80` }}
                      >
                        <BrainCircuit
                          className="h-5 w-5"
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
                            ? `${level.minAmount.toLocaleString()} - ${level.maxAmount.toLocaleString()}`
                            : `${level.minAmount.toLocaleString()}+`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {level.dailyAutoTradingAttempts === Infinity
                            ? "Unlimited auto trading attempts"
                            : `${level.dailyAutoTradingAttempts} auto trading attempts/day`}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${level.bgColor}40`,
                        color: level.color,
                      }}
                    >
                      {level.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification dialog is now replaced by the tab */}
    </div>
  );
}

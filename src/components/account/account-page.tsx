import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import VerificationDialog from "./verification-dialog";

export default function AccountPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [isVerified, setIsVerified] = useState<
    "not_verified" | "pending" | "verified"
  >("not_verified");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <div className="space-y-6 max-w-md">
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
              <Button onClick={() => setIsDialogOpen(true)}>Verify Now</Button>
            )}
          </div>
        </div>
      </div>

      <VerificationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onVerificationSubmitted={() => {
          setIsVerified("pending");
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}

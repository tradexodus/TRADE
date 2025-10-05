import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Shield,
  Key,
  Mail,
  LogOut,
  Info,
  HelpCircle,
  Check,
  ExternalLink,
  Settings,
  User,
  Lock,
  Trash2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentWithdrawalPassword, setCurrentWithdrawalPassword] =
    useState("");
  const [newWithdrawalPassword, setNewWithdrawalPassword] = useState("");
  const [hasExistingWithdrawalPassword, setHasExistingWithdrawalPassword] =
    useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchLoginHistory();
  }, []);

  async function fetchUserData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
      const { data: securitySettings } = await supabase
        .from("user_security_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      if (securitySettings) {
        setTwoFactorEnabled(securitySettings.two_factor_enabled);
        setHasExistingWithdrawalPassword(
          !!securitySettings.withdrawal_password,
        );
      }
    }
  }

  async function fetchLoginHistory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("login_time", { ascending: false })
        .limit(5);

      if (data) {
        setLoginHistory(data);
      }
    }
  }

  async function handleEmailUpdate() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Please check your email to verify the change",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate() {
    setLoading(true);
    try {
      // First verify the current password
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Current password is incorrect",
        });
        return;
      }

      // If current password is correct, proceed with password update
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setShowSuccessDialog(true);
      setNewPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawalPasswordUpdate() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First check if a record exists
      const { data: existingSettings } = await supabase
        .from("user_security_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      // Verify current password if one exists
      if (hasExistingWithdrawalPassword) {
        if (!currentWithdrawalPassword) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Current withdrawal password is required",
          });
          setLoading(false);
          return;
        }

        if (
          existingSettings?.withdrawal_password !== currentWithdrawalPassword
        ) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Current withdrawal password is incorrect",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from("user_security_settings").upsert({
        id: user.id,
        withdrawal_password: newWithdrawalPassword,
        two_factor_enabled: existingSettings?.two_factor_enabled || false,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal password updated successfully",
        variant: "default",
      });
      setCurrentWithdrawalPassword("");
      setNewWithdrawalPassword("");
      setHasExistingWithdrawalPassword(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorToggle() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First check if a record exists
      const { data: existingSettings } = await supabase
        .from("user_security_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("user_security_settings").upsert({
        id: user.id,
        two_factor_enabled: !twoFactorEnabled,
        withdrawal_password: existingSettings?.withdrawal_password || null,
      });

      if (error) throw error;

      setTwoFactorEnabled(!twoFactorEnabled);
      toast({
        title: "Success",
        description: `2FA ${!twoFactorEnabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || "",
      );
      if (error) throw error;

      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

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
              <h1 className="text-xl font-semibold">Account Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account preferences and security
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Account Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="flex-1"
                />
                <Button onClick={handleEmailUpdate} disabled={loading}>
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll need to verify your new email address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Update */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <h3 className="font-medium">Change Password</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={loading || !currentPassword || !newPassword}
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <h3 className="font-medium">Two-Factor Authentication</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Enable 2FA for enhanced security</p>
                  <p className="text-xs text-muted-foreground">
                    Adds an extra layer of protection to your account
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Withdrawal Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingWithdrawalPassword && (
              <div className="space-y-2">
                <Label htmlFor="current-withdrawal-password">
                  Current Withdrawal Password
                </Label>
                <Input
                  id="current-withdrawal-password"
                  type="password"
                  value={currentWithdrawalPassword}
                  onChange={(e) => setCurrentWithdrawalPassword(e.target.value)}
                  placeholder="Enter current withdrawal password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-withdrawal-password">
                {hasExistingWithdrawalPassword ? "New" : "Set"} Withdrawal
                Password
              </Label>
              <Input
                id="new-withdrawal-password"
                type="password"
                value={newWithdrawalPassword}
                onChange={(e) => setNewWithdrawalPassword(e.target.value)}
                placeholder={`Enter ${hasExistingWithdrawalPassword ? "new" : ""} withdrawal password`}
              />
              <p className="text-xs text-muted-foreground">
                Required for all withdrawal requests for enhanced security
              </p>
            </div>
            <Button
              onClick={handleWithdrawalPasswordUpdate}
              disabled={
                loading ||
                !newWithdrawalPassword ||
                (hasExistingWithdrawalPassword && !currentWithdrawalPassword)
              }
              className="w-full"
            >
              {loading
                ? "Updating..."
                : hasExistingWithdrawalPassword
                  ? "Update"
                  : "Set"}{" "}
              Password
            </Button>
          </CardContent>
        </Card>

        {/* Login History */}
        {loginHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recent Login Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginHistory.map((login, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(login.login_time).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(login.login_time).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {login.ip_address}
                        </p>
                      </div>
                    </div>
                    {index < loginHistory.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Support & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-muted-foreground">
                  Available 24/7 for any questions or issues
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Email: support@exudostrade.com</p>
                  <p>Telegram: @exudos_support</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium">App Information</h4>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Version: 3.5.1</p>
                  <p>License: Proprietary</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-red-700">Delete Account</h4>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
            Your privacy and security are our top priorities.
          </p>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="rounded-full bg-green-500/20 p-3">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Password Updated</h2>
            <p className="text-center text-muted-foreground">
              Your password has been successfully updated.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

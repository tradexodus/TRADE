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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
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

      const { error } = await supabase.from("user_security_settings").upsert({
        id: user.id,
        withdrawal_password: withdrawalPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal password updated successfully",
      });
      setWithdrawalPassword("");
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

      const { error } = await supabase.from("user_security_settings").upsert({
        id: user.id,
        two_factor_enabled: !twoFactorEnabled,
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loginHistory.map((login, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>{new Date(login.login_time).toLocaleString()}</span>
                    <span className="text-muted-foreground">
                      {login.ip_address}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter new email"
                  />
                  <Button onClick={handleEmailUpdate} disabled={loading}>
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <Button
                onClick={handlePasswordUpdate}
                disabled={loading || !currentPassword || !newPassword}
              >
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Withdrawal Password */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Set Withdrawal Password</Label>
                <Input
                  type="password"
                  value={withdrawalPassword}
                  onChange={(e) => setWithdrawalPassword(e.target.value)}
                  placeholder="Enter withdrawal password"
                />
              </div>
              <Button
                onClick={handleWithdrawalPasswordUpdate}
                disabled={loading || !withdrawalPassword}
              >
                Set Password
              </Button>
            </CardContent>
          </Card>

          {/* 2FA Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable 2FA</Label>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For any issues or questions, please contact our support team:
              </p>
              <div className="mt-4 space-y-2">
                <p>Email: support@neurotrade.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Hours: 24/7</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About NeuroTrade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NeuroTrade is a cutting-edge trading platform that combines
                artificial intelligence with traditional trading methods to
                provide users with the best possible trading experience.
              </p>
              <div className="space-y-2">
                <p>Version: 1.0.0</p>
                <p>License: Proprietary</p>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    onClick={() => navigate("/terms")}
                    className="p-0"
                  >
                    Terms of Service
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => navigate("/privacy")}
                    className="p-0"
                  >
                    Privacy Policy
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => navigate("/legal")}
                    className="p-0"
                  >
                    Legal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function TraderApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar_url: "",
    total_profit: 0,
    win_rate: 0,
    followers_count: 0,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "total_profit" ||
        name === "win_rate" ||
        name === "followers_count"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to apply",
        });
        return;
      }

      // Submit application to Supabase
      const { error } = await supabase.from("trader_applications").insert({
        user_id: user.id,
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        total_profit: formData.total_profit,
        win_rate: formData.win_rate / 100, // Convert percentage to decimal
        followers_count: formData.followers_count,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted for review.",
      });

      // Redirect back to copy trading page
      navigate("/copy-trading");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-background text-foreground">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Trader Application</CardTitle>
          <CardDescription>
            Apply to become a lead trader and share your expertise with others.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_profit">Total Profit ($)</Label>
              <Input
                id="total_profit"
                name="total_profit"
                type="number"
                step="0.01"
                value={formData.total_profit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="win_rate">Win Rate (%)</Label>
              <Input
                id="win_rate"
                name="win_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.win_rate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followers_count">Followers Count</Label>
              <Input
                id="followers_count"
                name="followers_count"
                type="number"
                value={formData.followers_count}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

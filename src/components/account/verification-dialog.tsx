import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationSubmitted: () => void;
}

export default function VerificationDialog({
  open,
  onOpenChange,
  onVerificationSubmitted,
}: VerificationDialogProps) {
  const [legalName, setLegalName] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload ID images
      let idFrontUrl = "";
      let idBackUrl = "";

      if (idFront) {
        const { data: frontData, error: frontError } = await supabase.storage
          .from("id-verifications")
          .upload(
            `${user.id}/front.${idFront.name.split(".").pop()}`,
            idFront,
            {
              cacheControl: "3600",
              upsert: true,
            },
          );

        if (frontError) {
          console.error("Front ID upload error:", frontError);
          throw frontError;
        }
        idFrontUrl = frontData.path;
      }

      if (idBack) {
        const { data: backData, error: backError } = await supabase.storage
          .from("id-verifications")
          .upload(`${user.id}/back.${idBack.name.split(".").pop()}`, idBack, {
            cacheControl: "3600",
            upsert: true,
          });

        if (backError) {
          console.error("Back ID upload error:", backError);
          throw backError;
        }
        idBackUrl = backData.path;
      }

      // Submit verification request
      const { error } = await supabase.from("user_verifications").upsert({
        id: user.id,
        legal_name: legalName,
        nationality,
        date_of_birth: dateOfBirth,
        id_type: idType,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        residential_address: address,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description:
          "Your verification request has been submitted and is pending review.",
      });

      onVerificationSubmitted();
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit verification request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ID Verification</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name (as shown on ID)</Label>
              <Input
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Enter your legal name"
              />
            </div>

            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Enter your nationality"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                required
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type of ID</Label>
              <Select value={idType} onValueChange={setIdType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driver_license">
                    Driver's License
                  </SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Front of ID</Label>
              <Input
                required
                type="file"
                accept="image/*"
                onChange={(e) => setIdFront(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Back of ID</Label>
              <Input
                required
                type="file"
                accept="image/*"
                onChange={(e) => setIdBack(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Residential Address</Label>
            <Input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your residential address"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Verification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

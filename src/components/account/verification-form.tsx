import { useState } from "react";
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
import { ToastAction } from "@/components/ui/toast";
import { Progress } from "@/components/ui/progress";

interface VerificationFormProps {
  onVerificationSubmitted: () => void;
}

export default function VerificationForm({
  onVerificationSubmitted,
}: VerificationFormProps) {
  const [legalName, setLegalName] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

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
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Verification Request Sent!",
        description:
          "Your verification request has been submitted and is pending review.",
        variant: "default",
        action: <ToastAction altText="View status">View Status</ToastAction>,
      });

      onVerificationSubmitted();
      setCurrentStep(4); // Move to completion step
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Failed to submit verification request. Please try again.",
        action: <ToastAction altText="Try again">Try Again</ToastAction>,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 bg-black/20 p-6 rounded-lg border border-gray-800">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start</span>
          <span>Data input</span>
          <span>Checking</span>
          <span>Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-center text-muted-foreground">
          {currentStep === 1 && "Please fill in your personal information"}
          {currentStep === 2 && "Upload your identification documents"}
          {currentStep === 3 && "Reviewing your information"}
          {currentStep === 4 && "Verification submitted successfully!"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!legalName || !nationality || !dateOfBirth || !idType}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Front of ID</Label>
                <Input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of the front of your ID
                </p>
              </div>

              <div className="space-y-2">
                <Label>Back of ID</Label>
                <Input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of the back of your ID
                </p>
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

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!idFront || !idBack || !address}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review Your Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Legal Name</p>
                  <p>{legalName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p>{nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p>{dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Type</p>
                  <p>
                    {idType === "driver_license"
                      ? "Driver's License"
                      : idType === "national_id"
                        ? "National ID"
                        : "Passport"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Residential Address
                  </p>
                  <p>{address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Front of ID</p>
                  <p>{idFront?.name || "No file selected"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Back of ID</p>
                  <p>{idBack?.name || "No file selected"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Verification"}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-green-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-500">
              Verification Submitted!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your verification request has been submitted and is pending
              review. This process typically takes 1-3 business days.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

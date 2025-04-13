import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";

interface ApplicationRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRequirements: {
    tradesCount: number;
    balance: number;
    isVerified: boolean;
  } | null;
  onSubmitApplication: () => Promise<void>;
}

export function ApplicationRequirementsDialog({
  open,
  onOpenChange,
  userRequirements,
  onSubmitApplication,
}: ApplicationRequirementsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meetsTradeRequirement = userRequirements?.tradesCount >= 100;
  const meetsBalanceRequirement = userRequirements?.balance >= 5000;
  const meetsVerificationRequirement = userRequirements?.isVerified === true;

  const meetsAllRequirements =
    meetsTradeRequirement &&
    meetsBalanceRequirement &&
    meetsVerificationRequirement;

  const handleSubmitApplication = async () => {
    if (!meetsAllRequirements) {
      toast({
        variant: "destructive",
        title: "Cannot submit application",
        description: "You do not meet all the requirements to become a trader.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitApplication();
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted for review.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit application",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trader Application Requirements</DialogTitle>
          <DialogDescription>
            To become a futures lead trader, you must meet the following
            requirements:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            {meetsTradeRequirement ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-medium">Minimum 100 trades</p>
              <p className="text-sm text-muted-foreground">
                You have completed {userRequirements?.tradesCount || 0} trades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {meetsBalanceRequirement ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-medium">Minimum $5,000 balance</p>
              <p className="text-sm text-muted-foreground">
                Your current balance: $
                {userRequirements?.balance.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {meetsVerificationRequirement ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-medium">Account verification</p>
              <p className="text-sm text-muted-foreground">
                {userRequirements?.isVerified
                  ? "Your account is verified"
                  : "Your account needs to be verified"}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitApplication}
            disabled={!meetsAllRequirements || isSubmitting}
            className={
              !meetsAllRequirements
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : ""
            }
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

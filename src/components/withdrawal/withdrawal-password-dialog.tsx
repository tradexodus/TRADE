import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface WithdrawalPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function WithdrawalPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading,
}: WithdrawalPasswordDialogProps) {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    onConfirm(password);
    // Don't reset password or close dialog here as we want to show loading state
  };

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  // Reset password when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Enter Withdrawal Password
          </DialogTitle>
          <DialogDescription>
            Please enter your withdrawal password to confirm this transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-password">Withdrawal Password</Label>
            <Input
              id="withdrawal-password"
              type="password"
              placeholder="Enter your withdrawal password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? "Verifying..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

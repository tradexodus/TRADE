import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertOctagon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface EmergencyStopButtonProps {
  userId?: string | null;
  onEmergencyStop?: () => void;
}

export default function EmergencyStopButton({
  userId,
  onEmergencyStop,
}: EmergencyStopButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleEmergencyStop = async () => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "Please log in to use this feature",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // This would be where actual emergency stop logic would go
      // For now, we'll just simulate a delay and show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Emergency stop executed",
        description: "All trading activities have been halted",
        variant: "default",
      });

      if (onEmergencyStop) {
        onEmergencyStop();
      }
    } catch (error) {
      console.error("Emergency stop error:", error);
      toast({
        title: "Error",
        description: "Failed to execute emergency stop",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="flex items-center gap-2 font-medium animate-pulse"
        onClick={() => setIsDialogOpen(true)}
      >
        <AlertOctagon className="h-4 w-4" />
        Emergency Stop
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertOctagon className="h-5 w-5" />
              Emergency Trading Stop
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will immediately halt all ongoing and scheduled trading
                activities. Any pending trades will be cancelled.
              </p>

              <div className="bg-muted/30 p-3 rounded-md space-y-2 border border-destructive/20">
                <h4 className="text-sm font-medium text-destructive">
                  Risk Summary:
                </h4>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>All auto-trading sessions will be terminated</li>
                  <li>Pending manual trades will be cancelled</li>
                  <li>Your current positions will remain unchanged</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <p className="font-medium">
                Are you sure you want to proceed with the emergency stop?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleEmergencyStop();
              }}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Processing..." : "Confirm Emergency Stop"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute w-full h-full rounded-full border-4 border-blue-200 opacity-25"></div>
      <div className="absolute w-full h-full rounded-full border-4 border-t-blue-500 animate-spin"></div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAiMarketAnalysis,
  CryptoPrediction,
} from "@/hooks/useAiMarketAnalysis";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AiMarketAnalysisCard() {
  const { predictions, lastUpdated, loading, refreshPredictions } =
    useAiMarketAnalysis();

  // Only show top 3 predictions in the minimized card
  const topPredictions = predictions.slice(0, 3);

  const getPredictionColor = (prediction: string): string => {
    switch (prediction) {
      case "Strong Buy":
        return "text-green-500";
      case "Buy":
        return "text-green-400";
      case "Neutral":
        return "text-yellow-500";
      case "Sell":
        return "text-red-400";
      case "Strong Sell":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="w-full h-full">
      <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          {loading ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {topPredictions.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${crypto.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {crypto.icon}
                    </div>
                    <div className="text-xs sm:text-sm">{crypto.name}</div>
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-medium ${getPredictionColor(crypto.prediction)}`}
                  >
                    {crypto.prediction}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-1 sm:mt-2">
            <div className="text-xs text-muted-foreground">
              {lastUpdated ? (
                <>Updated: {format(lastUpdated, "h:mm a")}</>
              ) : (
                "Updating..."
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    onClick={refreshPredictions}
                    disabled={loading}
                  >
                    <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Refresh analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

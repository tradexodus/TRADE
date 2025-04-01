import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiMarketAnalysis } from "@/hooks/useAiMarketAnalysis";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mobile version for the AI Trader page
export function MobileAiMarketAnalysis() {
  const { predictions, lastUpdated, loading, refreshPredictions } =
    useAiMarketAnalysis();

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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-blue-400">Loading analysis...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="space-y-2 p-3">
        {predictions.slice(0, 4).map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex items-center justify-between p-2 border border-gray-700 rounded-md hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 bg-gradient-to-br ${crypto.color} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
              >
                {crypto.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{crypto.name}</div>
                <div className="text-xs text-gray-400">{crypto.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-xs">AI Prediction</div>
              <div
                className={`text-xs ${getPredictionColor(crypto.prediction)}`}
              >
                {crypto.prediction}
              </div>
              {crypto.change24h !== undefined && (
                <div
                  className={`text-xs ${crypto.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {crypto.change24h >= 0 ? "+" : ""}
                  {crypto.change24h}% (24h)
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="p-2 text-center text-xs text-gray-500">
          AI analysis updated:{" "}
          {lastUpdated ? format(lastUpdated, "MMM dd, HH:mm") : "Just now"}
        </div>
      </div>
    </div>
  );
}

// Desktop version for the AI Trader page
export function DesktopAiMarketAnalysis() {
  const { predictions, lastUpdated, loading, refreshPredictions } =
    useAiMarketAnalysis();

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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-blue-400">Loading analysis...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="space-y-4 p-4">
        {predictions.map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex items-center justify-between p-3 border border-gray-700 rounded-md hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-br ${crypto.color} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
              >
                {crypto.icon}
              </div>
              <div>
                <div className="font-medium">{crypto.name}</div>
                <div className="text-xs text-gray-400">{crypto.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">AI Prediction</div>
              <div
                className={`text-sm ${getPredictionColor(crypto.prediction)}`}
              >
                {crypto.prediction}
              </div>
              {crypto.change24h !== undefined && (
                <div
                  className={`text-xs ${crypto.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {crypto.change24h >= 0 ? "+" : ""}
                  {crypto.change24h}% (24h)
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="p-4 text-center text-xs text-gray-500">
          AI analysis updated:{" "}
          {lastUpdated ? format(lastUpdated, "MMM dd, HH:mm:ss") : "Just now"}
        </div>
      </div>
    </div>
  );
}

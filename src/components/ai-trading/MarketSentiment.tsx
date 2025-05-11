import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

type SentimentLevel =
  | "extreme-fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme-greed";

interface MarketSentimentProps {
  className?: string;
}

export default function MarketSentiment({ className }: MarketSentimentProps) {
  const [sentimentData, setSentimentData] = useState<{
    value: number;
    level: SentimentLevel;
    change: number;
    timestamp: string;
  }>({
    value: 0,
    level: "neutral",
    change: 0,
    timestamp: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch actual market sentiment data
    // For now, we'll generate mock data
    const fetchMarketSentiment = () => {
      setIsLoading(true);

      // Generate a random value between 0 and 100
      const mockValue = Math.floor(Math.random() * 100);

      // Determine sentiment level based on value
      let level: SentimentLevel;
      if (mockValue < 20) level = "extreme-fear";
      else if (mockValue < 40) level = "fear";
      else if (mockValue < 60) level = "neutral";
      else if (mockValue < 80) level = "greed";
      else level = "extreme-greed";

      // Generate a random change between -5 and 5
      const mockChange = Math.floor(Math.random() * 10) - 5;

      const newSentimentData = {
        value: mockValue,
        level,
        change: mockChange,
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem(
        "marketSentimentData",
        JSON.stringify(newSentimentData),
      );
      localStorage.setItem(
        "marketSentimentLastFetch",
        new Date().toISOString(),
      );

      setSentimentData(newSentimentData);
      setIsLoading(false);
    };

    // Check if we have stored data and if it's less than an hour old
    const storedData = localStorage.getItem("marketSentimentData");
    const lastFetch = localStorage.getItem("marketSentimentLastFetch");

    if (storedData && lastFetch) {
      const lastFetchTime = new Date(lastFetch).getTime();
      const currentTime = new Date().getTime();
      const hourInMs = 3600000; // 1 hour in milliseconds

      if (currentTime - lastFetchTime < hourInMs) {
        // Use stored data if it's less than an hour old
        setSentimentData(JSON.parse(storedData));
        setIsLoading(false);
      } else {
        // Data is older than an hour, fetch new data
        fetchMarketSentiment();
      }
    } else {
      // No stored data, fetch new data
      fetchMarketSentiment();
    }

    // Refresh every hour
    const intervalId = setInterval(fetchMarketSentiment, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  // Get color based on sentiment level
  const getSentimentColor = (level: SentimentLevel) => {
    switch (level) {
      case "extreme-fear":
        return "text-red-600";
      case "fear":
        return "text-orange-500";
      case "neutral":
        return "text-blue-400";
      case "greed":
        return "text-green-500";
      case "extreme-greed":
        return "text-green-600";
      default:
        return "text-blue-400";
    }
  };

  // Get background color for progress bar
  const getProgressBgColor = (level: SentimentLevel) => {
    switch (level) {
      case "extreme-fear":
        return "bg-red-600";
      case "fear":
        return "bg-orange-500";
      case "neutral":
        return "bg-blue-400";
      case "greed":
        return "bg-green-500";
      case "extreme-greed":
        return "bg-green-600";
      default:
        return "bg-blue-400";
    }
  };

  // Format sentiment level for display
  const formatSentimentLevel = (level: SentimentLevel) => {
    return level
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className={`overflow-hidden border-0 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <span>Market Sentiment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fear & Greed Index</span>
              <span className="text-xs text-muted-foreground">
                Updated: {formatTimestamp(sentimentData.timestamp)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span
                className={`text-2xl font-bold ${getSentimentColor(sentimentData.level)}`}
              >
                {sentimentData.value}
              </span>
              <span
                className={`text-sm font-medium ${getSentimentColor(sentimentData.level)}`}
              >
                {formatSentimentLevel(sentimentData.level)}
              </span>
            </div>

            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressBgColor(sentimentData.level)}`}
                style={{ width: `${sentimentData.value}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Extreme Fear</span>
              <span>Neutral</span>
              <span>Extreme Greed</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span>24h Change:</span>
              <span
                className={
                  sentimentData.change >= 0
                    ? "text-green-500 flex items-center"
                    : "text-red-500 flex items-center"
                }
              >
                {sentimentData.change >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />+
                    {sentimentData.change}
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {sentimentData.change}
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

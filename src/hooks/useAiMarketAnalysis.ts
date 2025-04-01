import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type CryptoPrediction = {
  symbol: string;
  name: string;
  prediction: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  confidence: number;
  price?: number;
  change24h?: number;
  color: string;
  icon: string;
};

const DEFAULT_PREDICTIONS: CryptoPrediction[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    prediction: "Strong Buy",
    confidence: 85,
    color: "from-yellow-500 to-yellow-600",
    icon: "₿",
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    prediction: "Buy",
    confidence: 72,
    color: "from-blue-500 to-blue-600",
    icon: "Ξ",
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    prediction: "Neutral",
    confidence: 50,
    color: "from-purple-500 to-purple-600",
    icon: "S",
  },
  {
    symbol: "BNB/USDT",
    name: "Binance Coin",
    prediction: "Sell",
    confidence: 35,
    color: "from-yellow-600 to-yellow-700",
    icon: "B",
  },
  {
    symbol: "XRP/USDT",
    name: "Ripple",
    prediction: "Buy",
    confidence: 68,
    color: "from-blue-400 to-blue-500",
    icon: "X",
  },
];

// Predictions will be stored in localStorage with this key
const STORAGE_KEY = "ai_market_analysis";

// Update interval in milliseconds (2 hours)
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;

export function useAiMarketAnalysis() {
  const [predictions, setPredictions] = useState<CryptoPrediction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate new predictions based on the current ones
  const generateNewPredictions = (
    currentPredictions: CryptoPrediction[] = DEFAULT_PREDICTIONS,
  ) => {
    // Create a copy to avoid mutating the original
    const newPredictions = [...currentPredictions];

    // Possible prediction values
    const predictionValues: CryptoPrediction["prediction"][] = [
      "Strong Buy",
      "Buy",
      "Neutral",
      "Sell",
      "Strong Sell",
    ];

    // Update each prediction with some randomness
    return newPredictions.map((prediction) => {
      // 30% chance to change the prediction
      if (Math.random() < 0.3) {
        const currentIndex = predictionValues.indexOf(prediction.prediction);
        let newIndex;

        // Tend to move only one step up or down (more realistic)
        const direction = Math.random() > 0.5 ? 1 : -1;
        newIndex = Math.max(
          0,
          Math.min(predictionValues.length - 1, currentIndex + direction),
        );

        // Update confidence based on prediction
        let newConfidence;
        switch (predictionValues[newIndex]) {
          case "Strong Buy":
            newConfidence = 80 + Math.floor(Math.random() * 15);
            break;
          case "Buy":
            newConfidence = 65 + Math.floor(Math.random() * 15);
            break;
          case "Neutral":
            newConfidence = 45 + Math.floor(Math.random() * 15);
            break;
          case "Sell":
            newConfidence = 30 + Math.floor(Math.random() * 15);
            break;
          case "Strong Sell":
            newConfidence = 15 + Math.floor(Math.random() * 15);
            break;
          default:
            newConfidence = 50;
        }

        return {
          ...prediction,
          prediction: predictionValues[newIndex],
          confidence: newConfidence,
        };
      }

      // Small random adjustment to confidence even if prediction doesn't change
      const confidenceAdjustment = Math.floor(Math.random() * 10) - 5; // -5 to +5
      const newConfidence = Math.max(
        10,
        Math.min(95, prediction.confidence + confidenceAdjustment),
      );

      return {
        ...prediction,
        confidence: newConfidence,
      };
    });
  };

  // Save predictions to localStorage
  const savePredictions = (predictions: CryptoPrediction[]) => {
    const now = new Date();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        predictions,
        timestamp: now.getTime(),
      }),
    );
    setLastUpdated(now);
  };

  // Load predictions from localStorage or generate new ones
  const loadPredictions = () => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (storedData) {
        const { predictions: storedPredictions, timestamp } =
          JSON.parse(storedData);
        const lastUpdate = new Date(timestamp);
        const now = new Date();

        // Check if predictions need to be updated (older than 12 hours)
        if (now.getTime() - lastUpdate.getTime() > UPDATE_INTERVAL) {
          // Generate new predictions based on the stored ones
          const newPredictions = generateNewPredictions(storedPredictions);
          setPredictions(newPredictions);
          savePredictions(newPredictions);
        } else {
          // Use stored predictions
          setPredictions(storedPredictions);
          setLastUpdated(lastUpdate);
        }
      } else {
        // No stored predictions, generate new ones
        const newPredictions = generateNewPredictions();
        setPredictions(newPredictions);
        savePredictions(newPredictions);
      }
    } catch (error) {
      console.error("Error loading AI market analysis:", error);
      // Fallback to default predictions
      setPredictions(DEFAULT_PREDICTIONS);
      savePredictions(DEFAULT_PREDICTIONS);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh predictions
  const refreshPredictions = () => {
    setLoading(true);
    const newPredictions = generateNewPredictions(predictions);
    setPredictions(newPredictions);
    savePredictions(newPredictions);
    setLoading(false);
  };

  // Load predictions on mount
  useEffect(() => {
    loadPredictions();

    // Set up interval to check for updates
    const intervalId = setInterval(() => {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const { timestamp } = JSON.parse(storedData);
        const lastUpdate = new Date(timestamp);
        const now = new Date();

        if (now.getTime() - lastUpdate.getTime() > UPDATE_INTERVAL) {
          loadPredictions();
        }
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  return {
    predictions,
    lastUpdated,
    loading,
    refreshPredictions,
  };
}

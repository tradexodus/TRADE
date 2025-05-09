import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

interface TradingViewChartProps {
  symbol?: string;
  theme?: "light" | "dark";
  height?: number;
}

export default function TradingViewChart({
  symbol = "BINANCE:BTCUSDT",
  theme = "dark",
  height = 700,
}: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any existing script to avoid duplicates
    const existingScript = document.getElementById("tradingview-widget-script");
    if (existingScript) {
      existingScript.remove();
    }

    // Create the TradingView widget script
    const script = document.createElement("script");
    script.id = "tradingview-widget-script";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    const widgetOptions = {
      height: height,
      width: "100%",
      symbol: symbol,

      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      backgroundColor:
        theme === "dark" ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)",
      gridColor:
        theme === "dark"
          ? "rgba(152, 152, 152, 0.06)"
          : "rgba(42, 46, 57, 0.06)",
      range: "1D",
      allow_symbol_change: true,
      save_image: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
    };
    script.text = JSON.stringify(widgetOptions);

    // Append the script to the container
    if (container.current) {
      // Clear any existing content
      container.current.innerHTML = "";

      // Create the widget container
      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      container.current.appendChild(widgetContainer);

      // Add the script
      container.current.appendChild(script);
    }

    // Clean up function
    return () => {
      const scriptToRemove = document.getElementById(
        "tradingview-widget-script",
      );
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [symbol, theme]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3">
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-blue-400" />
          <span>Live Market Chart</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={container}
          className="tradingview-widget-container"
          style={{ minHeight: `${height}px`, width: "100%" }}
        >
          {/* TradingView widget will be inserted here */}
        </div>
      </CardContent>
    </Card>
  );
}

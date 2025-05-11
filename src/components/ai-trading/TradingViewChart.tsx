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
    const timeout = setTimeout(() => {
      if (!container.current) return;

      container.current.innerHTML = "";

      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      container.current.appendChild(widgetContainer);

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        height: height,
        width: "100%",
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: theme,
        style: "1",
        locale: "en",
        allow_symbol_change: true,
        hide_volume: true,
        support_host: "https://www.tradingview.com",
      });
      widgetContainer.appendChild(script);
    }, 100); // 100ms تأخير بسيط

    return () => {
      clearTimeout(timeout);
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg max-w-full">
      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-blue-800/10 py-3 hidden md:block">
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
        />
      </CardContent>
    </Card>
  );
}

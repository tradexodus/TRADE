import React from "react";

interface TradingViewAdvancedChartProps {
  symbol?: string;
  height?: string | number;
  theme?: "light" | "dark";
  allowSymbolChange?: boolean;
  interval?: string;
}

export const TradingViewAdvancedChart: React.FC<
  TradingViewAdvancedChartProps
> = ({
  symbol = "NASDAQ:AAPL",
  height = 500,
  theme = "dark",
  allowSymbolChange = true,
  interval = "D",
}) => {
  const containerId = `tradingview_advanced_${Math.random().toString(36).substring(2, 15)}`;

  React.useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: false,
      height: height,
      symbol: symbol,
      interval: interval,
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      allow_symbol_change: allowSymbolChange,
      support_host: "https://www.tradingview.com",
    });

    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && script.parentNode === container) {
        container.removeChild(script);
      }
    };
  }, [symbol, height, theme, allowSymbolChange, interval, containerId]);

  return (
    <div
      id={containerId}
      className="tradingview-widget-container bg-background"
      style={{ height }}
    ></div>
  );
};

export default TradingViewAdvancedChart;

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
    // Use iframe approach instead of script injection
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any existing content
    container.innerHTML = "";

    // Create iframe element
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = typeof height === "number" ? `${height}px` : height;
    iframe.style.border = "none";
    iframe.title = "TradingView Advanced Chart";
    iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=${containerId}&symbol=${symbol}&interval=${interval}&hidesidetoolbar=0&symboledit=${allowSymbolChange ? 1 : 0}&saveimage=1&toolbarbg=f1f3f6&theme=${theme}&style=1&timezone=Etc/UTC&withdateranges=1&studies=%5B%5D&locale=en`;

    container.appendChild(iframe);

    return () => {
      if (container) {
        container.innerHTML = "";
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

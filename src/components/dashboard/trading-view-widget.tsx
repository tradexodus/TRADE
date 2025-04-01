import React from "react";

interface TradingViewSymbolWidgetProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  colorTheme?: "light" | "dark";
  isTransparent?: boolean;
  locale?: string;
}

export const TradingViewSymbolWidget: React.FC<
  TradingViewSymbolWidgetProps
> = ({
  symbol = "NASDAQ:AAPL",
  width = "100%",
  height = 400,
  colorTheme = "dark",
  isTransparent = false,
  locale = "en",
}) => {
  const containerId = `tradingview_widget_${Math.random().toString(36).substring(2, 15)}`;

  React.useEffect(() => {
    // Use iframe approach instead of script injection
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any existing content
    container.innerHTML = "";

    // Create iframe element
    const iframe = document.createElement("iframe");
    iframe.style.width = typeof width === "number" ? `${width}px` : width;
    iframe.style.height = typeof height === "number" ? `${height}px` : height;
    iframe.style.border = "none";
    iframe.title = "TradingView Widget";
    iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=${containerId}&symbol=${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&theme=${colorTheme}&style=1&timezone=Etc/UTC&withdateranges=1&studies=%5B%5D&locale=${locale}`;

    container.appendChild(iframe);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [symbol, width, height, colorTheme, locale, containerId]);

  return <div id={containerId} className="bg-background" />;
};

export const TradingViewWidget = TradingViewSymbolWidget;

export default TradingViewSymbolWidget;

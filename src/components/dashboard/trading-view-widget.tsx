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
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        new window.TradingView.widget({
          width: width,
          height: height,
          symbol: symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: colorTheme,
          style: "1",
          locale: locale,
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerId,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, width, height, colorTheme, locale, containerId]);

  return <div id={containerId} className="bg-background" />;
};

export const TradingViewWidget = TradingViewSymbolWidget;

export default TradingViewSymbolWidget;

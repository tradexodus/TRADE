import { useEffect, useRef } from "react";

export const TradingViewMarketOverview = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = "";

    // Create widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const widgetContent = document.createElement("div");
    widgetContent.className = "tradingview-widget-container__widget";
    widgetContainer.appendChild(widgetContent);

    // Create script element
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;

    // Widget configuration
    script.textContent = JSON.stringify({
      symbols: [
        ["BINANCE:BTCUSDT|1D"],
        ["BINANCE:ETHUSDT|1D"],
        ["BINANCE:SOLUSDT|1D"],
      ],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: "medium",
      gridLineColor: "rgba(242, 242, 242, 0.19)",
      backgroundColor: "rgba(15, 15, 15, 0)",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      // Cleanup on unmount
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="w-full h-[380px]" />;
};

// CSS styles (add to your global styles or component styles)
/*
.tradingview-widget-container {
  width: 100%;
  height: 100%;
}

.tradingview-widget-container__widget {
  width: 100%;
  height: 100%;
}
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Import fonts
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/manrope/700.css";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

// Apply theme from cookies or localStorage on initial load
import { getThemePreference } from "./lib/cookies";

const cookieTheme = getThemePreference();
const localStorageTheme = localStorage.getItem("theme");
const theme = cookieTheme || localStorageTheme || "dark";

if (theme === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

// Global error handler for better debugging
window.addEventListener("error", function (event) {
  console.error("Global error caught:", {
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode className="fixed">
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

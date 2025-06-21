import { Suspense, lazy, useEffect } from "react";
import CopyTrading from "./pages/copy-trading";
import { useRoutes, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { Toaster } from "@/components/ui/toaster";
import AuthLayout from "./components/layout/AuthLayout";
import { LoadingScreen } from "./components/ui/loading-screen";
import { ThemeToggle } from "./components/ui/theme-toggle";
import { getThemePreference, setSessionToken } from "@/lib/cookies";
import { supabase } from "@/lib/supabase";

const LoginPage = lazy(() => import("./pages/login"));
const SignupPage = lazy(() => import("./pages/signup"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("./pages/reset-password"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AccountPage = lazy(() => import("./pages/account"));
const DepositPage = lazy(() => import("./pages/deposit"));
const HistoryPage = lazy(() => import("./pages/history"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const LegalPage = lazy(() => import("./pages/legal"));
const TermsPage = lazy(() => import("./pages/terms"));
const SettingsPage = lazy(() => import("./pages/settings"));

const WithdrawalPage = lazy(() => import("./pages/withdrawal"));
const AiTradingPage = lazy(() => import("./pages/ai-trading"));

function App() {
  const navigate = useNavigate();

  // Apply theme from cookie on app initialization
  useEffect(() => {
    const cookieTheme = getThemePreference();
    const localStorageTheme = localStorage.getItem("theme");
    const theme = cookieTheme || localStorageTheme || "dark";

    const htmlElement = document.documentElement;
    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, []);

  // ✅ Handle OAuth redirect with tokens in hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (!error) {
              setSessionToken(access_token);
              window.history.replaceState(null, "", window.location.pathname); // remove tokens from URL
              navigate("/dashboard");
            } else {
              console.error("Error restoring session from Google OAuth", error);
              navigate("/login");
            }
          });
      }
    }
  }, [navigate]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div>
        <div className="fixed z-50 md:right-8 sm:right-8 xs:right-4 right-14 top-3 hidden md:block">
          <ThemeToggle />
        </div>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        {import.meta.env.VITE_TEMPO === "true" && (
          <Routes>
            <Route path="/tempobook/*" />
          </Routes>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Wrap authenticated routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/copy-trading" element={<CopyTrading />} />
            <Route path="/copy-trading/:traderId" element={<CopyTrading />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/trade-history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/withdrawal" element={<WithdrawalPage />} />
            <Route path="/ai-trading" element={<AiTradingPage />} />
          </Route>
          {/* Public routes */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
        <Toaster />
      </div>
    </Suspense>
  );
}

export default App;

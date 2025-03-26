import { Suspense, lazy } from "react";
import CopyTrading from "./pages/copy-trading";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { Toaster } from "@/components/ui/toaster";
import { AuthLayout } from "./components/layout";

const LoginPage = lazy(() => import("./pages/login"));
const SignupPage = lazy(() => import("./pages/signup"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AccountPage = lazy(() => import("./pages/account"));
const DepositPage = lazy(() => import("./pages/deposit"));
const WithdrawalPage = lazy(() => import("./pages/withdrawal"));
const HistoryPage = lazy(() => import("./pages/history"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const LegalPage = lazy(() => import("./pages/legal"));
const TermsPage = lazy(() => import("./pages/terms"));
const SettingsPage = lazy(() => import("./pages/settings"));
const AITraderPage = lazy(() => import("./pages/ai-trader"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* Wrap authenticated routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/copy-trading" element={<CopyTrading />} />
            <Route path="/withdrawal" element={<WithdrawalPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/trade-history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai-trader" element={<AITraderPage />} />
          </Route>
          {/* Public routes */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        <Toaster />
      </div>
    </Suspense>
  );
}

export default App;

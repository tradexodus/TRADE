import { Suspense, lazy } from "react";
import CopyTrading from "./pages/copy-trading";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";

const LoginPage = lazy(() => import("./pages/login"));
const SignupPage = lazy(() => import("./pages/signup"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AccountPage = lazy(() => import("./pages/account"));
const DepositPage = lazy(() => import("./pages/deposit"));
const WithdrawalPage = lazy(() => import("./pages/withdrawal"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const LegalPage = lazy(() => import("./pages/legal"));
const TermsPage = lazy(() => import("./pages/terms"));
const SettingsPage = lazy(() => import("./pages/settings"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/copy-trading" element={<CopyTrading />} />
          <Route path="/withdrawal" element={<WithdrawalPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;

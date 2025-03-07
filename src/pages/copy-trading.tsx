import CopyTradingPage from "@/components/copy-trading/copy-trading-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function CopyTrading() {
  return (
    <AuthenticatedLayout>
      <CopyTradingPage />
    </AuthenticatedLayout>
  );
}

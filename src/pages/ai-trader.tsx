import AITraderPage from "@/components/ai-trader/ai-trader-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function AITrader() {
  return (
    <AuthenticatedLayout>
      <AITraderPage />
    </AuthenticatedLayout>
  );
}

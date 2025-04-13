import CopyTradingPage from "@/components/copy-trading/copy-trading-page";
import TraderDetailPage from "@/components/copy-trading/TraderDetailPage";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useParams } from "react-router-dom";

export default function CopyTrading() {
  const { traderId } = useParams<{ traderId: string }>();

  return (
    <AuthenticatedLayout>
      {traderId ? <TraderDetailPage /> : <CopyTradingPage />}
    </AuthenticatedLayout>
  );
}

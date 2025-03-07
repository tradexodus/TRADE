import TransactionHistoryPage from "@/components/history/transaction-history-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function History() {
  return (
    <AuthenticatedLayout>
      <TransactionHistoryPage />
    </AuthenticatedLayout>
  );
}

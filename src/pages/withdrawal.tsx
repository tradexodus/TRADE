import WithdrawalPage from "@/components/withdrawal/withdrawal-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function Withdrawal() {
  return (
    <AuthenticatedLayout>
      <WithdrawalPage />
    </AuthenticatedLayout>
  );
}

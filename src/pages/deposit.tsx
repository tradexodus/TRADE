import DepositPage from "@/components/deposit/deposit-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function Deposit() {
  return (
    <AuthenticatedLayout>
      <DepositPage />
    </AuthenticatedLayout>
  );
}

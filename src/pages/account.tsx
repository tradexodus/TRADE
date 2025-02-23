import AccountPage from "@/components/account/account-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function Account() {
  return (
    <AuthenticatedLayout>
      <AccountPage />
    </AuthenticatedLayout>
  );
}

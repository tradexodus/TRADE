import SettingsPage from "@/components/settings/settings-page";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";

export default function Settings() {
  return (
    <AuthenticatedLayout>
      <SettingsPage />
    </AuthenticatedLayout>
  );
}

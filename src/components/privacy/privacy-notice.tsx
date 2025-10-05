import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyNotice() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Privacy Notice - Exudos Trade©</h1>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground">Last updated: 20 January 2025</p>

        <p>
          Exudos Trade© ("Exudos Trade©", "we", or "us") is committed to
          protecting the privacy of our customers, and we take our data
          protection responsibilities with the utmost seriousness.
        </p>

        <p>
          This Privacy Notice describes how Exudos Trade© collects and
          processes your personal data through the Exudos Trade© websites and
          applications that are referenced in this Privacy Notice.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">
          1. Exudos Trade© Relationship with you
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="p-4 text-left">Where you reside</th>
                <th className="p-4 text-left">Services Provided</th>
                <th className="p-4 text-left">Your Operating Entity</th>
                <th className="p-4 text-left">Contact address</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-4">France</td>
                <td className="p-4">Digital Asset Services Provider</td>
                <td className="p-4">Exudos Trade© France SAS</td>
                <td className="p-4">
                  1 rue de Stockholm, 75008, Paris, France
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-4">Italy</td>
                <td className="p-4">Digital Asset Services Provider</td>
                <td className="p-4">Exudos Trade© Italy S.R.L</td>
                <td className="p-4">
                  Corso Europa n. 15, 20122, Milano (MI), Italy
                </td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">
          2. What Personal Data does Exudos Trade© collect and process?
        </h2>

        <p>
          Personal data is data that identifies an individual or relates to an
          identifiable individual. This includes information you provide to us,
          information which is collected about you automatically, and
          information we obtain from third parties.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Personal Identification Data
            </h3>
            <p className="text-muted-foreground">
              Full name, e-mail address, gender, home address, phone number,
              date of birth, nationality, proof of residency, signature, utility
              bills, photographs, and a video or voice recording of you
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Sensitive and Biometric Personal Data
            </h3>
            <p className="text-muted-foreground">
              Exudos Trade© may also collect sensitive personal data when
              permitted by local law or with your consent, such as biometric
              information
            </p>
          </div>

          {/* Add more sections as needed */}
        </div>

        {/* Add more sections of the privacy notice */}
      </div>
    </div>
  );
}

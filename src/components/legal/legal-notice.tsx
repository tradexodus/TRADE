import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LegalNotice() {
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
        <h1 className="text-2xl font-bold">
          Licenses, Registrations, and Other Legal Matters
        </h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold">LICENSES AND REGISTRATIONS</h2>
          <p>
            Neurotrade is committed to working closely and collaboratively with
            regulators from around the world. Neurotrade currently holds the
            following regulatory licenses, registrations, authorizations, and
            approvals:
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Europe</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">France</h3>
              <p>
                Neurotrade France SAS has been granted registration as a Digital
                Asset Service Provider (DASP) by the Autorité des Marchés
                Financiers (AMF) (registration number E2022-037). Neurotrade
                France SAS can provide the following regulated services in
                France: digital assets custody; purchase/sale of digital assets
                for legal tender; exchange of digital assets for other digital
                assets; and operation of a trading platform for digital assets.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Italy</h3>
              <p>
                Neurotrade Italy S.R.L. has been granted a Digital Asset Service
                Provider (DASP) registration by the Organismo Agenti e Mediatori
                (OAM) (registration number PSV5). The registration enables
                Neurotrade Italy S.R.L. to provide crypto asset exchange and
                custody services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Spain</h3>
              <p>
                Neurotrade Spain, S.L. (Neurotrade's Spanish subsidiary) has
                been granted registration as a Virtual Asset Services Provider
                by the Bank of Spain (registration number D661). The
                registration enables Neurotrade Spain, S.L. to provide crypto
                asset exchange and custody services.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">OTHER LEGAL MATTERS</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">
                Restricted Jurisdictions
              </h3>
              <p>
                Please see the List of Prohibited Countries and the Neurotrade
                Terms of Use for restrictions and eligibility requirements to
                open and maintain an account with Neurotrade.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">KYC</h3>
              <p>
                Neurotrade requires mandatory KYC to be undertaken to onboard
                any users in order to comply with legal and regulatory
                obligations including, but not limited to, rules governing
                anti-money laundering, counter-terrorism financing, and
                sanctions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Restrictions</h3>
              <p>
                We have notices regarding certain restrictions placed on our
                products and services which can be accessed here. Users impacted
                by these restrictions are strongly encouraged to review these
                notices and seek independent advice.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

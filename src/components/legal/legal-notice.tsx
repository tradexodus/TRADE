import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function LegalNotice() {
  const navigate = useNavigate();

  const handleDownload = (filename: string, displayName: string) => {
    const link = document.createElement("a");
    link.href = `/documents/${filename}`;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <h2 className="text-xl font-bold">OFFICIAL DOCUMENTS</h2>
          <p className="mb-6">
            Download official platform documentation required for registration
            and government compliance purposes.
          </p>

          <div className="grid md:grid-cols-2 gap-4 not-prose">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Registration Document
                    </CardTitle>
                    <CardDescription>
                      Eden Beta Software Program Agreement
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Official beta program agreement document for platform
                  registration purposes.
                </p>
                <Button
                  onClick={() =>
                    handleDownload(
                      "eden-tos-20201110-v1.pdf",
                      "Registration Document",
                    )
                  }
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Government Documentation
                    </CardTitle>
                    <CardDescription>
                      Exudos Terms of Use Agreement
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Official terms of use document for government compliance and
                  regulatory purposes.
                </p>
                <Button
                  onClick={() =>
                    handleDownload(
                      "Exudos-tos-20250704-v36.pdf",
                      "Government Documentation",
                    )
                  }
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">LICENSES AND REGISTRATIONS</h2>
          <p>
            Exudos Trade© is committed to working closely and collaboratively
            with regulators from around the world. Exudos Trade© currently
            holds the following regulatory licenses, registrations,
            authorizations, and approvals:
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Europe</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">France</h3>
              <p>
                Exudos Trade© France SAS has been granted registration as a
                Digital Asset Service Provider (DASP) by the Autorité des
                Marchés Financiers (AMF) (registration number E2022-037). Exudos
                Trade© France SAS can provide the following regulated services
                in France: digital assets custody; purchase/sale of digital
                assets for legal tender; exchange of digital assets for other
                digital assets; and operation of a trading platform for digital
                assets.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Italy</h3>
              <p>
                Exudos Trade© Italy S.R.L. has been granted a Digital Asset
                Service Provider (DASP) registration by the Organismo Agenti e
                Mediatori (OAM) (registration number PSV5). The registration
                enables Exudos Trade© Italy S.R.L. to provide crypto asset
                exchange and custody services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Spain</h3>
              <p>
                Exudos Trade© Spain, S.L. (Exudos Trade©'s Spanish subsidiary)
                has been granted registration as a Virtual Asset Services
                Provider by the Bank of Spain (registration number D661). The
                registration enables Exudos Trade© Spain, S.L. to provide
                crypto asset exchange and custody services.
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
                Please see the List of Prohibited Countries and the Exudos
                Trade© Terms of Use for restrictions and eligibility
                requirements to open and maintain an account with Exudos
                Trade©.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">KYC</h3>
              <p>
                Exudos Trade© requires mandatory KYC to be undertaken to
                onboard any users in order to comply with legal and regulatory
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

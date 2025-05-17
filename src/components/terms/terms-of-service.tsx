import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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
        <h1 className="text-2xl font-bold">Terms of Use</h1>
      </div>

      <div className="prose prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground">Last Updated: 03 June 2024</p>

        <p>
          These Terms constitute a legally binding agreement between you ("you"
          or "your") and Exodus Trade© ("Exodus Trade©", "we", "our" or "us").
          The Terms govern your use of the Exodus Trade© Services made
          available to you on or through the Platform or otherwise.
        </p>

        <div className="bg-destructive/10 border border-destructive p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold text-destructive">RISK WARNING</h2>
          <p className="text-destructive">
            As with any asset, the value of Digital Assets can fluctuate
            significantly and there is a material risk of economic loss when
            buying, selling, holding or investing in Digital Assets. You should
            therefore consider whether trading or holding Digital Assets is
            suitable for you in light of your financial circumstances.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold">1. Introduction</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">1.1. About us</h3>
              <p>
                The Exodus Trade© group is an ecosystem centred around an
                online exchange for Digital Assets trading. The Exodus Trade©
                group provides users with a trading platform to buy and sell
                Digital Assets, an integrated custody solution allowing users to
                store their Digital Assets and other Digital Asset-related
                services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">1.2. These Terms</h3>
              <p>
                By registering to open an Exodus Trade© Account you are
                entering into a legally binding agreement with us. These Terms
                will govern your use of the Exodus Trade© Services and tell you
                who we are, how we will provide the Exodus Trade© Services to
                you, how these Terms may be changed or terminated, what to do if
                there is a problem, along with other important information.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Eligibility</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                2.1. Eligibility criteria
              </h3>
              <p>
                To be eligible to register for an Exodus Trade© Account and use
                the Exodus Trade© Services, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>be at least 18 years old;</li>
                <li>
                  have full power, authority and capacity to access and use the
                  Neurotrade Services;
                </li>
                <li>
                  not have been previously suspended or removed from using
                  Exodus Trade© Services;
                </li>
                <li>not be a Restricted Person;</li>
                <li>not currently have an existing Exodus Trade© Account;</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. How we contact each other</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                3.1. How you can contact us
              </h3>
              <p>
                For more information on Exodus Trade©, you may refer to the
                information found on our Website. If you have questions,
                feedback or complaints you can contact us via our Customer
                Support team.
              </p>
            </div>
          </div>
        </section>

        {/* Add more sections as needed */}
      </div>
    </div>
  );
}

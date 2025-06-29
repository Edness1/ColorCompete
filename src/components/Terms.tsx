import React from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { MainHeader } from "./header";
import { MainFooter } from "./footer";

const Terms = () => {
  const { user, signOut, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <MainHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            Terms of Service
          </h1>

          <div className="prose prose-lg dark:prose-invert mx-auto space-y-8">
            <p className="text-muted-foreground text-center mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using ColorCompete (&quot;the Service&quot;),
                you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above,
                please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ColorCompete is a digital platform that hosts daily coloring
                contests where users can download line art, color it, and submit
                their artwork for community voting and prizes. The service
                includes both free and paid subscription tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To participate in contests, you must create an account. You are
                responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and current information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                4. Contest Rules and Submissions
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By submitting artwork to our contests, you agree that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Your submission is your original work</li>
                <li>You own all rights to the submitted content</li>
                <li>
                  Your submission does not infringe on any third-party rights
                </li>
                <li>
                  You grant us a non-exclusive license to display your
                  submission
                </li>
                <li>
                  Submissions must be appropriate and follow community
                  guidelines
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                5. Subscription and Payments
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Paid subscriptions provide additional features and submission
                limits. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Pay all fees associated with your chosen plan</li>
                <li>Automatic renewal unless cancelled</li>
                <li>Our refund policy as outlined in our billing terms</li>
                <li>Price changes with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The line art provided by ColorCompete remains our intellectual
                property. Users may color and submit these works for contest
                purposes only. Commercial use of our line art is prohibited
                without explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Prohibited Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Submit inappropriate, offensive, or harmful content</li>
                <li>Manipulate voting or contest results</li>
                <li>
                  Create multiple accounts to circumvent submission limits
                </li>
                <li>Harass or abuse other users</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Privacy and Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy
                Policy to understand how we collect, use, and protect your
                information. By using our service, you consent to our data
                practices as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend accounts that
                violate these terms. Users may cancel their accounts at any time
                through their profile settings. Upon termination, your right to
                use the service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                10. Disclaimers and Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ColorCompete is provided &quot;as is&quot; without warranties of
                any kind. We are not liable for any damages arising from your
                use of the service, including but not limited to direct,
                indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Users
                will be notified of significant changes via email or platform
                notification. Continued use of the service after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                12. Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please
                contact us at legal@colorcompete.com or through our contact
                page.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default Terms;

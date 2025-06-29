import React from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { MainHeader } from "./header";
import { MainFooter } from "./footer";

const Privacy = () => {
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
            Privacy Policy
          </h1>

          <div className="prose prose-lg dark:prose-invert mx-auto space-y-8">
            <p className="text-muted-foreground text-center mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information you provide directly to us, such as when
                you create an account, submit artwork, or contact us. This
                includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Account information (email, username, profile details)</li>
                <li>Submitted artwork and contest entries</li>
                <li>Payment information for subscriptions</li>
                <li>Communications with our support team</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process contest submissions and voting</li>
                <li>Handle payments and subscriptions</li>
                <li>Send important updates and notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                3. Information Sharing
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to
                third parties. We may share your information only in the
                following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in our operations</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. However, no
                method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                5. Cookies and Tracking
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze site usage and performance</li>
                <li>Provide personalized content</li>
                <li>Enable social media features</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can control cookie settings through your browser
                preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Object to certain data processing activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
                If we become aware that we have collected such information, we
                will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in
                countries other than your own. We ensure appropriate safeguards
                are in place to protect your data in accordance with this
                privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to
                provide our services and fulfill the purposes outlined in this
                policy. When you delete your account, we will delete or
                anonymize your personal information within a reasonable
                timeframe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                10. Third-Party Services
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform may contain links to third-party websites or
                services. We are not responsible for the privacy practices of
                these external sites. We encourage you to review their privacy
                policies before providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                11. Changes to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify you of any material changes by posting the new policy on
                this page and updating the &quot;Last updated&quot; date. Your
                continued use of our service after such changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <ul className="list-none text-muted-foreground mt-4">
                <li>Email: privacy@colorcompete.com</li>
                <li>Address: ColorCompete Privacy Team</li>
                <li>Phone: 1-800-COLOR-ART</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default Privacy;

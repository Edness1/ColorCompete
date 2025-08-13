import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";

const Terms = () => {
  const { user, signOut, isLoading } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ColorCompete</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/gallery"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Gallery
            </Link>
            <Link
              to="/leaderboard"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              to="/profile"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/pricing"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isLoading ? (
              <div className="h-9 w-16 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
                <Button size="sm">Sign Up</Button>
              </div>
            )}
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                to="/"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/gallery"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link
                to="/leaderboard"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                to="/profile"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/pricing"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              {user ? (
                <div className="pt-4 border-t border-border space-y-2">
                  <Link
                    to="/profile"
                    className="block font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border space-y-2">
                  <button className="block w-full text-left font-medium text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </button>
                  <button className="block w-full text-left font-medium text-muted-foreground hover:text-primary transition-colors">
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

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
              <h2 className="text-2xl font-bold mb-4">
                3. Age Requirement and User Accounts
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Age Restriction:</strong> ColorCompete is exclusively
                available to users who are 18 years of age or older. By creating
                an account, you represent and warrant that you are at least 18
                years old. We reserve the right to verify your age and terminate
                accounts that do not meet this requirement.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To participate in contests, you must create an account. You are
                responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activities that occur under your account</li>
                <li>
                  Providing accurate and current information, including your age
                </li>
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
                <li>
                  Misrepresent their age or provide false age verification
                  information
                </li>
                <li>Allow minors (under 18) to use their account</li>
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
      <footer className="bg-muted/40 border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <a
                href="https://www.instagram.com/colorcompete"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Follow us on Instagram"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@colorcompete"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Follow us on TikTok"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@colorcompete"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Subscribe to our YouTube channel"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
            <div className="flex space-x-6">
              <Link
                to="/about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/faq"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/terms"
                className="text-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
          <Separator />
          <div className="pt-6 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} ColorCompete. All rights
              reserved.
            </p>
            <p className="mt-2">
              A portion of all submission fees is donated to support art
              education programs for underserved communities.
            </p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Palette className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ColorCompete</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;

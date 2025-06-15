import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "./ui/use-toast";

const Pricing = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { createSubscriptionCheckout, tier: currentTier } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleSubscribe = async (planTier: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow subscribing to the same plan
    if (planTier === currentTier) {
      toast({
        title: "Already subscribed",
        description: `You are already on the ${planTier} plan.`,
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { sessionUrl, error } = await createSubscriptionCheckout(planTier);

      if (error || !sessionUrl) {
        throw new Error(error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process subscription request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pricingPlans = [
    {
      name: "Color Curious",
      tier: "free",
      price: "Free",
      features: [
        "2 submissions/month",
        "Vote on submissions",
        "Basic community badge",
      ],
      ctaText: "Get Started",
      ctaVariant: "outline" as const,
    },
    {
      name: "Color Lite",
      tier: "lite",
      price: "$5/mo",
      features: [
        "5 submissions/month",
        "Access voting + badge",
        "Bonus content unlocks",
      ],
      ctaText: "Choose Plan",
      ctaVariant: "default" as const,
    },
    {
      name: "Color Pro",
      tier: "pro",
      price: "$10/mo",
      features: [
        "20 submissions/month",
        "Priority feedback",
        "Pro coloring tools",
      ],
      ctaText: "Choose Plan",
      ctaVariant: "default" as const,
    },
    {
      name: "Color Champ",
      tier: "champ",
      price: "$20/mo",
      features: [
        "Unlimited submissions",
        "Judge spotlight access",
        "Exclusive prize contests",
      ],
      ctaText: "Go All-In",
      ctaVariant: "default" as const,
    },
  ];

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
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {authLoading ? (
              <div className="h-9 w-16 bg-muted animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
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
              <>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
                <Button size="sm">Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pick a plan that fits your creativity
          </p>
        </section>

        {/* Pricing Plans */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className="relative flex flex-col">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">
                      {plan.price}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.ctaVariant}
                    className="w-full mt-auto"
                    size="lg"
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : plan.ctaText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Additional Options */}
        <section className="text-center bg-muted/40 rounded-xl p-8">
          <p className="text-muted-foreground">
            Also available: <strong>Pay-per-entry</strong> for $2.99 each, and{" "}
            <strong>Gift Packs</strong> & Classroom Licenses. No ads. Cancel
            anytime.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Palette className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ColorCompete</span>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

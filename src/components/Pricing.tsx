import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "./ui/use-toast";
import { MainFooter } from "./footer";
import { MainHeader } from "./header";

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
        "Digital badge for contest wins",
        "Social media shoutout for top 3 finishes",
        "Recognition in community gallery",
      ],
      ctaText: "Get Started",
      ctaVariant: "default" as const,
    },
    {
      name: "Color Lite",
      tier: "lite",
      price: "$5/mo",
      features: [
        "5 submissions/month",
        "All Color Curious rewards",
        "Entry into monthly $25 cash prize drawing",
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
        "All Color Lite rewards",
        "Entry into monthly $50 cash prize drawing",
        "Featured artist spotlight opportunities",
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
        "All Color Pro rewards",
        "Entry into monthly $100 cash prize drawing",
        "Custom line art requests",
        "Direct feedback from professional artists",
        "Early access to new features",
      ],
      ctaText: "Go All-In",
      ctaVariant: "default" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <MainHeader />

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

        {/* Rewards Information */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Contest Winner Rewards</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Every contest winner receives rewards based on their subscription
              tier. The higher your tier, the better the rewards!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="font-semibold mb-2">Color Curious & Lite</h3>
                <p className="text-sm text-muted-foreground">
                  Digital achievement badges to showcase your wins on your
                  profile
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">📱</div>
                <h3 className="font-semibold mb-2">Color Pro</h3>
                <p className="text-sm text-muted-foreground">
                  Social media shoutouts featuring your winning artwork
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-semibold mb-2">Color Champ</h3>
                <p className="text-sm text-muted-foreground">
                  Entries into monthly cash prize drawings
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="font-semibold mb-2">All Tiers</h3>
                <p className="text-sm text-muted-foreground">
                  Recognition on leaderboards and in the winner's gallery
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Options */}
        <section className="text-center bg-muted/40 rounded-xl p-8">
          <p className="text-muted-foreground">
            <strong>Gift Packs</strong> & Classroom Licenses. No ads. Cancel
            anytime.
          </p>
        </section>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default Pricing;

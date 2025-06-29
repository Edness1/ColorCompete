import React from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Trophy,
  Star,
  Gift,
  Crown,
  Medal,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { MainHeader } from "./header";
import { MainFooter } from "./footer";

const Rewards = () => {
  const rewardTiers = [
    {
      tier: "Color Curious",
      color: "bg-gray-100",
      icon: <Palette className="h-6 w-6" />,
      rewards: [
        "Digital badge for contest wins",
        "Social media shoutout for top 3 finishes",
        "Recognition in community gallery",
      ],
    },
    {
      tier: "Color Lite",
      color: "bg-blue-100",
      icon: <Star className="h-6 w-6" />,
      rewards: [
        "All Color Curious rewards",
        "Entry into monthly $25 cash prize drawing",
        "Exclusive subscriber-only contests",
        "Priority voting weight (1.5x)",
      ],
    },
    {
      tier: "Color Pro",
      color: "bg-purple-100",
      icon: <Trophy className="h-6 w-6" />,
      rewards: [
        "All Color Lite rewards",
        "Entry into monthly $50 cash prize drawing",
        "Access to premium line art collections",
        "Double voting weight (2x)",
        "Featured artist spotlight opportunities",
      ],
    },
    {
      tier: "Color Champ",
      color: "bg-yellow-100",
      icon: <Crown className="h-6 w-6" />,
      rewards: [
        "All Color Pro rewards",
        "Entry into monthly $100 cash prize drawing",
        "Custom line art requests",
        "Triple voting weight (3x)",
        "Direct feedback from professional artists",
        "Early access to new features",
      ],
    },
  ];

  const digitalBadges = [
    {
      name: "First Win",
      description: "Awarded for your first contest victory",
      icon: <Medal className="h-8 w-8 text-yellow-500" />,
    },
    {
      name: "Hat Trick",
      description: "Win 3 contests in a row",
      icon: <Trophy className="h-8 w-8 text-gold-500" />,
    },
    {
      name: "People's Choice",
      description: "Receive the most community votes",
      icon: <Star className="h-8 w-8 text-blue-500" />,
    },
    {
      name: "Consistency King",
      description: "Submit to 30 consecutive daily contests",
      icon: <Award className="h-8 w-8 text-green-500" />,
    },
    {
      name: "Master Artist",
      description: "Win 10 total contests",
      icon: <Crown className="h-8 w-8 text-purple-500" />,
    },
    {
      name: "Community Favorite",
      description: "Accumulate 1000 total votes",
      icon: <Sparkles className="h-8 w-8 text-pink-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MainHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Gift className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Rewards & Prizes</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the amazing rewards waiting for you! From digital badges to
            cash prizes, we celebrate your creativity and dedication.
          </p>
        </section>

        {/* Cash Prize Information */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="h-12 w-12 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-800">
                Monthly Cash Prize Drawings
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Subscribers are automatically entered into monthly cash prize
                drawings based on their subscription tier. The more you
                participate, the better your chances!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <Badge variant="secondary" className="mb-2">
                    Color Lite
                  </Badge>
                  <p className="text-2xl font-bold text-blue-600">$25</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly Drawing
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <Badge variant="secondary" className="mb-2">
                    Color Pro
                  </Badge>
                  <p className="text-2xl font-bold text-purple-600">$50</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly Drawing
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <Badge variant="secondary" className="mb-2">
                    Color Champ
                  </Badge>
                  <p className="text-2xl font-bold text-yellow-600">$100</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly Drawing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Subscription Tier Rewards */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Subscription Tier Rewards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewardTiers.map((tier, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className={`h-2 ${tier.color}`}></div>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {tier.icon}
                  </div>
                  <CardTitle className="text-lg">{tier.tier}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.rewards.map((reward, rewardIndex) => (
                      <li key={rewardIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{reward}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Digital Badges */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Digital Achievement Badges
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unlock these special badges by achieving milestones in your coloring
            journey. Show off your accomplishments on your profile!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {digitalBadges.map((badge, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{badge.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How Rewards Work */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            How Rewards Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Palette className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Participate</h3>
                  <p className="text-muted-foreground">
                    Submit your colored artwork to daily contests and engage
                    with the community.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Achieve</h3>
                  <p className="text-muted-foreground">
                    Win contests, earn votes, and complete milestones to unlock
                    badges and rewards.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Collect</h3>
                  <p className="text-muted-foreground">
                    Display your badges, enter prize drawings, and enjoy
                    exclusive perks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-primary/5 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Earning Rewards?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our community today and start your journey towards amazing
            prizes and recognition. Every submission gets you closer to your
            next reward!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/pricing">
              <Button size="lg">View Subscription Plans</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg">
                Start Coloring Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default Rewards;

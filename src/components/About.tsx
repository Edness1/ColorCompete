import React from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { MainFooter } from "./footer";

const About = () => {
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
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isLoading ? (
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            About ColorCompete
          </h1>

          <div className="prose prose-lg dark:prose-invert mx-auto space-y-6">
            <p className="text-xl leading-relaxed">
              ColorCompete is where creativity meets friendly competition.
              Designed for artists of all skill levels, our platform
              hosts digital coloring contests that are fun, rewarding, and
              community-driven.
            </p>

            <p className="text-lg leading-relaxed">
              Whether you're coloring to relax, to win, or to express yourself,
              ColorCompete gives you the space to shine. Submit your
              masterpiece, vote on others, climb the leaderboard, and unlock
              special features along the way.
            </p>

            <p className="text-lg leading-relaxed">
              With themed challenges, real rewards, and tools for both digital
              and traditional mediums, ColorCompete is more than just an
              app—it's a movement powered by color and community.
            </p>
          </div>

          <div className="mt-12 bg-primary/5 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Join Our Colorful Community
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Ready to showcase your talent and connect with fellow artists?
              Start your ColorCompete journey today!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg">Start Coloring Today</Button>
              <Link to="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default About;

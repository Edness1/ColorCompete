import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";

const About = () => {
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
              className="font-medium text-foreground hover:text-primary transition-colors"
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
                className="block font-medium text-foreground hover:text-primary transition-colors"
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            About ColorCompete
          </h1>

          <div className="prose prose-lg dark:prose-invert mx-auto space-y-6">
            <p className="text-xl leading-relaxed">
              ColorCompete is where creativity meets friendly competition.
              Designed for artists of all ages and skill levels, our platform
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

            <p className="text-lg leading-relaxed">
              In a world where screens dominate our daily lives, ColorCompete
              offers a mindful alternative that encourages you to step away from
              endless scrolling and into the therapeutic world of color. We
              believe in fostering deeper connections—with yourself, your
              creativity, and the people around you—through the simple yet
              powerful act of coloring.
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
              <Link to="/pricing">
                <Button size="lg">Start Coloring Today</Button>
              </Link>
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
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z" />
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
                className="text-foreground hover:text-primary transition-colors"
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
                className="text-muted-foreground hover:text-foreground transition-colors"
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

export default About;

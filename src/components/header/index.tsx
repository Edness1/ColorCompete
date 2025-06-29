import { 
    Palette,
    User,
    LogOut, } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "../auth/AuthModal";

export const MainHeader = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
    "signin",
  );
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
    <header className="sticky top-0 z-10 bg-background border-b border-border">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
        <Palette className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">ColorCompete</h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
        <Link
            to="/"
            className="font-medium text-foreground hover:text-primary transition-colors"
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
            to="/rewards"
            className="font-medium text-muted-foreground hover:text-primary transition-colors"
        >
            Rewards
        </Link>
        <Link
            to="/pricing"
            className="font-medium text-muted-foreground hover:text-primary transition-colors"
        >
            Pricing
        </Link>
        {user?.isAdmin && (
            <Link
                to="/admin"
                className="font-medium text-destructive hover:text-primary transition-colors"
            >
                Dashboard
            </Link>
        )}
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
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                setAuthModalTab("signin");
                setAuthModalOpen(true);
                }}
            >
                Sign In
            </Button>
            <Button
                size="sm"
                onClick={() => {
                setAuthModalTab("signup");
                setAuthModalOpen(true);
                }}
            >
                Sign Up
            </Button>
            </>
        )}
        </div>
    </div>

    {/* Auth Modal */}
    <AuthModal
    isOpen={authModalOpen}
    onClose={() => setAuthModalOpen(false)}
    defaultTab={authModalTab}
    />
    </header>
  );
}
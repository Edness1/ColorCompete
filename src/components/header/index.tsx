import { 
    Palette,
    User,
    LogOut,
    Menu,
    X,
 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "../auth/AuthModal";

export const MainHeader = () => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
    const [mobileOpen, setMobileOpen] = useState(false);
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
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring focus-visible:ring-primary"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen(o => !o)}
                    >
                        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                    <div className="flex items-center space-x-2">
                        <Palette className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold">ColorCompete</h1>
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        to="/"
                        className="font-medium text-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/gallery"
                        className="font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Gallery
                    </Link>
                    <Link
                        to="/leaderboard"
                        className="font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Leaderboard
                    </Link>
                    <Link
                        to="/rewards"
                        className="font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Rewards
                    </Link>
                        <Link
                            to="/pricing"
                            className="font-medium text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Pricing
                        </Link>
                    <Link
                        to="/contact"
                        className="font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Contact
                    </Link>
                    {user?.isAdmin && (
                        <Link
                            to="/admin"
                            className="font-medium text-destructive hover:text-primary transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Dashboard
                        </Link>
                    )}
                </nav>

                {/* Desktop Auth / Profile Actions */}
                <div className="hidden md:flex items-center space-x-4">
                    {isLoading ? (
                        <div className="h-9 w-16 bg-muted animate-pulse rounded-md"></div>
                    ) : user ? (
                        <div className="flex items-center space-x-4">
                            <Link to="/profile" onClick={() => setMobileOpen(false)}>
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

                {/* Mobile Spacer for actions (right side) */}
                <div className="md:hidden flex items-center justify-end">
                    {isLoading ? (
                        <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
                    ) : !user ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setAuthModalTab("signin");
                                setAuthModalOpen(true);
                                setMobileOpen(false);
                            }}
                        >
                            Sign In
                        </Button>
                    ) : null}
                </div>
            </div>

                    {/* Mobile Menu Panel (overlay) */}
                    <div
                        className={`md:hidden absolute left-0 right-0 top-full w-full shadow-lg border-b border-border bg-background overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${mobileOpen ? 'max-h-[650px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                        aria-hidden={!mobileOpen}
                    >
                        <div className="px-4 pb-4">
                    <nav className="flex flex-col py-3 space-y-2">
                        <Link
                            to="/"
                            className="px-2 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/gallery"
                            className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Gallery
                        </Link>
                        <Link
                            to="/leaderboard"
                            className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            to="/rewards"
                            className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Rewards
                        </Link>
                        <Link
                            to="/pricing"
                            className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/contact"
                            className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            Contact
                        </Link>
                        {user?.isAdmin && (
                            <Link
                                to="/admin"
                                className="px-2 py-2 rounded-md text-sm font-medium text-destructive hover:text-foreground hover:bg-muted transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                Dashboard
                            </Link>
                        )}
                    </nav>
                                <div className="border-t border-border pt-3 flex flex-col gap-2">
                        {isLoading ? (
                            <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
                        ) : user ? (
                            <>
                                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                                        <User className="h-4 w-4" /> Profile
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                                    className="w-full justify-start gap-2"
                                >
                                    <LogOut className="h-4 w-4" /> Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => { setAuthModalTab("signin"); setAuthModalOpen(true); setMobileOpen(false); }}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => { setAuthModalTab("signup"); setAuthModalOpen(true); setMobileOpen(false); }}
                                >
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </div>
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
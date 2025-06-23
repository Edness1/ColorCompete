import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { API_URL } from "@/lib/utils";

type SubscriptionTier = "free" | "lite" | "pro" | "champ";

type SubscriptionContextType = {
  tier: SubscriptionTier;
  remainingSubmissions: number;
  isLoading: boolean;
  refreshSubscriptionData: () => Promise<void>;
  deductSubmission: () => Promise<boolean>;
  getSubmissionFee: () => number | null;
  createCheckoutSession: (
    contestId: string,
  ) => Promise<{ sessionUrl: string | null; error: string | null }>;
  createSubscriptionCheckout: (
    planTier: string,
  ) => Promise<{ sessionUrl: string | null; error: string | null }>;
  verifyPaymentSession: (
    sessionId: string,
  ) => Promise<{ success: boolean; error: string | null }>;
};

const tierSubmissionLimits = {
  free: 2,
  lite: 5,
  pro: 20,
  champ: 999,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [remainingSubmissions, setRemainingSubmissions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stripe public key (replace with your actual key)
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

  useEffect(() => {
    if (user) {
      refreshSubscriptionData();
    } else {
      setTier("free");
      setRemainingSubmissions(tierSubmissionLimits.free);
      setIsLoading(false);
    }
  }, [user]);

  const refreshSubscriptionData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subscription?userId=${user._id}`);
      if (!res.ok) throw new Error("Failed to fetch subscription");
      const data = await res.json();

      if (!data.subscription) {
        // Create free tier if not found
        const now = new Date();
        await fetch(`${API_URL}/api/subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            tier: "free",
            remaining_submissions: tierSubmissionLimits.free,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          }),
        });
        setTier("free");
        setRemainingSubmissions(tierSubmissionLimits.free);
      } else {
        const { tier, remaining_submissions, month, year } = data.subscription;
        const now = new Date();
        if (month !== now.getMonth() + 1 || year !== now.getFullYear()) {
          // Reset for new month
          await fetch(`${API_URL}/api/subscription`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              remaining_submissions: tierSubmissionLimits[tier as SubscriptionTier],
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            }),
          });
          setTier(tier as SubscriptionTier);
          setRemainingSubmissions(tierSubmissionLimits[tier as SubscriptionTier]);
        } else {
          setTier(tier as SubscriptionTier);
          setRemainingSubmissions(remaining_submissions);
        }
      }
    } catch (error) {
      setTier("free");
      setRemainingSubmissions(tierSubmissionLimits.free);
    } finally {
      setIsLoading(false);
    }
  };

  const deductSubmission = async (): Promise<boolean> => {
    if (!user) return false;
    if (remainingSubmissions <= 0) return false;
    try {
      const res = await fetch(`${API_URL}/api/subscription/deduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      if (!res.ok) throw new Error("Failed to deduct submission");
      setRemainingSubmissions((prev) => prev - 1);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getSubmissionFee = (): number | null => {
    if (remainingSubmissions > 0) return null;
    return 2.99;
  };

  // Stripe Checkout for single submission
  const createCheckoutSession = async (contestId: string) => {
    if (!user) {
      return { sessionUrl: null, error: "User not authenticated" };
    }
    try {
      const res = await fetch(`${API_URL}/api/stripe/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          contestId,
          returnUrl: `${window.location.origin}/payment-success`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        return { sessionUrl: null, error: data.error || "No session ID returned" };
      }
      // Use Stripe.js to redirect
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
      return { sessionUrl: data.sessionId, error: null };
    } catch (error) {
      return { sessionUrl: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  // Stripe Checkout for subscription
  const createSubscriptionCheckout = async (planTier: string) => {
    if (!user) {
      return { sessionUrl: null, error: "User not authenticated" };
    }
    try {
      const res = await fetch(`${API_URL}/api/stripe/subscription-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          planTier,
          returnUrl: `${window.location.origin}/payment-success`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        return { sessionUrl: null, error: data.error || "No session ID returned" };
      }
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
      return { sessionUrl: data.sessionId, error: null };
    } catch (error) {
      return { sessionUrl: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const verifyPaymentSession = async (sessionId: string) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    try {
      const res = await fetch(`${API_URL}/api/stripe/verify-session?sessionId=${sessionId}&userId=${user.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Payment verification failed" };
      }
      await refreshSubscriptionData();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const value = {
    tier,
    remainingSubmissions,
    isLoading,
    refreshSubscriptionData,
    deductSubmission,
    getSubmissionFee,
    createCheckoutSession,
    createSubscriptionCheckout,
    verifyPaymentSession,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {/* Optionally wrap children in <Elements> if you use Stripe Elements elsewhere */}
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if ( context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}

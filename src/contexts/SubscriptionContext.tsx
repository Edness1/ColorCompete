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
  refreshSubscriptionData: () => Promise<{ tier: SubscriptionTier; remaining_submissions: number } | null>;
  deductSubmission: () => Promise<boolean>;
  getSubmissionFee: () => number | null;
  // Immediately apply a subscription snapshot returned from the API (e.g. createSubmission response)
  applyServerSubscription: (sub: { tier?: string | null; remaining_submissions?: number }) => void;
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
    if (!user) return null;
    setIsLoading(true);
    try {
      // Get or ensure the single subscription doc; server will reset if a new month started
      const res = await fetch(`${API_URL}/api/subscription?userId=${user._id}`);
      if (!res.ok) throw new Error("Failed to fetch subscription");
      const data = await res.json();
      let sub = data.subscription;
      if (!sub) {
        // Ensure doc exists
        const ensure = await fetch(`${API_URL}/api/subscription/ensure-current`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user._id, tier: 'free' })
        });
        if (ensure.ok) {
          sub = await ensure.json();
        } else {
          // Keep previous state if ensure fails
          return null;
        }
      }
      const validTier = (sub.tier || 'free') as SubscriptionTier;
      const remaining = typeof sub.remaining_submissions === 'number' ? sub.remaining_submissions : tierSubmissionLimits[validTier];
      setTier(validTier);
      setRemainingSubmissions(remaining);
      return { tier: validTier, remaining_submissions: remaining };
    } catch (error) {
      // Keep existing state on failure to avoid UI showing wrong defaults
      return null;
    } finally {
      setIsLoading(false);
    }
  };

    /**
     * Apply a server-returned subscription object directly to local state without a round-trip fetch.
     * Useful after endpoints that already mutate & return the up-to-date subscription (e.g. createSubmission).
     */
    const applyServerSubscription = (sub: { tier?: string | null; remaining_submissions?: number }) => {
      if (!sub) return;
      if (typeof sub.remaining_submissions === 'number') {
        setRemainingSubmissions(sub.remaining_submissions);
      }
      if (sub.tier) {
        setTier((sub.tier as SubscriptionTier) || 'free');
      }
    };

  const deductSubmission = async (): Promise<boolean> => {
    console.log("deductSubmission called");
    console.log("user:", user);
    console.log("remainingSubmissions:", remainingSubmissions);
    
    if (!user) {
      console.log("No user, returning false");
      return false;
    }
    if (remainingSubmissions <= 0) {
      console.log("No remaining submissions, returning false");
      return false;
    }
    try {
      console.log("Making API call to deduct submission");
      const res = await fetch(`${API_URL}/api/subscription/deduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      
      console.log("API response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error("Failed to deduct submission:", errorData);
        throw new Error(`API Error: ${errorData.message || errorText}`);
      }
      
      console.log("API call successful, updating local state");
      
      // Update local state immediately
      setRemainingSubmissions((prev) => {
        const newValue = prev - 1;
        console.log(`Deducted submission: ${prev} -> ${newValue}`);
        return newValue;
      });
      
      return true;
    } catch (error) {
      console.error("Error in deductSubmission:", error);
      // Refresh subscription data to sync with server
      console.log("Refreshing subscription data...");
      await refreshSubscriptionData();
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
      localStorage.setItem('sessionId', data.sessionId || '');
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
      const res = await fetch(`${API_URL}/api/stripe/verify-session?sessionId=${sessionId}&userId=${user._id}`);
      const data = await res.json();
      if (!res.ok || data.session.payment_status !== "paid") {
        return { success: false, error: data.error || "Payment verification failed" };
      }
      // Extract purchased tier and submissions from payment session metadata or response
      const purchasedTier = data.session.metadata?.planTier; // fallback or adjust as needed
      const purchasedSubmissions = tierSubmissionLimits[purchasedTier as SubscriptionTier];
      
      // Update or create single subscription doc: bump tier and add the purchased submissions to remaining
      // First fetch current to get remaining
      let currentRemaining = 0;
      try {
        const cur = await fetch(`${API_URL}/api/subscription?userId=${user._id}`);
        if (cur.ok) {
          const curData = await cur.json();
          currentRemaining = curData.subscription?.remaining_submissions || 0;
        }
      } catch {}
      await fetch(`${API_URL}/api/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          tier: purchasedTier,
          remaining_submissions: currentRemaining + purchasedSubmissions,
        }),
      });

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
    applyServerSubscription,
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

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
        console.log("Subscription data:", data.subscription);
        const { tier, remaining_submissions, month, year } = data.subscription;
        
        // Handle null tier by defaulting to "free"
        const validTier = tier || "free";
        
        const now = new Date();
        if (month !== now.getMonth() + 1 || year !== now.getFullYear()) {
          // Reset for new month
          await fetch(`${API_URL}/api/subscription`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              tier: validTier,
              remaining_submissions: tierSubmissionLimits[validTier as SubscriptionTier],
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            }),
          });
          setTier(validTier as SubscriptionTier);
          setRemainingSubmissions(tierSubmissionLimits[validTier as SubscriptionTier]);
        } else {
          // If tier is null, update the database to fix it
          if (!tier) {
            console.log("Tier is null, updating database to set tier to 'free'");
            await fetch(`${API_URL}/api/subscription`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user._id,
                tier: "free",
                remaining_submissions: remaining_submissions,
                month: month,
                year: year,
              }),
            });
          }
          
          setTier(validTier as SubscriptionTier);
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

      // Fetch current subscription to get existing remaining submissions
      let currentRemaining = 0;
      try {
        const subRes = await fetch(`${API_URL}/api/subscription?userId=${user._id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          currentRemaining = subData.subscription?.remaining_submissions || 0;
        }
      } catch (e) {
        // If fetch fails, assume 0
        currentRemaining = 0;
      }

      // Update or create subscription with sum of current and purchased submissions
      await fetch(`${API_URL}/api/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          tier: purchasedTier,
          remaining_submissions: currentRemaining + purchasedSubmissions,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
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

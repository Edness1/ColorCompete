import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

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
  champ: 999, // Effectively unlimited
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [remainingSubmissions, setRemainingSubmissions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch subscription data whenever the user changes
  useEffect(() => {
    if (user) {
      refreshSubscriptionData();
    } else {
      // Reset to defaults when logged out
      setTier("free");
      setRemainingSubmissions(tierSubmissionLimits.free);
      setIsLoading(false);
    }
  }, [user]);

  const refreshSubscriptionData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's subscription data
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        console.error("Error fetching subscription:", subscriptionError);
        throw subscriptionError;
      }

      // If no subscription found, create a free tier entry
      if (!subscriptionData) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { error: insertError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            tier: "free",
            remaining_submissions: tierSubmissionLimits.free,
            month: currentMonth,
            year: currentYear,
          });

        if (insertError) {
          console.error("Error creating subscription:", insertError);
          throw insertError;
        }

        setTier("free");
        setRemainingSubmissions(tierSubmissionLimits.free);
      } else {
        // Check if we need to reset monthly submissions
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (
          subscriptionData.month !== currentMonth ||
          subscriptionData.year !== currentYear
        ) {
          // Reset submissions for the new month
          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .update({
              remaining_submissions:
                tierSubmissionLimits[subscriptionData.tier as SubscriptionTier],
              month: currentMonth,
              year: currentYear,
            })
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
            throw updateError;
          }

          setTier(subscriptionData.tier as SubscriptionTier);
          setRemainingSubmissions(
            tierSubmissionLimits[subscriptionData.tier as SubscriptionTier],
          );
        } else {
          // Use existing data
          setTier(subscriptionData.tier as SubscriptionTier);
          setRemainingSubmissions(subscriptionData.remaining_submissions);
        }
      }
    } catch (error) {
      console.error("Subscription data error:", error);
      // Fallback to free tier on error
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
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          remaining_submissions: remainingSubmissions - 1,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setRemainingSubmissions((prev) => prev - 1);
      return true;
    } catch (error) {
      console.error("Error deducting submission:", error);
      return false;
    }
  };

  const getSubmissionFee = (): number | null => {
    // If user has remaining submissions, no fee
    if (remainingSubmissions > 0) return null;

    // Pay-per-submission fee for those who've used up their quota
    return 2.99;
  };

  // Create a checkout session for a single submission payment
  const createCheckoutSession = async (contestId: string) => {
    if (!user || !session) {
      return { sessionUrl: null, error: "User not authenticated" };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-payment_api",
        {
          body: {
            contestId,
            returnUrl: `${window.location.origin}/payment-success`,
          },
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Error creating checkout session:", error);
        return { sessionUrl: null, error: error.message };
      }

      if (!data?.sessionUrl) {
        return {
          sessionUrl: null,
          error: "No session URL returned from payment API",
        };
      }

      return { sessionUrl: data.sessionUrl, error: null };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return {
        sessionUrl: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Create a checkout session for a subscription plan
  const createSubscriptionCheckout = async (planTier: string) => {
    if (!user || !session) {
      return { sessionUrl: null, error: "User not authenticated" };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-payment_api",
        {
          body: {
            planTier,
            returnUrl: `${window.location.origin}/payment-success`,
          },
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Error creating subscription checkout:", error);
        return { sessionUrl: null, error: error.message };
      }

      if (!data?.sessionUrl) {
        return {
          sessionUrl: null,
          error: "No session URL returned from payment API",
        };
      }

      return { sessionUrl: data.sessionUrl, error: null };
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      return {
        sessionUrl: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Verify a payment session
  const verifyPaymentSession = async (sessionId: string) => {
    if (!user || !session) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-payment_api",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          queryParams: { session_id: sessionId },
        },
      );

      if (error) {
        console.error("Error verifying payment session:", error);
        return { success: false, error: error.message };
      }

      if (data.success) {
        // Refresh subscription data to get updated submission count
        await refreshSubscriptionData();
        return { success: true, error: null };
      }

      return { success: false, error: "Payment verification failed" };
    } catch (error) {
      console.error("Error verifying payment session:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
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
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}

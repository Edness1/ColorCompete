import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { corsHeaders } from "@shared/cors.ts";
import {
  handleCorsOptions,
  createErrorResponse,
  createSuccessResponse,
} from "@shared/utils.ts";
import { Stripe } from "https://esm.sh/stripe@12.18.0?target=deno";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  // Create a Supabase client with the service role key
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Initialize Stripe with the secret key from environment variables
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return createErrorResponse("Stripe secret key is not configured", 500);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  // Get the authorization header from the request
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse("Missing authorization header", 401);
  }

  // Verify the user is authenticated
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return createErrorResponse("Unauthorized", 401);
  }

  // Handle different API endpoints based on the path
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Create a checkout session for a single submission payment
    if (req.method === "POST" && path === "create-checkout-session") {
      const { contestId, returnUrl } = await req.json();

      if (!contestId) {
        return createErrorResponse("Contest ID is required");
      }

      // Check if the contest exists and is active
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .select("id, title, status")
        .eq("id", contestId)
        .eq("status", "active")
        .single();

      if (contestError || !contest) {
        return createErrorResponse("Contest not found or not active");
      }

      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Single Submission",
                description: `One-time submission for ${contest.title}`,
              },
              unit_amount: 299, // $2.99
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          contest_id: contestId,
          payment_type: "single_submission",
        },
        mode: "payment",
        success_url: `${returnUrl || Deno.env.get("FRONTEND_URL")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || Deno.env.get("FRONTEND_URL")}/payment-cancel`,
      });

      // Store the checkout session in the database
      const { error: insertError } = await supabaseAdmin
        .from("payment_sessions")
        .insert({
          user_id: user.id,
          session_id: session.id,
          payment_type: "single_submission",
          amount: 299,
          status: "pending",
          metadata: {
            contest_id: contestId,
          },
        });

      if (insertError) {
        console.error("Error storing checkout session:", insertError);
      }

      return createSuccessResponse({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
      });
    }

    // Verify a payment session
    else if (req.method === "GET" && path === "verify-session") {
      const sessionId = url.searchParams.get("session_id");

      if (!sessionId) {
        return createErrorResponse("Session ID is required");
      }

      // Get the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session || session.payment_status !== "paid") {
        return createErrorResponse("Payment not completed");
      }

      // Check if this session has already been processed
      const { data: existingPayment, error: paymentCheckError } =
        await supabaseAdmin
          .from("payment_sessions")
          .select("id, status")
          .eq("session_id", sessionId)
          .single();

      if (paymentCheckError) {
        return createErrorResponse("Error verifying payment");
      }

      if (existingPayment && existingPayment.status === "completed") {
        return createSuccessResponse({
          success: true,
          message: "Payment already processed",
          alreadyProcessed: true,
        });
      }

      // Update the payment session status
      const { error: updateError } = await supabaseAdmin
        .from("payment_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId);

      if (updateError) {
        return createErrorResponse("Error updating payment status");
      }

      // If this is a single submission payment, grant a one-time submission credit
      if (session.metadata?.payment_type === "single_submission") {
        const { error: creditError } = await supabaseAdmin.rpc(
          "add_one_time_submission_credit",
          {
            user_id: session.metadata.user_id,
          },
        );

        if (creditError) {
          return createErrorResponse("Error granting submission credit");
        }
      }

      return createSuccessResponse({
        success: true,
        message: "Payment verified successfully",
        paymentType: session.metadata?.payment_type,
      });
    }

    // Create a checkout session for a subscription plan
    else if (req.method === "POST" && path === "create-subscription") {
      const { planTier, returnUrl } = await req.json();

      if (!planTier) {
        return createErrorResponse("Plan tier is required");
      }

      // Define prices for each tier with the actual Stripe price IDs (not product IDs)
      const tierPrices = {
        lite:
          Deno.env.get("STRIPE_PRICE_LITE") || "price_1PGnXnJXnJXnJXnJXnJXnJXn",
        pro:
          Deno.env.get("STRIPE_PRICE_PRO") || "price_1PGnXnJXnJXnJXnJXnJXnJXn",
        champ:
          Deno.env.get("STRIPE_PRICE_CHAMP") ||
          "price_1PGnXnJXnJXnJXnJXnJXnJXn",
      };

      const priceId = tierPrices[planTier as keyof typeof tierPrices];
      if (!priceId) {
        return createErrorResponse("Invalid plan tier");
      }

      // Create a checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          payment_type: "subscription",
          plan_tier: planTier,
        },
        mode: "subscription",
        success_url: `${returnUrl || Deno.env.get("FRONTEND_URL")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || Deno.env.get("FRONTEND_URL")}/payment-cancel`,
      });

      // Store the checkout session in the database
      const { error: insertError } = await supabaseAdmin
        .from("payment_sessions")
        .insert({
          user_id: user.id,
          session_id: session.id,
          payment_type: "subscription",
          status: "pending",
          metadata: {
            plan_tier: planTier,
          },
        });

      if (insertError) {
        console.error("Error storing checkout session:", insertError);
      }

      return createSuccessResponse({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
      });
    }

    // Handle webhook events from Stripe
    else if (req.method === "POST" && path === "webhook") {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        return createErrorResponse("Missing stripe signature", 400);
      }

      const body = await req.text();
      let event;

      try {
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        if (!webhookSecret) {
          return createErrorResponse(
            "Stripe webhook secret is not configured",
            500,
          );
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        return createErrorResponse(
          `Webhook signature verification failed: ${err.message}`,
          400,
        );
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;

          // Update payment session status
          const { error: updateError } = await supabaseAdmin
            .from("payment_sessions")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("session_id", session.id);

          if (updateError) {
            console.error("Error updating payment session:", updateError);
          }

          // Handle subscription or one-time payment
          if (session.metadata?.payment_type === "subscription") {
            // Update user's subscription tier
            const { error: subscriptionError } = await supabaseAdmin
              .from("user_subscriptions")
              .update({
                tier: session.metadata.plan_tier,
                remaining_submissions:
                  tierSubmissionLimits[session.metadata.plan_tier],
                subscription_id: session.subscription,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", session.metadata.user_id);

            if (subscriptionError) {
              console.error("Error updating subscription:", subscriptionError);
            }
          } else if (session.metadata?.payment_type === "single_submission") {
            // Grant a one-time submission credit
            const { error: creditError } = await supabaseAdmin.rpc(
              "add_one_time_submission_credit",
              {
                user_id: session.metadata.user_id,
              },
            );

            if (creditError) {
              console.error("Error granting submission credit:", creditError);
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          // Update subscription status
          // This would handle cases like subscription renewal, cancellation, etc.
          break;
        }
      }

      return createSuccessResponse({ received: true });
    }

    // If no matching endpoint
    return createErrorResponse("Endpoint not found", 404);
  } catch (error) {
    console.error("Error in payment API:", error);
    return createErrorResponse("Internal server error", 500);
  }
});

// Define tier submission limits
const tierSubmissionLimits = {
  free: 2,
  lite: 5,
  pro: 20,
  champ: 999, // Effectively unlimited
};

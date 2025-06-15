import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contestId, metricType } = await req.json();

    if (!contestId) {
      return new Response(JSON.stringify({ error: "Contest ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (
      !metricType ||
      !["views", "downloads", "submissions", "votes"].includes(metricType)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Valid metric type is required (views, downloads, submissions, votes)",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Call the increment_contest_analytics function
    const { data, error } = await supabaseAdmin.rpc(
      "increment_contest_analytics",
      { contest_id: contestId, metric: metricType },
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contest ${metricType} tracked successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error tracking contest metric:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to track contest metric",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

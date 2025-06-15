import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { corsHeaders } from "@shared/cors.ts";
import {
  handleCorsOptions,
  createErrorResponse,
  createSuccessResponse,
} from "@shared/utils.ts";

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
    // Handle submission creation
    if (req.method === "POST" && path === "create") {
      const { contestId, imageUrl, title, description } = await req.json();

      if (!contestId || !imageUrl) {
        return createErrorResponse("Contest ID and image URL are required");
      }

      // Check if the contest exists and is active
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .select("id, status")
        .eq("id", contestId)
        .eq("status", "active")
        .single();

      if (contestError || !contest) {
        return createErrorResponse("Contest not found or not active");
      }

      // Create the submission
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("submissions")
        .insert({
          contest_id: contestId,
          user_id: user.id,
          image_url: imageUrl,
          title: title || "Untitled",
          description: description || "",
          status: "pending", // Submissions start as pending for moderation
        })
        .select()
        .single();

      if (submissionError) {
        return createErrorResponse(
          `Failed to create submission: ${submissionError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        message: "Submission created successfully",
        submission,
      });
    }

    // Handle getting user's submissions
    else if (req.method === "GET" && path === "user") {
      const { data: submissions, error: submissionsError } = await supabaseAdmin
        .from("submissions")
        .select("*, contests(title, end_date)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (submissionsError) {
        return createErrorResponse(
          `Failed to fetch submissions: ${submissionsError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        submissions,
      });
    }

    // Handle getting a specific submission
    else if (req.method === "GET" && path === "get") {
      const submissionId = url.searchParams.get("id");

      if (!submissionId) {
        return createErrorResponse("Submission ID is required");
      }

      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("submissions")
        .select("*, contests(title, end_date), profiles(username, avatar_url)")
        .eq("id", submissionId)
        .single();

      if (submissionError) {
        return createErrorResponse(
          `Failed to fetch submission: ${submissionError.message}`,
        );
      }

      // Check if the user is allowed to view this submission
      const isOwner = submission.user_id === user.id;
      const isPublic = submission.status === "approved";

      // Check if user is an admin
      const { data: adminCheck } = await supabaseAdmin
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      const isAdmin = !!adminCheck;

      if (!isPublic && !isOwner && !isAdmin) {
        return createErrorResponse(
          "You don't have permission to view this submission",
          403,
        );
      }

      return createSuccessResponse({
        success: true,
        submission,
      });
    }

    // If no matching endpoint
    return createErrorResponse("Endpoint not found", 404);
  } catch (error) {
    console.error("Error in submission API:", error);
    return createErrorResponse("Internal server error", 500);
  }
});

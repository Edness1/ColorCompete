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

  // Check if the user is an admin
  const { data: adminCheck, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (adminError || !adminCheck) {
    return createErrorResponse("Unauthorized: Admin access required", 403);
  }

  // Handle different API endpoints based on the path
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Create a new contest
    if (req.method === "POST" && path === "create") {
      const {
        title,
        description,
        startDate,
        endDate,
        lineArtUrl,
        status,
        votingEnabled,
      } = await req.json();

      if (!title || !startDate || !endDate || !lineArtUrl) {
        return createErrorResponse(
          "Title, start date, end date, and line art URL are required",
        );
      }

      // Create the contest
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .insert({
          title,
          description: description || "",
          start_date: startDate,
          end_date: endDate,
          line_art_url: lineArtUrl,
          status: status || "scheduled",
          voting_enabled: votingEnabled || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (contestError) {
        return createErrorResponse(
          `Failed to create contest: ${contestError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        message: "Contest created successfully",
        contest,
      });
    }

    // Update an existing contest
    else if (req.method === "PATCH" && path === "update") {
      const {
        id,
        title,
        description,
        startDate,
        endDate,
        lineArtUrl,
        status,
        votingEnabled,
      } = await req.json();

      if (!id) {
        return createErrorResponse("Contest ID is required");
      }

      // Build the update object with only the fields that are provided
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (lineArtUrl !== undefined) updateData.line_art_url = lineArtUrl;
      if (status !== undefined) updateData.status = status;
      if (votingEnabled !== undefined)
        updateData.voting_enabled = votingEnabled;

      // Update the contest
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (contestError) {
        return createErrorResponse(
          `Failed to update contest: ${contestError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        message: "Contest updated successfully",
        contest,
      });
    }

    // Get contest analytics
    else if (req.method === "GET" && path === "analytics") {
      const contestId = url.searchParams.get("id");

      if (!contestId) {
        return createErrorResponse("Contest ID is required");
      }

      // Get the contest details and analytics
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .select(
          `
          *,
          analytics:contest_analytics(*),
          submission_count:submissions(count),
          approved_submissions:submissions(count).eq(status, 'approved'),
          pending_submissions:submissions(count).eq(status, 'pending')
        `,
        )
        .eq("id", contestId)
        .single();

      if (contestError) {
        return createErrorResponse(
          `Failed to fetch contest: ${contestError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        contest: {
          ...contest,
          analytics: contest.analytics[0] || {
            views: 0,
            downloads: 0,
            submissions: 0,
            votes: 0,
          },
          submission_count: contest.submission_count[0]?.count || 0,
          approved_submissions: contest.approved_submissions[0]?.count || 0,
          pending_submissions: contest.pending_submissions[0]?.count || 0,
        },
      });
    }

    // Moderate a submission (approve/reject)
    else if (req.method === "POST" && path === "moderate") {
      const { submissionId, action, reason } = await req.json();

      if (!submissionId || !action || !["approve", "reject"].includes(action)) {
        return createErrorResponse(
          "Submission ID and valid action (approve/reject) are required",
        );
      }

      // Update the submission status
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("submissions")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          moderation_notes: reason || "",
          moderated_at: new Date().toISOString(),
          moderated_by: user.id,
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (submissionError) {
        return createErrorResponse(
          `Failed to moderate submission: ${submissionError.message}`,
        );
      }

      return createSuccessResponse({
        success: true,
        message: `Submission ${action === "approve" ? "approved" : "rejected"} successfully`,
        submission,
      });
    }

    // If no matching endpoint
    return createErrorResponse("Endpoint not found", 404);
  } catch (error) {
    console.error("Error in contest management API:", error);
    return createErrorResponse("Internal server error", 500);
  }
});

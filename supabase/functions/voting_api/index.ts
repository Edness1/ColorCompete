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
    // Handle voting on a submission
    if (req.method === "POST" && path === "cast") {
      const { submissionId } = await req.json();

      if (!submissionId) {
        return createErrorResponse("Submission ID is required");
      }

      // Check if the submission exists and is approved
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from("submissions")
        .select("id, contest_id, user_id, status")
        .eq("id", submissionId)
        .eq("status", "approved")
        .single();

      if (submissionError || !submission) {
        return createErrorResponse("Submission not found or not approved");
      }

      // Check if the contest is still active
      const { data: contest, error: contestError } = await supabaseAdmin
        .from("contests")
        .select("id, status, voting_enabled")
        .eq("id", submission.contest_id)
        .eq("status", "active")
        .single();

      if (contestError || !contest) {
        return createErrorResponse("Contest not found or not active");
      }

      if (!contest.voting_enabled) {
        return createErrorResponse("Voting is not enabled for this contest");
      }

      // Prevent users from voting on their own submissions
      if (submission.user_id === user.id) {
        return createErrorResponse("You cannot vote on your own submission");
      }

      // Check if the user has already voted for this submission
      const { data: existingVote, error: voteCheckError } = await supabaseAdmin
        .from("votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("submission_id", submissionId)
        .single();

      if (existingVote) {
        return createErrorResponse(
          "You have already voted for this submission",
        );
      }

      // Create the vote
      const { data: vote, error: voteError } = await supabaseAdmin
        .from("votes")
        .insert({
          user_id: user.id,
          submission_id: submissionId,
          contest_id: submission.contest_id,
        })
        .select()
        .single();

      if (voteError) {
        return createErrorResponse(`Failed to cast vote: ${voteError.message}`);
      }

      // Increment the contest analytics for votes
      await supabaseAdmin.rpc("increment_contest_analytics", {
        contest_id: submission.contest_id,
        metric: "votes",
      });

      return createSuccessResponse({
        success: true,
        message: "Vote cast successfully",
        vote,
      });
    }

    // Handle checking if a user has voted for a submission
    else if (req.method === "GET" && path === "check") {
      const submissionId = url.searchParams.get("submissionId");

      if (!submissionId) {
        return createErrorResponse("Submission ID is required");
      }

      const { data: vote, error: voteError } = await supabaseAdmin
        .from("votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("submission_id", submissionId)
        .single();

      return createSuccessResponse({
        hasVoted: !!vote,
      });
    }

    // Handle getting vote counts for submissions in a contest
    else if (req.method === "GET" && path === "counts") {
      const contestId = url.searchParams.get("contestId");

      if (!contestId) {
        return createErrorResponse("Contest ID is required");
      }

      // Get all submissions for the contest with their vote counts
      const { data: submissions, error: submissionsError } = await supabaseAdmin
        .from("submissions")
        .select(
          `
          id, 
          title, 
          image_url, 
          user_id, 
          profiles(username, avatar_url),
          vote_count:votes(count)
        `,
        )
        .eq("contest_id", contestId)
        .eq("status", "approved");

      if (submissionsError) {
        return createErrorResponse(
          `Failed to fetch submissions: ${submissionsError.message}`,
        );
      }

      // Process the results to get the vote count
      const submissionsWithVotes = submissions.map((submission) => ({
        ...submission,
        vote_count: submission.vote_count[0]?.count || 0,
      }));

      return createSuccessResponse({
        success: true,
        submissions: submissionsWithVotes,
      });
    }

    // If no matching endpoint
    return createErrorResponse("Endpoint not found", 404);
  } catch (error) {
    console.error("Error in voting API:", error);
    return createErrorResponse("Internal server error", 500);
  }
});

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useContestAnalytics } from "./useContestAnalytics";

interface UseVotingProps {
  onVoteSuccess?: (submissionId: string, hasVoted: boolean) => void;
  onVoteError?: (error: Error) => void;
}

export function useVoting({
  onVoteSuccess = () => {},
  onVoteError = () => {},
}: UseVotingProps = {}) {
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackVote } = useContestAnalytics();

  // Function to check if a user has voted for a submission
  const checkUserVote = async (submissionId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("submission_id", submissionId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is the error code for no rows returned
        console.error("Error checking vote:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking vote:", error);
      return false;
    }
  };

  // Function to toggle a vote (add or remove)
  const toggleVote = async (submissionId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote for submissions.",
        variant: "destructive",
      });
      return false;
    }

    setIsVoting(true);

    try {
      // Check if the user has already voted for this submission
      const hasVoted = await checkUserVote(submissionId);

      if (hasVoted) {
        // Remove the vote
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq("submission_id", submissionId);

        if (error) throw error;

        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        });

        onVoteSuccess(submissionId, false);
        return false;
      } else {
        // Add a vote
        const { error } = await supabase.from("votes").insert({
          user_id: user.id,
          submission_id: submissionId,
        });

        if (error) throw error;

        toast({
          title: "Vote Recorded",
          description: "Your vote has been counted!",
        });

        // Get the contest ID for the submission to track the vote
        const { data: submissionData } = await supabase
          .from("submissions")
          .select("contest_id")
          .eq("id", submissionId)
          .single();

        if (submissionData?.contest_id) {
          trackVote(submissionData.contest_id);
        }

        onVoteSuccess(submissionId, true);
        return true;
      }
    } catch (error) {
      console.error("Error toggling vote:", error);
      toast({
        title: "Voting Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your vote. Please try again.",
        variant: "destructive",
      });
      onVoteError(error instanceof Error ? error : new Error("Voting failed"));
      return null;
    } finally {
      setIsVoting(false);
    }
  };

  return {
    isVoting,
    toggleVote,
    checkUserVote,
  };
}

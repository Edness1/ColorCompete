import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useContestAnalytics } from "./useContestAnalytics";
import { API_URL } from "@/lib/utils";

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
      const response = await fetch(
        `${API_URL}/api/submissions/submissions/${submissionId}/vote?user_id=${user._id}`,
      );
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.hasVoted;
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
        const response = await fetch(
          `${API_URL}/api/submissions/submissions/${submissionId}/vote`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user._id }),
          },
        );

        if (!response.ok) throw new Error("Failed to remove vote");

        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        });

        onVoteSuccess(submissionId, false);
        return false;
      } else {
        // Add a vote
        const response = await fetch(
          `${API_URL}/api/submissions/submissions/${submissionId}/vote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user._id }),
          },
        );

        if (!response.ok) throw new Error("Failed to record vote");

        toast({
          title: "Vote Recorded",
          description: "Your vote has been counted!",
        });

        // Optionally track vote if your API returns contest_id
        const data = await response.json();
        if (data?.contest_id) {
          trackVote(data.contest_id);
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

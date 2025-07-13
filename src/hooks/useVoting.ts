import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useContestAnalytics } from "./useContestAnalytics";
import { API_URL } from "@/lib/utils";

interface UseVotingProps {
  onVoteSuccess?: (submissionId: string, hasVoted: boolean, newVoteCount?: number) => void;
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
  const toggleVote = async (submissionId: string, currentHasVoted?: boolean) => {
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
      // Use the provided currentHasVoted state, or fall back to checking the server
      const hasVoted = currentHasVoted !== undefined ? currentHasVoted : await checkUserVote(submissionId);

      // Determine the action based on current state
      const action = hasVoted ? "DELETE" : "POST";
      const shouldRemove = hasVoted;

      const response = await fetch(
        `${API_URL}/api/submissions/submissions/${submissionId}/vote`,
        {
          method: action,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user._id }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const newVoteCount = data.voteCount || data.vote_count || data.votes;

        if (shouldRemove) {
          toast({
            title: "Vote Removed",
            description: "Your vote has been removed.",
          });
          onVoteSuccess(submissionId, false, newVoteCount);
          return false;
        } else {
          toast({
            title: "Vote Recorded",
            description: "Your vote has been counted!",
          });
          
          // Optionally track vote if your API returns contest_id
          if (data?.contest_id) {
            trackVote(data.contest_id);
          }
          
          onVoteSuccess(submissionId, true, newVoteCount);
          return true;
        }
      } else {
        // If the request failed, try the opposite action
        const oppositeAction = shouldRemove ? "POST" : "DELETE";
        const fallbackResponse = await fetch(
          `${API_URL}/api/submissions/submissions/${submissionId}/vote`,
          {
            method: oppositeAction,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user._id }),
          },
        );

        if (!fallbackResponse.ok) {
          throw new Error(`Failed to ${shouldRemove ? 'add' : 'remove'} vote`);
        }

        const fallbackData = await fallbackResponse.json();
        const newVoteCount = fallbackData.voteCount || fallbackData.vote_count || fallbackData.votes;

        if (!shouldRemove) {
          // We tried to add but failed, so we removed instead
          toast({
            title: "Vote Removed",
            description: "Your vote has been removed.",
          });
          onVoteSuccess(submissionId, false, newVoteCount);
          return false;
        } else {
          // We tried to remove but failed, so we added instead
          toast({
            title: "Vote Recorded",
            description: "Your vote has been counted!",
          });
          
          if (fallbackData?.contest_id) {
            trackVote(fallbackData.contest_id);
          }
          
          onVoteSuccess(submissionId, true, newVoteCount);
          return true;
        }
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

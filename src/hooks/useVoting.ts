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
        `${API_URL}/api/submissions/${submissionId}/vote?user_id=${user._id}`,
      );
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.hasVoted;
    } catch (error) {
      console.error("Error checking vote:", error);
      return false;
    }
  };

  // One-way vote: user can only add a vote once. Subsequent attempts are ignored.
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
      // Determine existing vote state
      const hasVoted = currentHasVoted !== undefined ? currentHasVoted : await checkUserVote(submissionId);
      if (hasVoted) {
        toast({
          title: "Vote Already Counted",
          description: "You have already voted for this submission.",
        });
        onVoteSuccess(submissionId, true);
        return true;
      }

      const response = await fetch(
        `${API_URL}/api/submissions/${submissionId}/vote`,
        {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user._id }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const newVoteCount = data.voteCount || data.vote_count || data.votes;
        toast({
          title: "Vote Recorded",
          description: "Your vote has been counted!",
        });
        if (data?.contest_id) trackVote(data.contest_id);
        onVoteSuccess(submissionId, true, newVoteCount);
        return true;
      } else {
        // Handle voting closed explicitly (403 from server with code VOTING_CLOSED)
        if (response.status === 403) {
          try {
            const errData = await response.json();
            if (errData?.code === 'VOTING_CLOSED') {
              toast({
                title: 'Voting Closed',
                description: 'This contest has ended. Voting is no longer permitted.',
                variant: 'destructive'
              });
              return hasVoted; // keep existing state
            }
            if (errData?.code === 'VOTE_PERMANENT') {
              toast({
                title: 'Vote Permanent',
                description: 'Votes cannot be removed once cast.',
              });
              return true;
            }
          } catch {/* ignore json parse errors */}
        }
        throw new Error('Failed to add vote');
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

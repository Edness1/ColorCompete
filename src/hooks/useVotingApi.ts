import { useState } from "react";
import { useContestAnalytics } from "./useContestAnalytics";
import { API_URL } from "@/lib/utils";

export function useVotingApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackVote } = useContestAnalytics();

  const castVote = async (submissionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Failed to cast vote');
      const data = await res.json();
      if (data?.contest_id) {
        trackVote(data.contest_id);
      }
      return { data, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to cast vote");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const checkVote = async (submissionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions/submissions/${submissionId}/vote`);
      if (!res.ok) return { hasVoted: false, error: null };
      const data = await res.json();
      return { hasVoted: !!data.hasVoted, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to check vote status");
      return { hasVoted: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getVoteCounts = async (contestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions/contests/${contestId}/vote-counts`);
      if (!res.ok) throw new Error('Failed to fetch vote counts');
      const data = await res.json();
      return { data: data.submissions || data, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to fetch vote counts");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    castVote,
    checkVote,
    getVoteCounts,
    loading,
    error,
  };
}

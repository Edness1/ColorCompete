import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useVotingApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const castVote = async (submissionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-voting_api",
        {
          body: { submissionId },
          headers: {
            path: "cast",
          },
        },
      );

      if (error) throw new Error(error.message);
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
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-voting_api",
        {
          headers: {
            path: "check",
          },
          queryParams: { submissionId },
        },
      );

      if (error) throw new Error(error.message);
      return { hasVoted: data.hasVoted, error: null };
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
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-voting_api",
        {
          headers: {
            path: "counts",
          },
          queryParams: { contestId },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.submissions, error: null };
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

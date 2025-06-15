import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ContestData = {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  lineArtUrl: string;
  status?: "draft" | "scheduled" | "active" | "completed" | "cancelled";
  votingEnabled?: boolean;
};

type ModerationAction = {
  submissionId: string;
  action: "approve" | "reject";
  reason?: string;
};

export function useContestManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContest = async (contestData: ContestData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-contest_management",
        {
          body: contestData,
          headers: {
            path: "create",
          },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.contest, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to create contest");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateContest = async (
    id: string,
    contestData: Partial<ContestData>,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-contest_management",
        {
          body: { id, ...contestData },
          headers: {
            path: "update",
          },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.contest, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to update contest");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getContestAnalytics = async (contestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-contest_management",
        {
          headers: {
            path: "analytics",
          },
          queryParams: { id: contestId },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.contest, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to fetch contest analytics");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const moderateSubmission = async ({
    submissionId,
    action,
    reason,
  }: ModerationAction) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-contest_management",
        {
          body: { submissionId, action, reason },
          headers: {
            path: "moderate",
          },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.submission, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to moderate submission");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    createContest,
    updateContest,
    getContestAnalytics,
    moderateSubmission,
    loading,
    error,
  };
}

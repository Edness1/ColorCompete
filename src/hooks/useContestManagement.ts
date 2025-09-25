import { useState } from "react";
import { API_URL } from "@/lib/utils";

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
      const res = await fetch(`${API_URL}/api/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contestData)
      });
      if (!res.ok) throw new Error('Failed to create contest');
      const data = await res.json();
      return { data, error: null };
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
      const res = await fetch(`${API_URL}/api/challenges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contestData)
      });
      if (!res.ok) throw new Error('Failed to update contest');
      const data = await res.json();
      return { data, error: null };
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
      const res = await fetch(`${API_URL}/api/challenges/analytics/contest-analytics`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const list = await res.json();
      const item = list.find((a: any) => a.contest_id === contestId);
      return { data: item, error: null };
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
      const res = await fetch(`${API_URL}/api/submissions/${submissionId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });
      if (!res.ok) throw new Error('Failed to moderate submission');
      const data = await res.json();
      return { data, error: null };
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

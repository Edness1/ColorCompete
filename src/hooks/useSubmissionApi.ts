import { useState } from "react";
import { API_URL } from "@/lib/utils";

export function useSubmissionApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubmission = async (
    contestId: string,
    imageUrl: string,
    title?: string,
    description?: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId, imageUrl, title, description })
      });
      if (!res.ok) throw new Error('Failed to create submission');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to create submission");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getUserSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions/user`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      return { data: data.submissions || data, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to fetch submissions");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = async (submissionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/submissions/${submissionId}`);
      if (!res.ok) throw new Error('Failed to fetch submission');
      const data = await res.json();
      return { data: data.submission || data, error: null };
    } catch (err: any) {
      setError(err.message || "Failed to fetch submission");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubmission,
    getUserSubmissions,
    getSubmission,
    loading,
    error,
  };
}

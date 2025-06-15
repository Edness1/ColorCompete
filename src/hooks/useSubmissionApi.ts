import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-submission_api",
        {
          body: { contestId, imageUrl, title, description },
          headers: {
            path: "create",
          },
        },
      );

      if (error) throw new Error(error.message);
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
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-submission_api",
        {
          headers: {
            path: "user",
          },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.submissions, error: null };
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
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-submission_api",
        {
          headers: {
            path: "get",
          },
          queryParams: { id: submissionId },
        },
      );

      if (error) throw new Error(error.message);
      return { data: data.submission, error: null };
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

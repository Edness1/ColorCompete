import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

type MetricType = "views" | "downloads" | "submissions" | "votes";

export function useContestAnalytics() {
  const trackMetric = useCallback(
    async (contestId: string, metricType: MetricType) => {
      if (!contestId) return;

      try {
        await supabase.functions.invoke(
          "supabase-functions-track_contest_view",
          {
            body: { contestId, metricType },
          },
        );
      } catch (error) {
        console.error(
          `Error tracking ${metricType} for contest ${contestId}:`,
          error,
        );
      }
    },
    [],
  );

  const trackView = useCallback(
    (contestId: string) => {
      return trackMetric(contestId, "views");
    },
    [trackMetric],
  );

  const trackDownload = useCallback(
    (contestId: string) => {
      return trackMetric(contestId, "downloads");
    },
    [trackMetric],
  );

  const trackSubmission = useCallback(
    (contestId: string) => {
      return trackMetric(contestId, "submissions");
    },
    [trackMetric],
  );

  const trackVote = useCallback(
    (contestId: string) => {
      return trackMetric(contestId, "votes");
    },
    [trackMetric],
  );

  return {
    trackView,
    trackDownload,
    trackSubmission,
    trackVote,
  };
}

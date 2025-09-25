import { useCallback } from "react";
import { API_URL } from "@/lib/utils";

type MetricType = "views" | "downloads" | "submissions" | "votes";

export function useContestAnalytics() {
  const trackMetric = useCallback(
    async (contestId: string, metricType: MetricType) => {
      if (!contestId) return;

      try {
        const res = await fetch(
          `${API_URL}/api/challenges/${contestId}/analytics/${metricType}`,
          { method: 'POST' }
        );
        if (!res.ok) {
          console.error('Failed to increment contest metric', metricType, contestId);
        }
      } catch (error) {
        console.error(`Error tracking ${metricType} for contest ${contestId}:`, error);
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

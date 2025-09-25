import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/utils";

interface SubmissionLite {
  id: string;
  votes?: any[] | number;
  contest_id?: string;
  challenge_id?: string;
}

export interface UserMetrics {
  totalSubmissions: number;
  totalVotes: number;
  winCount: number;
  contestsParticipated: number;
  isLoading: boolean;
  error: string | null;
}

// Unified metrics hook: combines backend aggregate stats with local derivation fallback.
export function useUserMetrics(): UserMetrics {
  const { user } = useAuth();
  const [remote, setRemote] = useState<UserMetrics>({
    totalSubmissions: 0,
    totalVotes: 0,
    winCount: 0,
    contestsParticipated: 0,
    isLoading: true,
    error: null,
  });
  const [subs, setSubs] = useState<SubmissionLite[]>([]);

  // Fetch remote aggregate stats
  useEffect(() => {
    if (!user) {
      setRemote((p) => ({ ...p, isLoading: false }));
      return;
    }
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/user-stats/user?user_id=${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch user metrics");
        const data = await res.json();
        setRemote({
          totalSubmissions: data.totalSubmissions || 0,
            totalVotes: data.totalVotes || 0,
            winCount: data.winCount || 0,
            contestsParticipated: data.contestsParticipated || 0,
            isLoading: false,
            error: null,
        });
      } catch (err) {
        setRemote((p) => ({ ...p, isLoading: false, error: err instanceof Error ? err.message : 'Failed loading metrics' }));
      }
    };
    run();
  }, [user]);

  // Fetch raw submissions to derive fallback metrics
  useEffect(() => {
    if (!user) return;
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/api/submissions?user_id=${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch submissions for metrics");
  const data = await res.json();
  const uid = String(user._id);
  const mine = Array.isArray(data) ? data.filter((s: any) => String(s.user_id || s.userId) === uid) : [];
        setSubs(mine);
      } catch (err) {
        // silent fallback; subs stays empty
      }
    };
    run();
  }, [user]);

  const derived = useMemo(() => {
    const totalSubmissions = subs.length;
    const totalVotes = subs.reduce((sum, s: any) => {
      if (Array.isArray(s.votes)) return sum + s.votes.length;
      if (typeof s.votes === 'number') return sum + s.votes;
      return sum;
    }, 0);
    const contestsSet = new Set(
      subs.map((s: any) => s.challenge_id || s.contest_id).filter(Boolean)
    );
    const contestsParticipated = contestsSet.size;
    // winCount currently relies on backend marking (isWinner) – include local count if present
    const winCount = subs.filter((s: any) => s.isWinner).length;
    return { totalSubmissions, totalVotes, contestsParticipated, winCount };
  }, [subs]);

  // Merge: prefer remote values if they are non-zero or local is zero.
  const merged: UserMetrics = {
    totalSubmissions: remote.totalSubmissions || derived.totalSubmissions,
    totalVotes: remote.totalVotes || derived.totalVotes,
    winCount: remote.winCount || derived.winCount,
    contestsParticipated: remote.contestsParticipated || derived.contestsParticipated,
    isLoading: remote.isLoading,
    error: remote.error,
  };

  return merged;
}

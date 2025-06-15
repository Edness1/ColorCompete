import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface UserStats {
  totalSubmissions: number;
  totalVotes: number;
  winCount: number;
  contestsParticipated: number;
  isLoading: boolean;
  error: string | null;
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    totalVotes: 0,
    winCount: 0,
    contestsParticipated: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setStats((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchUserStats = async () => {
      try {
        // Get total submissions count
        const { count: submissionsCount, error: submissionsError } =
          await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

        if (submissionsError) throw submissionsError;

        // Get total votes received
        const { data: submissions, error: votesError } = await supabase
          .from("submissions")
          .select("votes")
          .eq("user_id", user.id);

        if (votesError) throw votesError;

        const totalVotes =
          submissions?.reduce((sum, sub) => sum + (sub.votes || 0), 0) || 0;

        // Get unique contests participated in
        const { data: contestData, error: contestError } = await supabase
          .from("submissions")
          .select("contest_id")
          .eq("user_id", user.id);

        if (contestError) throw contestError;

        const uniqueContests = new Set(
          contestData?.map((item) => item.contest_id).filter(Boolean),
        );

        // For now, we'll simulate win count since we don't have that data structure yet
        // In a real implementation, you would query a winners table or similar
        const winCount = Math.floor(Math.random() * 3); // Simulate 0-2 wins

        setStats({
          totalSubmissions: submissionsCount || 0,
          totalVotes,
          winCount,
          contestsParticipated: uniqueContests.size,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load user statistics",
        }));
      }
    };

    fetchUserStats();
  }, [user]);

  return stats;
}

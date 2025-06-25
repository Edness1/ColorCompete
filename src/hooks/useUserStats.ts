import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/utils";

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
        const response = await fetch(
          `${API_URL}/api/users/user-stats/user?user_id=${user._id}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }
        const data = await response.json();

        setStats({
          totalSubmissions: data.totalSubmissions || 0,
          totalVotes: data.totalVotes || 0,
          winCount: data.winCount || 0,
          contestsParticipated: data.contestsParticipated || 0,
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

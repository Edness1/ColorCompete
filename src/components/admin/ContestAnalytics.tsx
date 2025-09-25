import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Eye, Download, Upload, Heart } from "lucide-react";
import { API_URL } from "@/lib/utils";

interface ContestAnalytics {
  id: string;
  contest_id: string;
  views: number;
  downloads: number;
  submissions: number;
  votes: number;
  created_at: string;
  updated_at: string;
}

interface Contest {
  _id?: string; // Mongo id
  id?: string; // fallback if normalized elsewhere
  title: string;
  status: string;
  startDate?: string; // original naming in frontend
  endDate?: string;
  start_date?: string; // possible snake case from API
  end_date?: string;
}

interface ContestWithAnalytics extends Contest {
  analytics: ContestAnalytics;
}

export default function ContestAnalytics() {
  const [contestsWithAnalytics, setContestsWithAnalytics] = useState<
    ContestWithAnalytics[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContestsWithAnalytics();
  }, []);

  async function fetchContestsWithAnalytics() {
    setIsLoading(true);
    try {
      // Fetch all contests from the API
      const contestsRes = await fetch(
        `${API_URL}/api/challenges`,
      );
      if (!contestsRes.ok) throw new Error("Failed to fetch contests");
  const contests: Contest[] = await contestsRes.json();

      // Fetch analytics for all contests from the API
      const analyticsRes = await fetch(
        `${API_URL}/api/challenges/analytics/contest-analytics`,
      );
      if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
      const analytics: ContestAnalytics[] = await analyticsRes.json();

      // Combine the data
      const combined = contests.map((contest) => {
        const contestId = contest.id || contest._id as string;
        const contestAnalytics =
          analytics.find((a) => a.contest_id === contestId) || {
            id: "",
            contest_id: contestId,
            views: 0,
            downloads: 0,
            submissions: 0,
            votes: 0,
            created_at: "",
            updated_at: "",
          };

        return {
          ...contest,
          id: contestId,
          analytics: contestAnalytics,
        };
      });

      setContestsWithAnalytics(combined);
    } catch (error) {
      console.error("Error fetching contest analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load contest analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Find the maximum values for each metric to scale the progress bars
  const maxViews = Math.max(
    ...contestsWithAnalytics.map((c) => c.analytics.views),
    1,
  );
  const maxDownloads = Math.max(
    ...contestsWithAnalytics.map((c) => c.analytics.downloads),
    1,
  );
  const maxSubmissions = Math.max(
    ...contestsWithAnalytics.map((c) => c.analytics.submissions),
    1,
  );
  const maxVotes = Math.max(
    ...contestsWithAnalytics.map((c) => c.analytics.votes),
    1,
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contest Analytics</CardTitle>
        <CardDescription>
          Track performance metrics for all contests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contestsWithAnalytics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contests found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contestsWithAnalytics.map((contest) => (
              <Card key={contest.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{contest.title}</CardTitle>
                      <CardDescription>
                        {formatDate(
                          contest.startDate || contest.start_date || ""
                        )} -{" "}
                        {formatDate(
                          contest.endDate || contest.end_date || ""
                        )}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-white text-xs ${getStatusColor(
                        contest.status,
                      )}`}
                    >
                      {contest.status.charAt(0).toUpperCase() +
                        contest.status.slice(1)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Views</span>
                          <span className="text-sm">
                            {contest.analytics.views}
                          </span>
                        </div>
                        <Progress
                          value={(contest.analytics.views / maxViews) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Download className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Downloads</span>
                          <span className="text-sm">
                            {contest.analytics.downloads}
                          </span>
                        </div>
                        <Progress
                          value={
                            (contest.analytics.downloads / maxDownloads) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Upload className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Submissions
                          </span>
                          <span className="text-sm">
                            {contest.analytics.submissions}
                          </span>
                        </div>
                        <Progress
                          value={
                            (contest.analytics.submissions / maxSubmissions) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Votes</span>
                          <span className="text-sm">
                            {contest.analytics.votes}
                          </span>
                        </div>
                        <Progress
                          value={(contest.analytics.votes / maxVotes) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                      Last updated:{" "}
                      {new Date(contest.analytics.updated_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

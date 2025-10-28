import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal } from "lucide-react";
import { MainHeader } from "./header";
import { API_URL } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  submissionId?: string;
  submissionUrl?: string;
  contestType?: string;
  ageGroup?: string;
  date?: string;
}

interface LeaderboardProps {
  currentLeaders?: LeaderboardEntry[];
  weeklyLeaders?: LeaderboardEntry[];
  monthlyLeaders?: LeaderboardEntry[];
  allTimeLeaders?: LeaderboardEntry[];
}

// Helper to format date
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  if (["Today", "This Week", "This Month"].includes(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return dateStr;
}

const Leaderboard = ({}: LeaderboardProps) => {
  const [activeTab, setActiveTab] = useState("current");
  const [contestFilter, setContestFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [allSubmissions, setAllSubmissions] = useState<LeaderboardEntry[]>([]);
  const [derivedCurrent, setDerivedCurrent] = useState<LeaderboardEntry[]>([]);
  const [derivedWeekly, setDerivedWeekly] = useState<LeaderboardEntry[]>([]);
  const [derivedMonthly, setDerivedMonthly] = useState<LeaderboardEntry[]>([]);
  const [derivedAllTime, setDerivedAllTime] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/submissions`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const normalized: LeaderboardEntry[] = data.map((item: any) => {
          const votesLength = Array.isArray(item.votes) ? item.votes.length : (typeof item.votes === 'number' ? item.votes : 0);
          const rawUrl = item.file_path || item.public_url || item.submissionUrl || item.imageUrl;
          // Normalize relative paths (e.g., uploads/xyz.png) to absolute if API_URL provided
          const submissionUrl = rawUrl && /^https?:/i.test(rawUrl)
            ? rawUrl
            : rawUrl
              ? `${API_URL.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`
              : undefined;
          return {
            rank: 0,
            userId: item.user_id || item.userId || 'unknown',
            username: item.profiles?.username || item.username || 'Anonymous',
            avatarUrl: item.profiles?.avatar_url || item.avatar_url || '',
            score: votesLength,
            submissionId: item._id || item.id,
            submissionUrl,
            contestType: item.contest_type || item.contestType,
            ageGroup: item.age_group || item.ageGroup,
            date: item.created_at || item.createdAt || item.submissionDate,
          };
        });
        setAllSubmissions(normalized);
      })
      .finally(() => setLoading(false));
  }, []);

  // Derive time windows similar to GalleryView
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday); // assuming week starts Sunday
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const toTime = (d?: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };

    const todayEntries = allSubmissions.filter(e => {
      const t = toTime(e.date);
      return t >= startOfToday.getTime();
    });
    const weekEntries = allSubmissions.filter(e => {
      const t = toTime(e.date);
      return t >= startOfWeek.getTime();
    });
    const monthEntries = allSubmissions.filter(e => {
      const t = toTime(e.date);
      return t >= startOfMonth.getTime();
    });

    function rank(list: LeaderboardEntry[]): LeaderboardEntry[] {
      // Sort by score desc then date asc (earlier gets higher if tie)
      const sorted = [...list].sort((a,b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ta = toTime(a.date); const tb = toTime(b.date);
        return ta - tb;
      });
      return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    }

    setDerivedCurrent(rank(todayEntries));
    setDerivedWeekly(rank(weekEntries));
    setDerivedMonthly(rank(monthEntries));
    setDerivedAllTime(rank(allSubmissions));
  }, [allSubmissions]);

  const filterEntries = (entries: LeaderboardEntry[]) => {
    return entries.filter((entry) => {
      const contestMatch =
        contestFilter === "all" || (entry.contestType && entry.contestType === contestFilter);
      const ageMatch =
        ageFilter === "all" || (entry.ageGroup && entry.ageGroup === ageFilter);
      return contestMatch && ageMatch;
    });
  };

  const getActiveLeaderboard = () => {
    switch (activeTab) {
      case "current":
        return filterEntries(derivedCurrent);
      case "weekly":
        return filterEntries(derivedWeekly);
      case "monthly":
        return filterEntries(derivedMonthly);
      case "all-time":
        return filterEntries(derivedAllTime);
      default:
        return filterEntries(derivedCurrent);
    }
  };


  const activeLeaderboard = getActiveLeaderboard();
  const maxScore = Math.max(...activeLeaderboard.map((entry) => entry.score), 1);

  // Helper to format date
  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    // If it's a known label, just return as is
    if (["Today", "This Week", "This Month"].includes(dateStr)) return dateStr;
    // Try to parse as ISO date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return dateStr;
  }

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300/20">
          <Medal className="h-4 w-4 text-gray-400" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20">
          <Medal className="h-4 w-4 text-amber-700" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
          <span className="text-sm font-medium">{rank}</span>
        </div>
      );
    }
  };

  return (
    <>
      <MainHeader />
      <div className="container mx-auto py-8 bg-background">
        {loading ? (
          <div className="text-center py-16 text-lg">Loading leaderboard...</div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h1 className="text-3xl font-bold mb-4 md:mb-0">Leaderboard</h1>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Tabs
                  value={activeTab}
                  onValueChange={(tab) => {
                    setActiveTab(tab);
                    setLoading(true);
                    let endpoint = "";
                    // On tab change we don't need a refetch; data derived locally.
                    setLoading(false);
                  }}
                  className="w-full sm:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="current">Today's Contest</TabsTrigger>
                    <TabsTrigger value="weekly">This Week</TabsTrigger>
                    <TabsTrigger value="monthly">This Month</TabsTrigger>
                    <TabsTrigger value="all-time">All Time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Top 3 Winners Highlight */}
            {activeTab === "current" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {activeLeaderboard.slice(0, 3).map((entry, index) => (
                  <WinnerCard key={entry.userId} entry={entry} position={index + 1} />
                ))}
              </div>
            )}

            {/* Full Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "current"
                    ? "Today's Top Submissions"
                    : activeTab === "weekly"
                      ? "This Week's Leaders"
                      : activeTab === "monthly"
                        ? "This Month's Champions"
                        : "All-Time Best Artists"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLeaderboard.length > 0 ? (
                      activeLeaderboard.map((entry) => (
                        <TableRow key={entry.userId}>
                          <TableCell className="font-medium">
                            <div className="flex justify-center">
                              {renderRankBadge(entry.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={entry.avatarUrl} />
                                <AvatarFallback>
                                  {entry.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{entry.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[30px]">
                                {entry.score}
                              </span>
                              <Progress
                                value={(entry.score / maxScore) * 100}
                                className="h-2 w-[100px]"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-10 w-10 rounded overflow-hidden bg-muted flex items-center justify-center text-[10px] uppercase tracking-wide">
                              {entry.submissionUrl ? (
                                <img
                                  src={entry.submissionUrl}
                                  alt={`Submission by ${entry.username}`}
                                  className="h-full w-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }}
                                />
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {entry.date && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(entry.date)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No entries found for the selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableCaption>
                    {activeTab === "current"
                      ? "Rankings are updated in real-time as votes come in"
                      : activeTab === "weekly"
                        ? "Weekly rankings are reset every Sunday at midnight"
                        : activeTab === "monthly"
                          ? "Monthly rankings are reset on the first day of each month"
                          : "All-time rankings include all contests since launch"}
                  </TableCaption>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* Footer removed as per new import instructions. Add back if needed. */}
    </>
  );
};

// Winner Card Component for Top 3
const WinnerCard = ({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: number;
}) => {
  const positionStyles = {
    1: {
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/50",
      textColor: "text-yellow-500",
      icon: <Trophy className="h-6 w-6 text-yellow-500" />,
      label: "1st Place",
    },
    2: {
      bgColor: "bg-gray-300/10",
      borderColor: "border-gray-400/50",
      textColor: "text-gray-400",
      icon: <Medal className="h-6 w-6 text-gray-400" />,
      label: "2nd Place",
    },
    3: {
      bgColor: "bg-amber-700/10",
      borderColor: "border-amber-700/50",
      textColor: "text-amber-700",
      icon: <Medal className="h-6 w-6 text-amber-700" />,
      label: "3rd Place",
    },
  }[position];

  return (
    <Card
      className={`overflow-hidden border-2 ${positionStyles.borderColor} ${positionStyles.bgColor}`}
    >
      <div className="relative aspect-square overflow-hidden">
        {entry.submissionUrl && (
          <img
            src={entry.submissionUrl}
            alt={`${position}${position === 1 ? "st" : position === 2 ? "nd" : "rd"} place submission by ${entry.username}`}
            className="w-full h-full object-cover"
          />
        )}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full ${positionStyles.bgColor} border ${positionStyles.borderColor}`}
        >
          {positionStyles.icon}
          <span className={`text-sm font-bold ${positionStyles.textColor}`}>
            {positionStyles.label}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatarUrl} />
              <AvatarFallback>
                {entry.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{entry.username}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">{entry.score}</span>
            <span className="text-sm text-muted-foreground">points</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          {entry.date && (
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;

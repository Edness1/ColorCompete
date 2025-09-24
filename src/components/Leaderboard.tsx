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
  const [currentLeaders, setCurrentLeaders] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(API_URL+"/api/submissions/submissions/current/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/weekly/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/monthly/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/all-time/now").then((res) => res.json()),
    ])
      .then(([current, weekly, monthly, allTime]) => {
        console.log(current, weekly, monthly, allTime);
        setCurrentLeaders(current);
        setWeeklyLeaders(weekly);
        setMonthlyLeaders(monthly);
        setAllTimeLeaders(allTime);
      })
      .finally(() => setLoading(false));
  }, []);

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
        // Ensure only submissions from the current local calendar day appear.
        const today = new Date();
        const isSameLocalDay = (dateStr?: string) => {
          if (!dateStr) return true; // keep if date missing
          if (dateStr === "Today") return true;
          const d = new Date(dateStr);
            if (isNaN(d.getTime())) return true; // preserve unparseable labels just in case
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        };
        return filterEntries(
          currentLeaders.filter((entry) => isSameLocalDay(entry.date))
        );
      case "weekly":
        return filterEntries(weeklyLeaders);
      case "monthly":
        return filterEntries(monthlyLeaders);
      case "all-time":
        return filterEntries(allTimeLeaders);
      default:
        return filterEntries(currentLeaders);
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
                    switch (tab) {
                      case "current":
                        endpoint = "/api/submissions/submissions/current/now";
                        break;
                      case "weekly":
                        endpoint = "/api/submissions/submissions/weekly/now";
                        break;
                      case "monthly":
                        endpoint = "/api/submissions/submissions/monthly/now";
                        break;
                      case "all-time":
                        endpoint = "/api/submissions/submissions/all-time/now";
                        break;
                      default:
                        endpoint = "/api/submissions/submissions/current/now";
                    }
                    fetch(API_URL + endpoint)
                      .then((res) => res.json())
                      .then((data) => {
                        if (tab === "current") setCurrentLeaders(data);
                        if (tab === "weekly") setWeeklyLeaders(data);
                        if (tab === "monthly") setMonthlyLeaders(data);
                        if (tab === "all-time") setAllTimeLeaders(data);
                      })
                      .finally(() => setLoading(false));
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
                      {activeTab !== "all-time" && <TableHead>Submission</TableHead>}
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
                          {activeTab !== "all-time" && (
                            <TableCell>
                              {entry.submissionUrl && (
                                <div className="h-10 w-10 rounded overflow-hidden">
                                  <img
                                    src={entry.submissionUrl}
                                    alt={`Submission by ${entry.username}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                            </TableCell>
                          )}
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
                          colSpan={5}
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
          <div className="flex gap-2">
            {entry.contestType && (
              <Badge variant="outline" className="text-xs">
                {entry.contestType === "traditional"
                  ? "Traditional"
                  : "Digital"}
              </Badge>
            )}
            {entry.ageGroup && (
              <Badge variant="secondary" className="text-xs">
                {entry.ageGroup === "child"
                  ? "Child"
                  : entry.ageGroup === "teen"
                    ? "Teen"
                    : entry.ageGroup === "adult"
                      ? "Adult"
                      : "Senior"}
              </Badge>
            )}
          </div>
          {entry.date && (
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;

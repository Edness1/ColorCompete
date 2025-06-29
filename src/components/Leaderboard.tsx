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
import { Trophy, Medal, Calendar, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MainHeader } from "./header";
import { API_URL } from "@/lib/utils";

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

const Leaderboard = ({
  // Remove default props, will use API data
}: LeaderboardProps) => {
  const [activeTab, setActiveTab] = useState("current");
  const [contestFilter, setContestFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");

  // New state for API data
  const [currentLeaders, setCurrentLeaders] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Example endpoints, adjust as needed to match your API
    Promise.all([
      fetch(API_URL+"/api/submissions/submissions/current/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/weekly/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/monthly/now").then((res) => res.json()),
      fetch(API_URL+"/api/submissions/submissions/all-time/now").then((res) => res.json()),
    ])
      .then(([current, weekly, monthly, allTime]) => {
        console.log(current, weekly, monthly, allTime)
        setCurrentLeaders(current);
        setWeeklyLeaders(weekly);
        setMonthlyLeaders(monthly);
        setAllTimeLeaders(allTime);
      })
      .finally(() => setLoading(false));
  }, []);

  // Function to filter leaderboard entries based on selected filters
  const filterEntries = (entries: LeaderboardEntry[]) => {
    return entries.filter((entry) => {
      const contestMatch =
        contestFilter === "all" ||
        (entry.contestType && entry.contestType === contestFilter);
      const ageMatch =
        ageFilter === "all" || (entry.ageGroup && entry.ageGroup === ageFilter);
      return contestMatch && ageMatch;
    });
  };

  // Get the appropriate leaderboard data based on active tab
  const getActiveLeaderboard = () => {
    switch (activeTab) {
      case "current":
        return filterEntries(currentLeaders);
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

  // Calculate the maximum score for progress bars
  const maxScore = Math.max(
    ...activeLeaderboard.map((entry) => entry.score),
    1,
  );

  // Function to render rank badge with appropriate styling
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
    <div className="container mx-auto py-8 bg-background">
      <MainHeader />
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
                  // Refetch leaderboard data for the selected tab
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

              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {contestFilter === "all"
                        ? "All Formats"
                        : contestFilter === "traditional"
                          ? "Traditional"
                          : "Digital"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setContestFilter("all")}>
                      All Formats
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setContestFilter("traditional")}
                    >
                      Traditional
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContestFilter("digital")}>
                      Digital
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {ageFilter === "all"
                        ? "All Ages"
                        : ageFilter === "child"
                          ? "Children"
                          : ageFilter === "teen"
                            ? "Teens"
                            : ageFilter === "adult"
                              ? "Adults"
                              : "Seniors"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setAgeFilter("all")}>
                      All Ages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAgeFilter("child")}>
                      Children (under 13)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAgeFilter("teen")}>
                      Teens (13-17)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAgeFilter("adult")}>
                      Adults (18+)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAgeFilter("senior")}>
                      Seniors (65+)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                    <TableHead className="text-right">Details</TableHead>
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
                            {entry.contestType && (
                              <Badge variant="outline">
                                {entry.contestType === "traditional"
                                  ? "Traditional"
                                  : "Digital"}
                              </Badge>
                            )}
                            {entry.ageGroup && (
                              <Badge variant="secondary">
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
            <span className="text-xs text-muted-foreground">{entry.date}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Mock data for current contest leaderboard
const defaultCurrentLeaders: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user1",
    username: "ArtMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtMaster",
    score: 87,
    submissionId: "sub1",
    submissionUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80",
    contestType: "traditional",
    ageGroup: "adult",
    date: "Today",
  },
  {
    rank: 2,
    userId: "user2",
    username: "ColorQueen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ColorQueen",
    score: 82,
    submissionId: "sub2",
    submissionUrl:
      "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=300&q=80",
    contestType: "digital",
    ageGroup: "teen",
    date: "Today",
  },
  {
    rank: 3,
    userId: "user3",
    username: "BrushMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=BrushMaster",
    score: 76,
    submissionId: "sub3",
    submissionUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80",
    contestType: "traditional",
    ageGroup: "senior",
    date: "Today",
  },
  {
    rank: 4,
    userId: "user4",
    username: "DigitalDiva",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DigitalDiva",
    score: 71,
    submissionId: "sub4",
    submissionUrl:
      "https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=300&q=80",
    contestType: "digital",
    ageGroup: "adult",
    date: "Today",
  },
  {
    rank: 5,
    userId: "user5",
    username: "PencilPro",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=PencilPro",
    score: 68,
    submissionId: "sub5",
    submissionUrl:
      "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=300&q=80",
    contestType: "traditional",
    ageGroup: "child",
    date: "Today",
  },
  {
    rank: 6,
    userId: "user6",
    username: "ArtisticSoul",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtisticSoul",
    score: 65,
    submissionId: "sub6",
    submissionUrl:
      "https://images.unsplash.com/photo-1605106702734-205df224ecce?w=300&q=80",
    contestType: "digital",
    ageGroup: "teen",
    date: "Today",
  },
  {
    rank: 7,
    userId: "user7",
    username: "CreativeMind",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=CreativeMind",
    score: 59,
    submissionId: "sub7",
    submissionUrl:
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=300&q=80",
    contestType: "traditional",
    ageGroup: "adult",
    date: "Today",
  },
  {
    rank: 8,
    userId: "user8",
    username: "ColorMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ColorMaster",
    score: 54,
    submissionId: "sub8",
    submissionUrl:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=300&q=80",
    contestType: "digital",
    ageGroup: "senior",
    date: "Today",
  },
];

// Mock data for weekly leaderboard
const defaultWeeklyLeaders: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user9",
    username: "WeeklyChamp",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=WeeklyChamp",
    score: 342,
    submissionId: "sub9",
    submissionUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80",
    contestType: "digital",
    ageGroup: "adult",
    date: "This Week",
  },
  {
    rank: 2,
    userId: "user2",
    username: "ColorQueen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ColorQueen",
    score: 315,
    submissionId: "sub10",
    submissionUrl:
      "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=300&q=80",
    contestType: "traditional",
    ageGroup: "teen",
    date: "This Week",
  },
  {
    rank: 3,
    userId: "user1",
    username: "ArtMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtMaster",
    score: 287,
    submissionId: "sub11",
    submissionUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80",
    contestType: "digital",
    ageGroup: "adult",
    date: "This Week",
  },
];

// Mock data for monthly leaderboard
const defaultMonthlyLeaders: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user2",
    username: "ColorQueen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ColorQueen",
    score: 1245,
    submissionId: "sub12",
    submissionUrl:
      "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=300&q=80",
    contestType: "digital",
    ageGroup: "teen",
    date: "This Month",
  },
  {
    rank: 2,
    userId: "user1",
    username: "ArtMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtMaster",
    score: 1187,
    submissionId: "sub13",
    submissionUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80",
    contestType: "traditional",
    ageGroup: "adult",
    date: "This Month",
  },
  {
    rank: 3,
    userId: "user9",
    username: "WeeklyChamp",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=WeeklyChamp",
    score: 1056,
    submissionId: "sub14",
    submissionUrl:
      "https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=300&q=80",
    contestType: "digital",
    ageGroup: "adult",
    date: "This Month",
  },
];

// Mock data for all-time leaderboard
const defaultAllTimeLeaders: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user1",
    username: "ArtMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ArtMaster",
    score: 15782,
    contestType: "traditional",
    ageGroup: "adult",
  },
  {
    rank: 2,
    userId: "user2",
    username: "ColorQueen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ColorQueen",
    score: 14935,
    contestType: "digital",
    ageGroup: "teen",
  },
  {
    rank: 3,
    userId: "user9",
    username: "WeeklyChamp",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=WeeklyChamp",
    score: 12456,
    contestType: "digital",
    ageGroup: "adult",
  },
  {
    rank: 4,
    userId: "user3",
    username: "BrushMaster",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=BrushMaster",
    score: 10234,
    contestType: "traditional",
    ageGroup: "senior",
  },
  {
    rank: 5,
    userId: "user4",
    username: "DigitalDiva",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DigitalDiva",
    score: 9876,
    contestType: "digital",
    ageGroup: "adult",
  },
];

export default Leaderboard;

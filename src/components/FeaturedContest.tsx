import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, Upload, Eye, Trophy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useContestAnalytics } from "@/hooks/useContestAnalytics";
import SubmissionButton from "./SubmissionButton";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  lineArt: string;
  startDate?: string;
  endDate?: string;
  contestType?: "traditional" | "digital";
  status: "draft" | "scheduled" | "active" | "completed";
  download?: any[];
  artStyle?: "anime" | "matisse" | "standard";
  createdAt?: string;
  submissions?: object[];
  startTime?: string;
  endTime?: string;
}

interface FeaturedContestProps {
  title?: string;
  imageUrl?: string;
  remainingTime?: string;
  contestType?: string;
  description?: string;
  contestId?: string;
  artStyle?: "anime" | "matisse" | "standard";
  // Scheduled placeholder support
  isScheduledPlaceholder?: boolean;
  startsIn?: string;
}

const FeaturedContest: React.FC<FeaturedContestProps> = (props) => {
  const { trackDownload } = useContestAnalytics();
  const { user } = useAuth();
  const userId = user?._id;
  const [latestContest, setLatestContest] = useState<Challenge | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [badgeLabel, setBadgeLabel] = useState("Remaining");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [internalRemainingTime, setInternalRemainingTime] = useState(
    props.remainingTime || "--:--:--",
  );
  const scheduledPlaceholderImage = "/examples/woodland-creatures-line-art.png";

  const parseDateTimeUTC = (iso?: string, time?: string) => {
    if (!iso && !time) return null;
    // If iso already contains time (ISO string), parse directly
    if (iso && iso.includes("T")) return new Date(iso);
    // If iso is just a date (YYYY-MM-DD) and time provided, treat as UTC
    if (iso && time) return new Date(`${iso}T${time}:00Z`);
    // fallback: try parsing whatever was provided
    if (iso) return new Date(iso);
    return null;
  };

  // Select the most relevant contest: active > nearest scheduled > latest by date
  const selectRelevantContest = (contests: Challenge[] | null) => {
    if (!contests || contests.length === 0) return null;
    const now = new Date().getTime();

    const withTimes = contests.map((c) => {
      const start = parseDateTimeUTC(c.startDate, c.startTime);
      const end = parseDateTimeUTC(c.endDate, c.endTime);
      return { contest: c, start, end };
    });

    // Active contest (now between start and end)
    const active = withTimes.find(
      (w) => w.start && w.end && w.start.getTime() <= now && now < w.end.getTime()
    );
    if (active) return active.contest;

    // Scheduled contests in future, pick nearest start
    const future = withTimes
      .filter((w) => w.start && w.start.getTime() > now)
      .sort((a, b) => (a.start!.getTime() - b.start!.getTime()));
    if (future.length > 0) return future[0].contest;

    // Fallback: latest by startDate or createdAt
    const sorted = withTimes.sort((a, b) => {
      const aKey = a.start ? a.start.getTime() : a.contest.createdAt ? new Date(a.contest.createdAt!).getTime() : 0;
      const bKey = b.start ? b.start.getTime() : b.contest.createdAt ? new Date(b.contest.createdAt!).getTime() : 0;
      return bKey - aKey;
    });
    return sorted[0].contest;
  };

  // Fetch latest contest
  useEffect(() => {
    if (props.title) return;
    const fetchLatestContest = async () => {
      try {
        const res = await fetch(API_URL + "/api/challenges");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const selected = selectRelevantContest(data as Challenge[]);
          setLatestContest(selected);
        }
      } catch (err) {
        console.error("Failed to fetch latest contest:", err);
      }
    };
    fetchLatestContest();
  }, [props.title]);

  // Countdown showing time until start (if scheduled) or time remaining (if active)
  useEffect(() => {
    if (props.title) return;
    if (!latestContest) return;

    const getTimes = () => {
      const start = parseDateTimeUTC(latestContest.startDate, latestContest.startTime);
      const end = parseDateTimeUTC(latestContest.endDate, latestContest.endTime);

      const now = new Date();

      // If we lack start or end, attempt to derive from date + time as UTC, or return ended
      if (!start && !end) {
        setBadgeLabel("Ended");
        return "00:00:00";
      }

      // If start exists and now is before start => scheduled
      if (start && now.getTime() < start.getTime()) {
        setBadgeLabel("Starts in");
        let diff = start.getTime() - now.getTime();
        const totalSeconds = Math.max(0, Math.floor(diff / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        // Show days if > 0 as "D d HH:MM:SS"
        if (days > 0) {
          return `${days}d ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
        }
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`;
      }

      // If end exists and now is before end => active
      if (end && now.getTime() < end.getTime()) {
        setBadgeLabel("Remaining");
        let diff = end.getTime() - now.getTime();
        const totalSeconds = Math.max(0, Math.floor(diff / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`;
      }

      // Otherwise ended
      setBadgeLabel("Ended");
      return "00:00:00";
    };

    setInternalRemainingTime(getTimes());
    const timer = setInterval(() => {
      setInternalRemainingTime(getTimes());
    }, 1000);

    return () => clearInterval(timer);
  }, [latestContest]);

  // Fetch submission count for this contest
  useEffect(() => {
    if (props.title) return;
    const fetchSubmissionCount = async () => {
      if (!latestContest?._id) return;
      try {
        const res = await fetch(`${API_URL}/api/submissions/by-challenge/search?challenge_id=${latestContest._id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubmissionCount(data.length);
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      }
    };
    fetchSubmissionCount();
  }, [latestContest?._id]);

  const handleDownload = async () => {
    try {
      if (latestContest?._id && userId) {
        try {
          await fetch(API_URL + `/api/challenges/${latestContest._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              download: [...(latestContest.download || []), { userId: userId, timestamp: new Date().toISOString() }],
            }),
          });
        } catch (err) {
          console.error("Failed to log download to backend:", err);
        }
      }

      // Download the image
      const response = await fetch(latestContest?.lineArt || "");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${(latestContest?.title || "line-art")
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}-line-art.jpg`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${latestContest?.title} has been downloaded to your device.`,
      });

      if (latestContest?._id) {
        trackDownload(latestContest._id);
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the line art. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Removed generated line-art branch (artworkTitle/artworkImage)

  if (props.title && (props.imageUrl || props.isScheduledPlaceholder)) {
    const imageSrc = props.imageUrl || scheduledPlaceholderImage;
    const showRemaining = !props.isScheduledPlaceholder && !!props.remainingTime;
    const showStartsIn = !!props.isScheduledPlaceholder && !!props.startsIn;

    const downloadImage = () => {
      if (!props.imageUrl) return;
      const link = document.createElement("a");
      link.href = props.imageUrl;
      const filename = `${(props.title || "line-art").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-line-art.jpg`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="w-full max-w-5xl mx-auto bg-background p-6 rounded-xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left side - Artwork Preview */}
          <div className="flex-1">
            <Card className="overflow-hidden h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold">{props.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{showStartsIn ? "Starts in" : showRemaining ? "Remaining" : (props.contestType || "Contest")}</span>
                    {(showStartsIn || showRemaining) && (
                      <span className="ml-2 font-mono">{showStartsIn ? props.startsIn : props.remainingTime}</span>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative">
                <div className="w-full">
                  {/* Single Line Art Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={props.title}
                      className="w-full h-full object-cover"
                      style={{ objectFit: "contain" }}
                    />
                    {!props.isScheduledPlaceholder && props.imageUrl && (
                      <div className="absolute inset-0 pointer-events-none" />
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-muted-foreground">{props.description || "Join today's challenge—download the line art, color it, and submit before the countdown ends!"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Contest Info */}
          <div className="flex flex-col gap-6 md:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>How to Participate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Step 1: Download</h3>
                    <p className="text-sm text-muted-foreground">Download today's line art to your device</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Step 2: Print</h3>
                    <p className="text-sm text-muted-foreground">Print today's line art on a printer</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Step 3: Color</h3>
                    <p className="text-sm text-muted-foreground">
                      Color today's line art challenge with any tool you like, crayon, color pencil, water color, pastel, anything you wish.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Step 4: Submit</h3>
                    <p className="text-sm text-muted-foreground">Upload your colored artwork for voting</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Step 5: Win</h3>
                    <p className="text-sm text-muted-foreground">Top voted submission wins the daily prize</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions for active contest (no actions when scheduled placeholder) */}
            {!props.isScheduledPlaceholder && (
              <div className="flex flex-col gap-3">
                {props.imageUrl && (
                  <Button onClick={downloadImage} size="lg" className="w-full gap-2">
                    <Download className="h-5 w-5" />
                    Download Line Art
                  </Button>
                )}
                <SubmissionButton
                  contestType={props.contestType as any}
                  variant="outline"
                  className="w-full"
                  contestId={props.contestId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!latestContest) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <div className="h-[500px] w-full rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const { title, lineArt, description, contestType, artStyle, download = [], submissions = [] } = latestContest;
  const displayImage = lineArt;

  return (
    <div className="w-full max-w-5xl mx-auto bg-background p-6 rounded-xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - Artwork Preview */}
        <div className="flex-1">
          <Card className="overflow-hidden h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{badgeLabel}</span>
                  <span className="ml-2 font-mono">{internalRemainingTime}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="w-full">
                {/* Single Line Art Image */}
                <div
                  className="relative aspect-square overflow-hidden"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <img
                    src={displayImage}
                    alt="Daily coloring challenge"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out"
                    style={{
                      objectFit: "contain",
                      transform: isHovering ? "scale(1.05)" : "scale(1)",
                    }}
                  />
                  {isHovering && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300">
                      <Button
                        onClick={() => {
                          handleDownload();
                          setShowDownloadModal(true);
                        }}
                        size="sm"
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{download.length}</span> downloads
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{submissionCount}</span> submissions
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Right side - Contest Info */}
        <div className="flex flex-col gap-6 md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>How to Participate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Step 1: Download</h3>
                  <p className="text-sm text-muted-foreground">Download today's line art to your device</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Step 2: Print</h3>
                  <p className="text-sm text-muted-foreground">Print today's line art on a printer</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Step 3: Color</h3>
                  <p className="text-sm text-muted-foreground">
                    Color today's line art challenge with any tool you like, crayon, color pencil, water color, pastel, anything you wish.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Step 4: Submit</h3>
                  <p className="text-sm text-muted-foreground">Upload your colored artwork for voting</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Step 5: Win</h3>
                  <p className="text-sm text-muted-foreground">Top voted submission wins the daily prize</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                handleDownload();
                setShowDownloadModal(true);
              }}
              size="lg"
              className="w-full gap-2"
            >
              <Download className="h-5 w-5" />
              {contestType === "traditional" ? "Download Line Art" : "View Theme Details"}
            </Button>

            <SubmissionButton contestType={contestType} variant="outline" className="w-full" contestId={latestContest._id} />
          </div>
        </div>
      </div>

      {/* Download Confirmation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Download Confirmation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your download should start automatically. If not, click the button below.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleDownload} className="gap-2" size="sm">
                <Download className="h-4 w-4" />
                Download Again
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button onClick={() => setShowDownloadModal(false)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedContest;

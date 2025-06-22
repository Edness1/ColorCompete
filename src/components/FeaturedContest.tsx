import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, Trophy, Upload } from "lucide-react";
import DownloadConfirmation from "./DownloadConfirmation";
import SubmissionButton from "./SubmissionButton";
import { toast } from "@/components/ui/use-toast";
import { useContestAnalytics } from "@/hooks/useContestAnalytics";
import { API_URL } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  lineArt: string;
  startDate: string;
  endDate: string;
  contestType: "traditional" | "digital";
  status: "draft" | "scheduled" | "active" | "completed";
  download?: any[];
  artStyle?: "anime" | "matisse" | "standard";
  createdAt?: string;
  submissions?: object[];
}

const FeaturedContest = () => {
  const [latestContest, setLatestContest] = useState<Challenge | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>("--:--:--");
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const { trackDownload } = useContestAnalytics();
  const { user } = useAuth(); // user object from your auth context
  const userId = user?._id;    // or user?._id or user?.userId depending on your user object

  // Fetch latest contest
  useEffect(() => {
    const fetchLatestContest = async () => {
      try {
        const res = await fetch(API_URL + "/api/challenges");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Sort by creation date descending and pick the latest
          const latest = data[data.length - 1] as Challenge;
          setLatestContest(latest);
        }
      } catch (err) {
        console.error("Failed to fetch latest contest:", err);
      }
    };
    fetchLatestContest();
  }, []);

  // 24-hour countdown from startDate
  useEffect(() => {
    if (!latestContest?.startDate) return;

    const getRemaining = () => {
      const start = new Date(latestContest.startDate);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) return "00:00:00";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      return (
        hours.toString().padStart(2, "0") +
        ":" +
        mins.toString().padStart(2, "0") +
        ":" +
        secs.toString().padStart(2, "0")
      );
    };

    setRemainingTime(getRemaining());
    const timer = setInterval(() => {
      setRemainingTime(getRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [latestContest?.startDate]);

  // Fetch submission count for this contest
  useEffect(() => {
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

  // Function to handle actual download
  const handleDownload = async () => {
    try {
      if (latestContest?._id && userId) {
        try {
          const updateduser = await fetch(API_URL + `/api/challenges/${latestContest._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              download:[...latestContest.download, {userId:userId,
              timestamp: new Date().toISOString()}],
            }),
          });
          console.log("Download logged to backend:", updateduser);
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
        description:
          "There was an error downloading the line art. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!latestContest) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <div className="h-[500px] w-full rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const {
    title,
    lineArt,
    description,
    contestType,
    artStyle,
    download = [],
    submissions = [],
  } = latestContest;

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
                  <CardTitle className="text-2xl font-bold">
                    {title}
                  </CardTitle>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {contestType === "traditional"
                        ? "Traditional Contest"
                        : "Digital Contest"}
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Remaining</span>
                  <span className="ml-2 font-mono">{remainingTime}</span>
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
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10">
                    {artStyle === "anime"
                      ? "Anime Line Art"
                      : artStyle === "matisse"
                        ? "Matisse Line Art"
                        : "Daily Coloring Challenge"}
                  </div>
                  <img
                    src={displayImage}
                    alt="Daily coloring challenge"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out"
                    style={{
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
                <span className="font-medium">
                  {submissionCount}
                </span>{" "}
                submissions
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
                  <h3 className="font-medium">
                    Step 1:{" "}
                    {contestType === "traditional" ? "Download" : "Get Theme"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {contestType === "traditional"
                      ? "Download today's line art to your device"
                      : "Check today's theme for your digital creation"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">
                    Step 2: {contestType === "traditional" ? "Color" : "Create"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {description ||
                      (contestType === "traditional"
                        ? "Use your favorite tools to color the artwork"
                        : "Create an original digital artwork based on the theme")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Step 3: Submit</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your colored artwork for voting
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Step 4: Win</h3>
                  <p className="text-sm text-muted-foreground">
                    Top voted submission wins the daily prize
                  </p>
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
              {contestType === "traditional"
                ? "Download Line Art"
                : "View Theme Details"}
            </Button>

            <SubmissionButton
              contestType={contestType}
              variant="outline"
              className="w-full"
              contestId={latestContest._id}
            />
          </div>
        </div>
      </div>

      {/* Download Confirmation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Download Confirmation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your download should start automatically. If not, click the button
              below.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                className="gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download Again
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowDownloadModal(false)}
                variant="outline"
                className="w-full"
              >
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

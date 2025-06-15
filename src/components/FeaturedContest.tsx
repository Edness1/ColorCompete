import { useState } from "react";
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

interface FeaturedContestProps {
  artworkTitle?: string;
  artworkImage?: string;
  artworkBwImage?: string;
  remainingTime?: string;
  downloadCount?: number;
  submissionCount?: number;
  onDownload?: () => void;
  onSubmit?: () => void;
  contestType?: "traditional" | "digital";
  description?: string;
  contestId?: string;
  artStyle?: "anime" | "matisse" | "standard";
}

const FeaturedContest = ({
  artworkTitle = "Today's Line Art Challenge",
  artworkImage = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  artworkBwImage,
  remainingTime = "23:45:12",
  downloadCount = 128,
  submissionCount = 42,
  onDownload = () => console.log("Download clicked"),
  onSubmit = () => console.log("Submit clicked"),
  contestType = "traditional",
  description = "Color today's line art with your favorite tools and submit your masterpiece!",
  contestId,
  artStyle = "standard",
}: FeaturedContestProps) => {
  // We now primarily use the black and white image for the daily contest
  const displayImage = artworkBwImage || artworkImage;
  const [isHovering, setIsHovering] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { trackDownload } = useContestAnalytics();

  // Function to handle actual download
  const handleDownload = async () => {
    try {
      // Fetch the image for download
      const response = await fetch(displayImage);
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate a filename from the artwork title
      const filename = `${artworkTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-line-art.jpg`;
      link.setAttribute("download", filename);

      // Append to the document, click it, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast({
        title: "Download Complete",
        description: `${artworkTitle} has been downloaded to your device.`,
      });

      // Clean up the object URL
      window.URL.revokeObjectURL(url);

      // Track download for analytics
      if (contestId) {
        trackDownload(contestId);
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
                    {artworkTitle}
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
                  <span>{remainingTime} remaining</span>
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
                          onDownload();
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
                <span className="font-medium">{downloadCount}</span> downloads
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{submissionCount}</span>{" "}
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
                onDownload();
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
            />
          </div>
        </div>
      </div>

      {/* Download Confirmation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <DownloadConfirmation
              artworkTitle={artworkTitle}
              artworkImage={artworkImage}
              artworkBwImage={displayImage}
              artStyle={artStyle}
              onClose={() => setShowDownloadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedContest;

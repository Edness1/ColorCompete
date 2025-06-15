import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Download, FileDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";

interface DownloadConfirmationProps {
  artworkTitle?: string;
  artworkImage?: string;
  artworkBwImage?: string;
  artStyle?: "anime" | "matisse" | "standard";
  onClose?: () => void;
}

const DownloadConfirmation = ({
  artworkTitle = "Today's Line Art Challenge",
  artworkImage = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  artworkBwImage,
  artStyle = "standard",
  onClose = () => {},
}: DownloadConfirmationProps) => {
  const [isDownloaded, setIsDownloaded] = React.useState(false);
  // If no black and white image is provided, use the color image
  const bwImage = artworkBwImage || artworkImage;

  const handleDownload = async () => {
    try {
      // Fetch the image
      const response = await fetch(bwImage);
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

      // Show success state
      setIsDownloaded(true);
      toast({
        title: "Download Complete",
        description: `${artworkTitle} has been downloaded to your device.`,
      });

      // Clean up the object URL
      window.URL.revokeObjectURL(url);
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
    <Card className="w-full max-w-md mx-auto bg-background">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{artworkTitle}</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileDown className="h-3 w-3" />
            Line Art
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto mb-4">
          <div className="aspect-square overflow-hidden rounded-md relative">
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10">
              Original
            </div>
            <img
              src={artworkImage}
              alt={`${artworkTitle} - Original`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-md relative">
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10">
              {artStyle === "anime"
                ? "Anime Line Art"
                : artStyle === "matisse"
                  ? "Matisse Line Art"
                  : "Line Art"}
            </div>
            <img
              src={bwImage}
              alt={`${artworkTitle} - Line Art`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          <p>
            Download this line art to your device and color it using your
            favorite tools. Once complete, return to upload your colored
            version.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDownload}
                className="gap-2"
                disabled={isDownloaded}
              >
                {isDownloaded ? (
                  <>
                    <Check className="h-4 w-4" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Line Art
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDownloaded ? "Already downloaded" : "Save to your device"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default DownloadConfirmation;

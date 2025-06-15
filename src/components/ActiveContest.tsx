import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FeaturedContest from "./FeaturedContest";
import { Skeleton } from "./ui/skeleton";
import { useContestAnalytics } from "@/hooks/useContestAnalytics";
import { useLineArtGeneration } from "@/hooks/useLineArtGeneration";
import { Button } from "./ui/button";

interface Contest {
  id: string;
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  contest_type: "traditional" | "digital";
  status: "draft" | "scheduled" | "active" | "completed";
}

export default function ActiveContest() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackView } = useContestAnalytics();
  const {
    lineArt,
    isLoading: isLineArtLoading,
    error: lineArtError,
    generateLineArt,
  } = useLineArtGeneration();

  useEffect(() => {
    async function fetchActiveContest() {
      try {
        setIsLoading(true);
        setError(null);

        // Generate line art as a fallback regardless of contest availability
        generateLineArt();

        const now = new Date().toISOString();

        // Check if contests table exists by trying a simple count query first
        const { count, error: countError } = await supabase
          .from("contests")
          .select("*", { count: "exact", head: true });

        if (countError) {
          // If table doesn't exist or other error, just use line art
          console.error("Contests table error:", countError);
          return;
        }

        // Fetch the currently active contest
        const { data, error } = await supabase
          .from("contests")
          .select("*")
          .eq("status", "active")
          .lte("start_date", now)
          .gte("end_date", now)
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No active contest found, try to get scheduled contest
            const { data: scheduledData, error: scheduledError } =
              await supabase
                .from("contests")
                .select("*")
                .eq("status", "scheduled")
                .gt("start_date", now)
                .order("start_date", { ascending: true })
                .limit(1)
                .single();

            if (scheduledError && scheduledError.code !== "PGRST116") {
              console.warn(
                "Scheduled contest query issue:",
                scheduledError.message,
              );
            }

            if (scheduledData) {
              setContest(scheduledData);
            } else {
              // If no scheduled contest, get the most recent completed contest
              const { data: completedData, error: completedError } =
                await supabase
                  .from("contests")
                  .select("*")
                  .eq("status", "completed")
                  .order("end_date", { ascending: false })
                  .limit(1)
                  .single();

              if (completedError && completedError.code !== "PGRST116") {
                console.warn(
                  "Completed contest query issue:",
                  completedError.message,
                );
              }

              if (completedData) {
                setContest(completedData);
              }
            }
          } else {
            console.error(`Active contest query issue: ${error.message}`);
          }
        } else {
          setContest(data);
          // Track view for analytics
          if (data) {
            trackView(data.id);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Contest loading error: ${errorMessage}`);
        setError(`Failed to load the current contest: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveContest();
  }, []);

  // Calculate remaining time for the contest
  const calculateRemainingTime = () => {
    if (!contest) return "";

    const endDate = new Date(contest.end_date);
    const now = new Date();

    if (now > endDate) return "Contest ended";

    const diffMs = endDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`;
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime());

  useEffect(() => {
    if (!contest) return;

    const timer = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  if (isLoading && isLineArtLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  // If we have line art, show it even if there's a contest error
  if (lineArt && !isLineArtLoading) {
    return (
      <FeaturedContest
        artworkTitle={lineArt.title || "Daily Coloring Challenge"}
        artworkImage={lineArt.imageUrl}
        artworkBwImage={lineArt.bwImageUrl}
        remainingTime="23:59:59" // Default to end of day
        contestType="traditional"
        description={lineArt.description || "Today's coloring challenge"}
        artStyle={lineArt.artStyle}
      />
    );
  }

  // If there's an error with both contest and line art
  if (error && lineArtError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl">
          <p className="font-semibold mb-2">Error</p>
          <p>{error}</p>
          <p className="mt-2">{lineArtError}</p>
          <div className="mt-4 flex flex-col gap-2 items-center">
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => generateLineArt()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Generate Line Art
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we have line art but no contest
  if (!contest && lineArt && !isLineArtLoading) {
    return (
      <FeaturedContest
        artworkTitle={lineArt.title || "Daily Coloring Challenge"}
        artworkImage={lineArt.imageUrl}
        artworkBwImage={lineArt.bwImageUrl}
        remainingTime="23:59:59" // Default to end of day
        contestType="traditional"
        description={lineArt.description || "Today's coloring challenge"}
        artStyle={lineArt.artStyle}
      />
    );
  }

  // If no contest and no line art
  if (!contest && !lineArt) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center">
        <div className="bg-muted p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">No Active Contest</h2>
          <p className="text-muted-foreground mb-2">
            There are no active contests at the moment. Please check back later!
          </p>
          {lineArtError && (
            <div className="text-destructive text-sm mb-4 p-2 bg-destructive/10 rounded">
              Error: {lineArtError}
            </div>
          )}
          <div className="flex flex-col gap-2 items-center">
            <Button
              onClick={() => generateLineArt()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Generate Line Art
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FeaturedContest
      artworkTitle={contest.title}
      artworkImage={contest.image_url}
      remainingTime={remainingTime}
      contestType={contest.contest_type}
      description={contest.description}
      contestId={contest.id}
    />
  );
}

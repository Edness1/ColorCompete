import { useEffect, useState } from "react";
import FeaturedContest from "./FeaturedContest";
import { Skeleton } from "./ui/skeleton";
import { useContestAnalytics } from "@/hooks/useContestAnalytics";
import { Button } from "./ui/button";
import { API_URL } from "@/lib/utils";

interface Contest {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  contest_type: string; // backend free-form currently
  status: string;
}

export default function ActiveContest() {
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [scheduledContest, setScheduledContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackView } = useContestAnalytics();
  // Removed line art generation flow

  // Safely parse JSON from a Response, tolerating empty or non-JSON bodies
  async function safeJson<T = any>(res: Response): Promise<T | null> {
    try {
      if (res.status === 204) return null;
      const text = await res.text();
      if (!text || !text.trim()) return null;
      const contentType = res.headers.get("content-type") || "";
      if (/application\/json/i.test(contentType)) {
        return JSON.parse(text) as T;
      }
      // If content-type isn't JSON, attempt parse but tolerate failure
      try {
        return JSON.parse(text) as T;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  useEffect(() => {
    async function fetchActiveContest() {
      try {
        setIsLoading(true);
        setError(null);
        let contests: Contest[] = [];
        // Try direct current-active
  const direct = await fetch(API_URL + "/api/challenges/current-active");
        if (direct.ok) {
          const single = await safeJson<any>(direct);
          if (single && !Array.isArray(single)) {
            contests = [
              {
                ...(single as any),
                start_date: (single as any).start_date || (single as any).startDate,
                end_date: (single as any).end_date || (single as any).endDate,
                image_url: (single as any).image_url || (single as any).lineArt,
                contest_type: (single as any).contest_type || (single as any).contestType,
                status: ((single as any).status || "").toLowerCase(),
              } as Contest,
            ];
          }
        }
        if (contests.length === 0) {
          const res = await fetch(API_URL + "/api/challenges");
          if (!res.ok) throw new Error("Failed to fetch contests");
          const raw = await safeJson<any[]>(res);
          const list = Array.isArray(raw) ? raw : [];
          contests = list.map((c: any) => ({
            ...(c as any),
            start_date: c.start_date || c.startDate,
            end_date: c.end_date || c.endDate,
            image_url: c.image_url || c.lineArt,
            contest_type: c.contest_type || c.contestType,
            status: (c.status || "").toLowerCase(),
          }));
        }

        const now = new Date();
        let act = contests.find((c) => (c.status || "").toLowerCase() === "active");
        if (!act) {
          act =
            contests.find((c) => {
              const start = c.start_date ? new Date(c.start_date) : null;
              const end = c.end_date ? new Date(c.end_date) : null;
              return start && end && start <= now && now < end;
            }) || null;
        }
        const scheduledList = contests
          .filter(
            (c) => (c.status || "").toLowerCase() === "scheduled" || (c.start_date && new Date(c.start_date) > now)
          )
          .sort((a, b) => {
            const at = a.start_date ? new Date(a.start_date).getTime() : Number.POSITIVE_INFINITY;
            const bt = b.start_date ? new Date(b.start_date).getTime() : Number.POSITIVE_INFINITY;
            return at - bt;
          });
        const sched = scheduledList.length > 0 ? scheduledList[0] : null;

        if (act) {
          setActiveContest(act);
          const viewContestId = act.id || act._id;
          if (viewContestId) {
            const sessionKey = `contest_viewed_${viewContestId}`;
            if (!sessionStorage.getItem(sessionKey)) {
              trackView(viewContestId);
              sessionStorage.setItem(sessionKey, "1");
            }
          }
        } else if (sched) {
          setScheduledContest(sched);
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

  // Countdown handling
  const formatHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  const [activeRemaining, setActiveRemaining] = useState<string>("--:--:--");
  const [startCountdown, setStartCountdown] = useState<string>("--:--:--");

  useEffect(() => {
    function tick() {
      const now = new Date();
      if (activeContest) {
        const end = new Date(activeContest.end_date);
        const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
        setActiveRemaining(formatHMS(diff));
      } else if (scheduledContest) {
        const start = new Date(scheduledContest.start_date);
        const diff = Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000));
        setStartCountdown(formatHMS(diff));
      }
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeContest, scheduledContest]);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  // Active contest
  if (activeContest) {
    return (
      <FeaturedContest
        title={activeContest.title}
        imageUrl={activeContest.image_url}
        remainingTime={activeRemaining}
        contestType={activeContest.contest_type as any}
        description={activeContest.description}
        contestId={(activeContest.id || activeContest._id) as string}
      />
    );
  }

  // Scheduled contest placeholder (single column with instructions)
  if (scheduledContest) {
    return (
      <FeaturedContest
        title={scheduledContest.title}
        description={scheduledContest.description}
        isScheduledPlaceholder
        startsIn={startCountdown}
        contestType={scheduledContest.contest_type}
      />
    );
  }

  // If there's an error loading the contest
  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl">
          <p className="font-semibold mb-2">Error</p>
          <p>{error}</p>
          <div className="mt-4 flex flex-col gap-2 items-center">
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // Absolute fallback when no contests are available
  if (!activeContest && !scheduledContest) {
    return (
      <FeaturedContest
        title="No Active Contest"
        description="There isn't an active contest right now. Check back soon for the next daily coloring challenge!"
        imageUrl="/examples/woodland-creatures-line-art.png"
        contestType="daily"
        isScheduledPlaceholder
      />
    );
  }
  return null;
}

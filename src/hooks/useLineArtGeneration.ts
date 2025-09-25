import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface LineArt {
  id: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  bwImageUrl: string;
  keywords: string[];
  artStyle?: "anime" | "matisse" | "standard";
}

export function useLineArtGeneration() {
  const [lineArt, setLineArt] = useState<LineArt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateLineArt = async (date?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Attempt a REST fetch to future backend endpoint (placeholder)
      // Currently no backend route exists; will intentionally fallback.
      let data: any = null;
      try {
        const res = await fetch(`${API_URL}/api/line-art/daily${date ? `?date=${date}` : ""}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        // swallow error and use fallback below
      }

      if (!data) {
        console.warn("Line art endpoint unavailable, using fallback");
        const fallbackData = {
          id: `fallback-${new Date().toISOString().split("T")[0]}`,
          date: new Date().toISOString().split("T")[0],
          title: "Daily Coloring Challenge",
          description: "A beautiful coloring page for today's challenge.",
          imageUrl:
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
          bwImageUrl:
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
          keywords: ["coloring", "art", "challenge", "creative"],
            artStyle: "standard" as const,
        };
        setLineArt(fallbackData);
        return fallbackData;
      }

      setLineArt(data as LineArt);
      return data as LineArt;
    } catch (err) {
      console.warn("Generate line art error, using fallback:", err);
      // Always provide fallback data instead of throwing error
      const fallbackData = {
        id: `fallback-${new Date().toISOString().split("T")[0]}`,
        date: new Date().toISOString().split("T")[0],
        title: "Daily Coloring Challenge",
        description: "A beautiful coloring page for today's challenge.",
        imageUrl:
          "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
        bwImageUrl:
          "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
        keywords: ["coloring", "art", "challenge", "creative"],
        artStyle: "standard" as const,
      };
      setLineArt(fallbackData);
      setError(null); // Clear error since we have fallback
      return fallbackData;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate line art for today when the hook is first used
    generateLineArt();
  }, []);

  return {
    lineArt,
    isLoading,
    error,
    generateLineArt,
  };
}

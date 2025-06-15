import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

      // Call the Supabase Edge Function to generate line art
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate_line_art",
        {
          body: date ? { date } : {},
        },
      );

      if (error) {
        console.warn("Edge function error, using fallback:", error);
        // Use fallback data if edge function fails
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

      if (!data) {
        console.warn("No data received, using fallback");
        // Use fallback data if no data received
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

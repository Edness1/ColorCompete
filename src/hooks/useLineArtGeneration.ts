import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface LineArt {
  _id?: string; // from Mongo
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  bwImageUrl: string;
  keywords: string[];
  artStyle?: "anime" | "matisse" | "standard";
  attribution?: string;
}

export function useLineArtGeneration() {
  const [lineArt, setLineArt] = useState<LineArt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateLineArt = async (date?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/line-art/daily${date ? `?date=${date}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch daily line art");
      const data = await res.json();
      setLineArt(data as LineArt);
      return data as LineArt;
    } catch (err) {
      console.warn("Generate line art error, using fallback:", err);
      // Always provide fallback data instead of throwing error
      setError((err as Error).message);
      return null;
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

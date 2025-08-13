import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Star,
  Filter,
  ChevronDown,
  Loader2,
  Share2,
  Copy,
  Check,
  Instagram,
  Music,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { MainHeader } from "./header";
import { MainFooter } from "./footer";
import { API_URL } from "@/lib/utils";
import { useVoting } from "@/hooks/useVoting";
import { useAuth } from "@/contexts/AuthContext";

interface Submission {
  id: string;
  imageUrl: string;
  artistName: string;
  voteCount: number;
  submissionDate: string;
  hasVoted: boolean;
  ageGroup?: string;
  contestType?: string;
  user_id?: string;
  public_url?: string;
}


const GalleryView = ({
  submissions = [],
  isLoading = false,
}: {
  submissions?: Submission[];
  isLoading?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState("newest");
  const [ageFilter, setAgeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [gallerySubmissions, setGallerySubmissions] = useState<Submission[]>([]);
  const [fetchingSubmissions, setFetchingSubmissions] = useState(true);
  const [copiedSubmissionId, setCopiedSubmissionId] = useState<string | null>(null);
  const [originalSubmissions, setOriginalSubmissions] = useState<Submission[]>([]); // <-- move here
  const { user } = useAuth();

  // Scroll to submission if present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const submissionId = urlParams.get('submission');
    if (submissionId && gallerySubmissions.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`submission-${submissionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 3000);
        }
      }, 100);
    }
  }, [gallerySubmissions]);

  // Use the voting hook
  const { toggleVote, isVoting, checkUserVote } = useVoting({
    onVoteSuccess: (submissionId, hasVoted, newVoteCount) => {
      setGallerySubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                voteCount: newVoteCount !== undefined
                  ? newVoteCount
                  : hasVoted
                    ? submission.voteCount + 1
                    : Math.max(0, submission.voteCount - 1),
                hasVoted,
              }
            : submission,
        ),
      );
    },
  });

  // Fetch submissions from API and transform
  useEffect(() => {
    const fetchSubmissions = async () => {
      setFetchingSubmissions(true);
      try {
        const response = await fetch(`${API_URL}/api/submissions`);
        if (!response.ok) {
          throw new Error("Failed to fetch submissions from API");
        }
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const transformedData: Submission[] = await Promise.all(
            data.map(async (item: any) => {
              const id = item._id || item.id;
              // Use checkUserVote to determine if the user has voted
              const hasVoted = await checkUserVote(id);
              return {
                id,
                imageUrl:
                  item.file_path ||
                  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
                artistName: item.profiles?.username || item.artist_name || "Anonymous",
                voteCount: Array.isArray(item.voteCount)
                  ? item.voteCount.length
                  : typeof item.voteCount === "number"
                    ? item.voteCount
                    : Array.isArray(item.votes)
                      ? item.votes.length
                      : typeof item.votes === "number"
                        ? item.votes
                        : typeof item.vote_count === "number"
                          ? item.vote_count
                          : 0,
                submissionDate: item.submissionDate || item.createdAt || item.created_at || new Date().toISOString(),
                hasVoted,
                ageGroup: item.ageGroup || item.age_group,
                contestType: item.contestType || item.medium || item.contest_type,
                user_id: item.user_id,
                public_url: item.public_url,
              };
            })
          );
          setOriginalSubmissions(transformedData);
          setGallerySubmissions(transformedData);
          console.log(`Loaded ${transformedData.length} submissions from API`);
        } else {
          setOriginalSubmissions(defaultSubmissions);
          setGallerySubmissions(defaultSubmissions);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
        setOriginalSubmissions(defaultSubmissions);
        setGallerySubmissions(defaultSubmissions);
      } finally {
        setFetchingSubmissions(false);
      }
    };

    if (submissions && submissions.length > 0) {
      setOriginalSubmissions(submissions);
      setGallerySubmissions(submissions);
      setFetchingSubmissions(false);
    } else {
      fetchSubmissions();
    }
  }, [user]);

  const handleVote = async (id: string, hasVoted: boolean) => {
    await toggleVote(id, hasVoted);
  };

  const handleShare = async (submission: Submission) => {
    const shareUrl = `${window.location.origin}/gallery?submission=${submission.id}#submission-${submission.id}`;
    const shareText = `You can vote for me at ${shareUrl}`;
    const shareData = {
      title: `Vote for ${submission.artistName}'s artwork!`,
      text: shareText,
      url: shareUrl,
    };

    // Check if Web Share API is available and the data can be shared
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // User cancelled or error occurred, fall back to clipboard
        console.log("Share cancelled or failed:", error);
      }
    } else if (navigator.share) {
      // Fallback for browsers that support share but not canShare
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
        return;
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedSubmissionId(submission.id);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedSubmissionId(null);
      }, 2000);
      // Show a toast notification
      // You could also use your toast system here if available
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback: Select the URL text (for older browsers)
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedSubmissionId(submission.id);
      setTimeout(() => {
        setCopiedSubmissionId(null);
      }, 2000);
    }
  };

  const handleSocialShare = (
    platform: "instagram" | "tiktok",
    submission: Submission,
  ) => {
    const shareUrl = `${window.location.origin}/gallery?submission=${submission.id}`;
    const shareText = `Check out this amazing ${submission.contestType} artwork by ${submission.artistName} in our daily coloring contest! 🎨✨`;

    if (platform === "instagram") {
      const textToCopy = `${shareText}\n\n${shareUrl}\n\n#ColorCompete #ArtContest #Coloring #DigitalArt`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedSubmissionId(submission.id);
        setTimeout(() => setCopiedSubmissionId(null), 2000);
        window.open("https://www.instagram.com/", "_blank");
      });
    } else if (platform === "tiktok") {
      const textToCopy = `${shareText}\n\n${shareUrl}\n\n#ColorCompete #ArtContest #Coloring #DigitalArt #ArtChallenge`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedSubmissionId(submission.id);
        setTimeout(() => setCopiedSubmissionId(null), 2000);
        window.open("https://www.tiktok.com/", "_blank");
      });
    }
  };

  const filterSubmissions = (filterType: string, age = ageFilter, format = formatFilter) => {
    setFilter(filterType);
    let filtered = [...originalSubmissions];
    if (age !== "all") {
      filtered = filtered.filter((s) => s.ageGroup === age);
    }
    if (format !== "all") {
      filtered = filtered.filter((s) => s.contestType === format);
    }
    switch (filterType) {
      case "top-rated":
        filtered.sort((a, b) => b.voteCount - a.voteCount);
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime(),
        );
        break;
      case "random":
        filtered.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }
    setGallerySubmissions(filtered);
  };

  useEffect(() => {
    filterSubmissions(filter, ageFilter, formatFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageFilter, formatFilter, originalSubmissions]);

  return (
    <>
      <MainHeader />
      <div className="container mx-auto py-8 bg-background">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Gallery</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Tabs
              defaultValue="all"
              className="w-full sm:w-auto"
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">All Submissions</TabsTrigger>
                <TabsTrigger value="today">Today's Contest</TabsTrigger>
                <TabsTrigger value="past">Past Contests</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {filter === "top-rated"
                      ? "Top Rated"
                      : filter === "newest"
                        ? "Newest"
                        : "Random"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => filterSubmissions("top-rated")}
                  >
                    Top Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => filterSubmissions("newest")}>Newest</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => filterSubmissions("random")}>Random</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {(fetchingSubmissions || isLoading) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gallerySubmissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                  id={`submission-${submission.id}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={submission.imageUrl}
                      alt={`Artwork by ${submission.artistName}`}
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                    />
                    {/* Overlay with quick stats */}
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      {activeTab === "today" ? (
                        <Star className="h-3 w-3" />
                      ) : (
                        <Heart className="h-3 w-3" />
                      )}
                      {submission.voteCount}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {/* Artist name and voting section */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg truncate">
                          {submission.artistName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(submission.submissionDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => handleVote(submission.id)}
                          disabled={isVoting}
                          title={
                            submission.hasVoted
                              ? "Remove vote"
                              : "Vote for this artwork"
                          }
                        >
                          {isVoting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : activeTab === "today" ? (
                            <Star
                              className={`h-5 w-5 transition-colors ${submission.hasVoted ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
                            />
                          ) : (
                            <Heart
                              className={`h-5 w-5 transition-colors ${submission.hasVoted ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                            />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              title="Share this artwork"
                            >
                              {copiedSubmissionId === submission.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleShare(submission)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSocialShare("instagram", submission)
                              }
                            >
                              <Instagram className="h-4 w-4 mr-2" />
                              Share to Instagram
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSocialShare("tiktok", submission)
                              }
                            >
                              <Music className="h-4 w-4 mr-2" />
                              Share to TikTok
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Submission details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Votes:</span>
                        <span className="font-medium">
                          {submission.voteCount}
                        </span>
                      </div>
                    </div>

                    {/* Tags/badges */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {submission.hasVoted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Voted
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {gallerySubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-lg">
                  No submissions found
                </p>
                <Button variant="outline" className="mt-4">
                  Be the first to submit!
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <MainFooter />
    </>
  );
};

// Default mock data
const defaultSubmissions: Submission[] = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    artistName: "Jane Cooper",
    voteCount: 42,
    submissionDate: "2023-06-15T10:30:00",
    hasVoted: false,
    ageGroup: "adult",
    contestType: "traditional",
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=800&q=80",
    artistName: "Alex Morgan",
    voteCount: 38,
    submissionDate: "2023-06-15T09:45:00",
    hasVoted: true,
    ageGroup: "teen",
    contestType: "digital",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=800&q=80",
    artistName: "Taylor Swift",
    voteCount: 56,
    submissionDate: "2023-06-15T08:20:00",
    hasVoted: false,
    ageGroup: "adult",
    contestType: "digital",
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80",
    artistName: "Chris Evans",
    voteCount: 29,
    submissionDate: "2023-06-14T16:15:00",
    hasVoted: false,
    ageGroup: "adult",
    contestType: "traditional",
  },
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1605106702734-205df224ecce?w=800&q=80",
    artistName: "Emma Watson",
    voteCount: 47,
    submissionDate: "2023-06-14T14:30:00",
    hasVoted: true,
    ageGroup: "senior",
    contestType: "traditional",
  },
  {
    id: "6",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    artistName: "John Smith",
    voteCount: 33,
    submissionDate: "2023-06-14T11:45:00",
    hasVoted: false,
    ageGroup: "child",
    contestType: "traditional",
  },
  {
    id: "7",
    imageUrl:
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80",
    artistName: "Sophia Chen",
    voteCount: 51,
    submissionDate: "2023-06-13T15:20:00",
    hasVoted: false,
    ageGroup: "teen",
    contestType: "digital",
  },
  {
    id: "8",
    imageUrl:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800&q=80",
    artistName: "Michael Johnson",
    voteCount: 24,
    submissionDate: "2023-06-13T10:10:00",
    hasVoted: true,
    ageGroup: "child",
    contestType: "digital",
  },
  {
    id: "9",
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    artistName: "Isabella Rodriguez",
    voteCount: 63,
    submissionDate: "2023-06-13T08:45:00",
    hasVoted: false,
    ageGroup: "teen",
    contestType: "traditional",
  },
  {
    id: "10",
    imageUrl:
      "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&q=80",
    artistName: "David Kim",
    voteCount: 35,
    submissionDate: "2023-06-12T19:30:00",
    hasVoted: true,
    ageGroup: "adult",
    contestType: "digital",
  },
  {
    id: "11",
    imageUrl:
      "https://images.unsplash.com/photo-1578662015441-1d5e4684c5e5?w=800&q=80",
    artistName: "Luna Martinez",
    voteCount: 41,
    submissionDate: "2023-06-12T17:15:00",
    hasVoted: false,
    ageGroup: "child",
    contestType: "traditional",
  },
  {
    id: "12",
    imageUrl:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    artistName: "Oliver Thompson",
    voteCount: 28,
    submissionDate: "2023-06-12T14:20:00",
    hasVoted: false,
    ageGroup: "senior",
    contestType: "digital",
  },
  {
    id: "13",
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    artistName: "Zoe Anderson",
    voteCount: 59,
    submissionDate: "2023-06-12T12:10:00",
    hasVoted: true,
    ageGroup: "teen",
    contestType: "traditional",
  },
  {
    id: "14",
    imageUrl:
      "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&q=80",
    artistName: "Marcus Williams",
    voteCount: 37,
    submissionDate: "2023-06-11T20:45:00",
    hasVoted: false,
    ageGroup: "adult",
    contestType: "digital",
  },
  {
    id: "15",
    imageUrl:
      "https://images.unsplash.com/photo-1578662015441-1d5e4684c5e5?w=800&q=80",
    artistName: "Aria Patel",
    voteCount: 44,
    submissionDate: "2023-06-11T18:30:00",
    hasVoted: false,
    ageGroup: "child",
    contestType: "traditional",
  },
  {
    id: "16",
    imageUrl:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    artistName: "Eleanor Davis",
    voteCount: 52,
    submissionDate: "2023-06-11T16:15:00",
    hasVoted: true,
    ageGroup: "senior",
    contestType: "digital",
  },
  {
    id: "17",
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    artistName: "Ethan Brown",
    voteCount: 31,
    submissionDate: "2023-06-11T13:40:00",
    hasVoted: false,
    ageGroup: "teen",
    contestType: "traditional",
  },
  {
    id: "18",
    imageUrl:
      "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&q=80",
    artistName: "Maya Singh",
    voteCount: 48,
    submissionDate: "2023-06-11T11:25:00",
    hasVoted: false,
    ageGroup: "adult",
    contestType: "digital",
  },
  {
    id: "19",
    imageUrl:
      "https://images.unsplash.com/photo-1578662015441-1d5e4684c5e5?w=800&q=80",
    artistName: "Noah Garcia",
    voteCount: 26,
    submissionDate: "2023-06-10T21:50:00",
    hasVoted: true,
    ageGroup: "child",
    contestType: "traditional",
  },
  {
    id: "20",
    imageUrl:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    artistName: "Grace Wilson",
    voteCount: 55,
    submissionDate: "2023-06-10T19:35:00",
    hasVoted: false,
    ageGroup: "senior",
    contestType: "digital",
  },
];

export default GalleryView;

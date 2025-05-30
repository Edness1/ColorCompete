import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, DollarSign, Download, Star } from "lucide-react";
import { Contest, ContestEntry } from "@shared/schema";
import ContestGallery from "@/components/home/ContestGallery";

export default function ContestDetail() {
  const [, params] = useRoute("/contests/:id");
  const contestId = params?.id ? parseInt(params.id) : 0;

  const { data: contest, isLoading: isLoadingContest } = useQuery<Contest>({
    queryKey: ['/api/contests', contestId],
    enabled: !!contestId,
  });

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<ContestEntry[]>({
    queryKey: ['/api/entries/contest', contestId],
    enabled: !!contestId,
  });

  if (isLoadingContest) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0 md:w-1/2 h-64 bg-gray-200"></div>
                <div className="p-8 md:w-1/2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="h-24 bg-gray-200 rounded w-full mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Contest Not Found</h2>
          <p className="mb-6">The contest you're looking for doesn't exist or has been removed.</p>
          <Link href="/contests">
            <Button>View All Contests</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if contest is active
  const isActive = new Date(contest.endDate) > new Date();

  // Format the end date
  const endDate = new Date(contest.endDate);
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate time left if contest is active
  const getTimeLeft = () => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Contest ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days} days ${hours} hours left`;
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">{contest.title}</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2">
              {contest.imageUrl && (
                <img 
                  className="h-full w-full object-cover" 
                  src={contest.imageUrl} 
                  alt={`${contest.title} contest artwork`} 
                />
              )}
            </div>
            <div className="p-8 md:w-1/2">
              <Badge className={isActive ? "bg-green-500" : "bg-gray-500"}>
                {isActive ? "Active" : "Completed"}
              </Badge>
              
              {isActive && (
                <div className="mt-3 flex items-center">
                  <Badge variant="outline" className="bg-accent bg-opacity-10 text-accent px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3 mr-1" /> {getTimeLeft()}
                  </Badge>
                </div>
              )}
              
              <p className="mt-4 text-medium">{contest.description}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-medium block mb-1">Prize Pool</span>
                  <span className="font-semibold text-lg">${contest.prizeAmount}</span>
                </div>
                <div>
                  <span className="text-sm text-medium block mb-1">Entries</span>
                  <span className="font-semibold text-lg">{contest.entryCount}</span>
                </div>
                <div>
                  <span className="text-sm text-medium block mb-1">Entry Fee</span>
                  <span className="font-semibold text-lg">${contest.entryFee.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-sm text-medium block mb-1">End Date</span>
                  <span className="font-semibold text-lg">{formattedDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-medium block mb-1">Difficulty</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-4 w-4 ${i < contest.difficulty ? "text-accent fill-accent" : "text-accent"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Link href={`/contests/${contest.id}/download`}>
                  <Button className="flex-1 bg-primary text-white">
                    <Download className="mr-2 h-4 w-4" /> Download Line Art
                  </Button>
                </Link>
                {isActive && (
                  <Link href={`/submit/${contest.id}`}>
                    <Button variant="secondary" className="flex-1 text-white">
                      Submit Artwork
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contest Details and Entries */}
        <Card className="max-w-4xl mx-auto">
          <Tabs defaultValue="entries">
            <TabsList className="w-full">
              <TabsTrigger value="entries" className="flex-1">Entries ({entries.length})</TabsTrigger>
              <TabsTrigger value="rules" className="flex-1">Rules & Guidelines</TabsTrigger>
              <TabsTrigger value="winners" className="flex-1">Winners</TabsTrigger>
            </TabsList>
            
            <TabsContent value="entries" className="p-6">
              {isLoadingEntries ? (
                <div className="text-center py-6">Loading entries...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl font-medium text-gray-600">No entries yet.</p>
                  <p className="mt-2 text-gray-500">Be the first to submit your artwork!</p>
                  {isActive && (
                    <Link href={`/submit/${contest.id}`}>
                      <Button className="mt-4 bg-primary">Submit Your Entry</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entries.map((entry) => (
                    <div key={entry.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                      <img 
                        className="w-full h-48 object-cover" 
                        src={entry.imageUrl} 
                        alt={`${entry.title} entry`} 
                      />
                      <div className="p-4">
                        <h3 className="font-poppins font-semibold text-lg mb-1">{entry.title}</h3>
                        <p className="text-sm text-medium mb-2">by {entry.username}</p>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mb-3">{entry.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-sm">
                            {entry.medium === "digital" ? "Digital" : "Traditional"}
                          </Badge>
                          <div className="text-sm">{entry.votes} votes</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rules" className="p-6">
              <h3 className="text-xl font-semibold mb-4">Contest Rules</h3>
              <div className="space-y-4">
                <p>To participate in this coloring contest, please follow these guidelines:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Download the provided line art template.</li>
                  <li>Color the artwork using your preferred medium (digital or traditional).</li>
                  <li>Submit your entry before the contest deadline.</li>
                  <li>Your submission must be your original work.</li>
                  <li>You may only submit one entry per contest.</li>
                  <li>By submitting, you grant ColorCompete permission to share your artwork on our platforms.</li>
                </ul>
                <h4 className="font-semibold mt-6">Judging Criteria</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Creativity and originality</li>
                  <li>Color harmony and technique</li>
                  <li>Overall aesthetic appeal</li>
                  <li>Community votes (50% of final score)</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="winners" className="p-6">
              {isActive ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">Contest In Progress</h3>
                  <p className="text-gray-600">Winners will be announced after the contest ends on {formattedDate}.</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-4">Winners</h3>
                  {entries.length > 0 ? (
                    <div className="space-y-6">
                      {entries
                        .sort((a, b) => b.votes - a.votes)
                        .slice(0, 3)
                        .map((entry, index) => (
                          <div key={entry.id} className="flex items-center p-4 border rounded-lg">
                            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full mr-4 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{entry.title}</h4>
                              <p className="text-sm text-gray-600">by {entry.username}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{entry.votes} votes</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No entries were submitted for this contest.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

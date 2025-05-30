import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  List, 
  Heart 
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ContestEntry } from "@shared/schema";

export default function ContestGallery() {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('most_votes');
  const { toast } = useToast();

  const { data: entries = [], isLoading } = useQuery<ContestEntry[]>({
    queryKey: ['/api/entries', sortBy],
  });

  const voteMutation = useMutation({
    mutationFn: (entryId: number) => {
      return apiRequest('POST', `/api/entries/${entryId}/vote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      toast({
        title: "Vote submitted!",
        description: "Your vote has been counted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleVote = (entryId: number) => {
    voteMutation.mutate(entryId);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold font-poppins">Contest Gallery</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold font-poppins">Contest Gallery</h2>
          <div className="flex space-x-2 items-center">
            <button 
              className={`text-medium hover:text-primary transition ${viewType === 'grid' ? 'text-primary' : ''}`}
              onClick={() => setViewType('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button 
              className={`text-medium hover:text-primary transition ${viewType === 'list' ? 'text-primary' : ''}`}
              onClick={() => setViewType('list')}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="ml-4 border rounded-md py-1 px-3 text-medium focus:outline-none focus:ring-1 focus:ring-primary w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="most_votes">Most Voted</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 ${viewType === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
          {entries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl font-medium text-gray-600">No entries yet.</p>
              <p className="mt-2 text-gray-500">Be the first to submit your artwork!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 transition-transform hover:-translate-y-1 hover:shadow-md">
                <img 
                  className="w-full h-48 object-cover" 
                  src={entry.imageUrl} 
                  alt={`${entry.title} coloring contest entry`} 
                />
                <div className="p-4">
                  <h3 className="font-poppins font-semibold text-lg mb-1">{entry.title}</h3>
                  <p className="text-sm text-medium mb-3">by {entry.username}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-primary" />
                      <span>{entry.votes} votes</span>
                    </div>
                    <Button 
                      variant="link" 
                      className="text-sm font-medium text-secondary hover:text-secondary/80 transition p-0"
                      onClick={() => handleVote(entry.id)}
                      disabled={voteMutation.isPending}
                    >
                      Vote Now
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {entries.length > 0 && (
          <div className="mt-10 text-center">
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-primary px-6 py-2 font-medium text-primary hover:bg-primary hover:text-white transition"
            >
              Load More Entries
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

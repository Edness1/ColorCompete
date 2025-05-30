import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutGrid, 
  List, 
  Heart,
  Filter
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ContestEntry } from "@shared/schema";

export default function Gallery() {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('most_voted');
  const [filterMedium, setFilterMedium] = useState<string[]>([]);
  
  const { data: entries = [], isLoading } = useQuery<ContestEntry[]>({
    queryKey: ['/api/entries/gallery', sortBy, filterMedium.join(',')],
  });

  const toggleMediumFilter = (medium: string) => {
    if (filterMedium.includes(medium)) {
      setFilterMedium(filterMedium.filter(m => m !== medium));
    } else {
      setFilterMedium([...filterMedium, medium]);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-center">Artwork Gallery</h1>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Apply filters
  let filteredEntries = [...entries];
  if (filterMedium.length > 0) {
    filteredEntries = filteredEntries.filter(entry => filterMedium.includes(entry.medium));
  }

  // Apply sorting
  filteredEntries.sort((a, b) => {
    if (sortBy === 'most_voted') return b.votes - a.votes;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4 text-center">Artwork Gallery</h1>
        <p className="text-center text-medium max-w-2xl mx-auto mb-8">
          Explore the amazing artwork submitted by our community
        </p>

        <div className="flex flex-wrap justify-between items-center mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="ml-4 border rounded-md py-1 px-3 text-medium focus:outline-none focus:ring-1 focus:ring-primary w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="most_voted">Most Voted</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Filter
                {filterMedium.length > 0 && (
                  <Badge className="ml-2 bg-primary">{filterMedium.length}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Options</SheetTitle>
                <SheetDescription>
                  Refine the gallery to find specific types of artwork
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <h3 className="font-medium mb-3">Medium</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="digital" 
                      checked={filterMedium.includes('digital')}
                      onCheckedChange={() => toggleMediumFilter('digital')}
                    />
                    <Label htmlFor="digital">Digital</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="traditional" 
                      checked={filterMedium.includes('traditional')}
                      onCheckedChange={() => toggleMediumFilter('traditional')}
                    />
                    <Label htmlFor="traditional">Traditional</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setFilterMedium([])}
                >
                  Clear All
                </Button>
                <Button onClick={() => console.log('Applied filters')}>
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-xl font-medium text-gray-600">No artworks found.</p>
            <p className="mt-2 text-gray-500">Try changing your filters or check back later.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewType === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id} 
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-md ${
                  viewType === 'list' ? 'flex' : ''
                }`}
              >
                <div className={viewType === 'list' ? 'w-1/3' : ''}>
                  <img 
                    className="w-full h-48 object-cover" 
                    src={entry.imageUrl} 
                    alt={entry.title} 
                  />
                </div>
                <div className={`p-4 ${viewType === 'list' ? 'w-2/3' : ''}`}>
                  <h3 className="font-poppins font-semibold text-lg mb-1">{entry.title}</h3>
                  <p className="text-sm text-medium mb-2">by {entry.username}</p>
                  {entry.description && viewType === 'list' && (
                    <p className="text-sm text-gray-600 mb-3">{entry.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{entry.medium === 'digital' ? 'Digital' : 'Traditional'}</Badge>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-primary" />
                      <span>{entry.votes} votes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEntries.length > 0 && filteredEntries.length % 12 === 0 && (
          <div className="mt-10 text-center">
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-primary px-6 py-2 font-medium text-primary hover:bg-primary hover:text-white transition"
            >
              Load More Artwork
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

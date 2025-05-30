import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, DollarSign, Users } from "lucide-react";
import { Contest } from "@shared/schema";

export default function Contests() {
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: contests = [], isLoading } = useQuery<Contest[]>({
    queryKey: ['/api/contests', activeTab],
  });

  // Filter contests based on active tab
  const filteredContests = contests.filter(contest => {
    const now = new Date();
    const endDate = new Date(contest.endDate);
    
    if (activeTab === "active") {
      return endDate > now;
    } else if (activeTab === "past") {
      return endDate <= now;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-center">Coloring Contests</h1>
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-48 bg-white rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4 text-center">Coloring Contests</h1>
        <p className="text-center text-medium max-w-2xl mx-auto mb-8">
          Showcase your coloring skills and compete with artists from around the world
        </p>

        <Tabs defaultValue="active" className="max-w-4xl mx-auto" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Contests</TabsTrigger>
              <TabsTrigger value="past">Past Contests</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active">
            {filteredContests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-xl font-medium text-gray-600">No active contests at the moment.</p>
                <p className="mt-2 text-gray-500">Check back soon for new contests!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} isActive={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {filteredContests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-xl font-medium text-gray-600">No past contests found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} isActive={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ContestCardProps {
  contest: Contest;
  isActive: boolean;
}

function ContestCard({ contest, isActive }: ContestCardProps) {
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
    <Card className="overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 bg-gray-100">
          {contest.imageUrl && (
            <img 
              src={contest.imageUrl} 
              alt={contest.title} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="md:w-2/3">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge 
                  className={isActive ? "bg-green-500" : "bg-gray-500"}
                >
                  {isActive ? "Active" : "Completed"}
                </Badge>
                <CardTitle className="mt-2">{contest.title}</CardTitle>
              </div>
              {isActive && (
                <Badge variant="outline" className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" /> {getTimeLeft()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-medium mb-4">{contest.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Ends: {formattedDate}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Prize: ${contest.prizeAmount}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Entries: {contest.entryCount}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/contests/${contest.id}`}>
              <Button variant="outline">View Details</Button>
            </Link>
            {isActive && (
              <Link href={`/submit/${contest.id}`}>
                <Button className="bg-primary">Submit Artwork</Button>
              </Link>
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

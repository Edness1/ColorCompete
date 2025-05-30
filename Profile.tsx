import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Medal, Image, Trophy, Settings } from "lucide-react";
import { User, ContestEntry, UserRanking } from "@shared/schema";
import { Link, useLocation } from "wouter";

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entries");

  // Get current user data
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ['/api/user/current'],
    retry: false,
  });

  // Get user's submissions
  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<ContestEntry[]>({
    queryKey: ['/api/user/entries'],
    enabled: !!user,
  });

  // Get user's stats
  const { data: userRanking, isLoading: isLoadingRanking } = useQuery<UserRanking>({
    queryKey: ['/api/user/ranking'],
    enabled: !!user,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => {
      return apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
      toast({
        title: "Logged out successfully",
      });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoadingUser) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-40 bg-white rounded-lg mb-8"></div>
              <div className="h-96 bg-white rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>You're not logged in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Please log in to view your profile</p>
              <div className="flex justify-center space-x-4">
                <Link href="/login">
                  <Button>Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-primary">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {userRanking?.rank <= 3 && (
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">
                      {userRanking.rank}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
                  <p className="text-gray-600 mb-4">{user.email}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <span className="text-sm text-gray-500 block">Entries</span>
                      <span className="font-bold text-lg">{entries.length}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-gray-500 block">Votes Received</span>
                      <span className="font-bold text-lg">{userRanking?.votes || 0}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-gray-500 block">Rank</span>
                      <span className="font-bold text-lg">#{userRanking?.rank || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                  </Button>
                </div>
              </div>
              
              {user.membership && user.membership !== 'free' && (
                <div className="mt-4 p-2 bg-primary/10 rounded-md text-center">
                  <span className="text-primary font-medium">
                    {user.membership === 'pro' ? 'Pro' : 'Premium'} Membership
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Profile Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-8">
              <TabsTrigger value="entries" className="flex-1">
                <Image className="h-4 w-4 mr-2" /> My Entries
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex-1">
                <Trophy className="h-4 w-4 mr-2" /> Achievements
              </TabsTrigger>
              <TabsTrigger value="votes" className="flex-1">
                <Heart className="h-4 w-4 mr-2" /> My Votes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="entries">
              {isLoadingEntries ? (
                <div className="text-center py-8">Loading your entries...</div>
              ) : entries.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-16">
                    <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No Entries Yet</h3>
                    <p className="text-gray-600 mb-6">You haven't submitted any artwork yet.</p>
                    <Link href="/contests">
                      <Button>Browse Contests</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <div className="aspect-video">
                        <img 
                          src={entry.imageUrl} 
                          alt={entry.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{entry.title}</h3>
                            <p className="text-sm text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 text-primary mr-1" />
                            <span className="text-sm">{entry.votes}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm px-2 py-1 bg-gray-100 rounded-full">
                            {entry.medium === 'digital' ? 'Digital' : 'Traditional'}
                          </span>
                          <Link href={`/contests/${entry.contestId}`}>
                            <Button variant="link" className="p-0 h-auto">View Contest</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="achievements">
              <Card>
                <CardContent className="pt-6">
                  {userRanking?.rank <= 10 ? (
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                        <Medal className="h-8 w-8 text-yellow-500 mr-4" />
                        <div>
                          <h3 className="font-semibold">Top 10 Artist</h3>
                          <p className="text-sm text-gray-600">You're ranked #{userRanking.rank} on the platform</p>
                        </div>
                      </div>
                      
                      {entries.length >= 5 && (
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                          <Image className="h-8 w-8 text-blue-500 mr-4" />
                          <div>
                            <h3 className="font-semibold">Dedicated Colorist</h3>
                            <p className="text-sm text-gray-600">You've submitted 5+ artworks</p>
                          </div>
                        </div>
                      )}
                      
                      {userRanking.votes >= 100 && (
                        <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                          <Heart className="h-8 w-8 text-purple-500 mr-4" />
                          <div>
                            <h3 className="font-semibold">Community Favorite</h3>
                            <p className="text-sm text-gray-600">Your artwork has received 100+ votes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                      <p className="text-gray-600">Keep participating to earn achievements!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="votes">
              <Card>
                <CardContent className="pt-6 text-center py-16">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Vote History</h3>
                  <p className="text-gray-600 mb-6">This feature will be available soon!</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Medal,
  Settings,
  Image as ImageIcon,
  CreditCard,
  Sparkles,
  Award,
  BarChart,
  User,
  Bell,
  Shield,
  Eye,
  Mail,
  Phone,
  Globe,
  Lock,
  Trash2,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { MainHeader } from "./header";
import { API_URL } from "@/lib/utils";

interface Submission {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  votes: number;
  contestId: string;
  contestName: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "win" | "participation" | "milestone";
}

interface UserProfileProps {
  username?: string;
  avatarUrl?: string;
  joinDate?: string;
  bio?: string;
  submissions?: Submission[];
  achievements?: Achievement[];
}

const UserProfile = ({
  username: initialUsername = "ArtisticUser",
  avatarUrl:
    initialAvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=artistic",
  joinDate: initialJoinDate = "January 2023",
  bio: initialBio = "Passionate digital artist who loves participating in daily coloring contests. Always looking to improve my skills and connect with other artists.",
  submissions: initialSubmissions = [
    {
      id: "1",
      title: "Enchanted Forest",
      imageUrl:
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80",
      date: "May 15, 2023",
      votes: 42,
      contestId: "c1",
      contestName: "Fantasy Landscapes",
    },
    {
      id: "2",
      title: "Ocean Dreams",
      imageUrl:
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=80",
      date: "April 28, 2023",
      votes: 37,
      contestId: "c2",
      contestName: "Underwater World",
    },
    {
      id: "3",
      title: "Space Adventure",
      imageUrl:
        "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=300&q=80",
      date: "April 10, 2023",
      votes: 51,
      contestId: "c3",
      contestName: "Cosmic Journey",
    },
    {
      id: "4",
      title: "Mountain Sunset",
      imageUrl:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80",
      date: "March 22, 2023",
      votes: 29,
      contestId: "c4",
      contestName: "Natural Wonders",
    },
  ],
  achievements: initialAchievements = [
    {
      id: "a1",
      title: "First Place Winner",
      description: "Won first place in the Fantasy Landscapes contest",
      date: "May 15, 2023",
      type: "win",
    },
    {
      id: "a2",
      title: "10 Submissions Milestone",
      description: "Completed 10 contest submissions",
      date: "April 30, 2023",
      type: "milestone",
    },
    {
      id: "a3",
      title: "Third Place",
      description: "Placed third in the Cosmic Journey contest",
      date: "April 10, 2023",
      type: "win",
    },
  ],
}: UserProfileProps) => {
  const { user } = useAuth();
  const {
    tier,
    remainingSubmissions,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const userStats = useUserStats();
  const [activeTab, setActiveTab] = useState("submissions");
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userSubmissions, setUserSubmissions] = useState(initialSubmissions);
  const [userAchievements, setUserAchievements] = useState(initialAchievements);
  const [apiProfile, setApiProfile] = useState<any>(null);

  // Fetch user profile data from your API (not Supabase)
  useEffect(() => {
    const fetchApiProfile = async () => {
      if (!user?._id) return;
      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API_URL}/api/users/${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const data = await res.json();
        setApiProfile(data);
      } catch (error) {
        console.error("Error fetching user profile from API:", error);
      }
    };

    fetchApiProfile();
  }, [user]);

  // Fetch user profile data from Supabase (replace with API)
  useEffect(() => {
    if (user) {
      setIsLoading(true);

      // Fetch profile from API
      const fetchProfile = async () => {
        try {
          const res = await fetch(`${API_URL}/api/users/${user._id}`);
          if (!res.ok) throw new Error("Failed to fetch profile");
          const data = await res.json();
          setProfile(data);
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsLoading(false);
        }
      };

      // Fetch user submissions from API
      const fetchSubmissions = async () => {
        try {
          const res = await fetch(`${API_URL}/api/submissions?user_id=${user._id}`);
          if (!res.ok) throw new Error("Failed to fetch submissions");
          const data = await res.json();
          if (data && data.length > 0) {
            setUserSubmissions(
              data.map((sub: any) => ({
                id: sub.id,
                title: sub.title || "Untitled Submission",
                imageUrl: sub.file_path || sub.file_path,
                date: new Date(sub.created_at || sub.date).toLocaleDateString(),
                votes: sub.votes || 0,
                contestId: sub.contest_id || sub.contestId,
                contestName: sub.contest_type || sub.contestName || "Daily Contest",
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching submissions:", error);
        }
      };

      fetchProfile();
      fetchSubmissions();
    }
  }, [user]);

  // Use API profile if available, otherwise fallback to props/defaults
  const username = apiProfile?.username || profile?.username || initialUsername;
  const firstName = apiProfile?.firstName || profile?.firstName || "John";
  const lastName = apiProfile?.lastName || profile?.lastName || "Doe";
  const email = apiProfile?.email || user?.email || "user@example.com";
  const avatarUrl =
    apiProfile?.avatarUrl ||
    profile?.avatar_url ||
    initialAvatarUrl;
  const joinDate = apiProfile?.createdDate
    ? new Date(apiProfile.createdDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : profile
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : initialJoinDate;
  const bio = apiProfile?.bio || profile?.bio || initialBio;
  const submissions = userSubmissions;
  const achievements = userAchievements;

  // Use real stats from the database if available, otherwise fall back to the props
  const winCount = user
    ? userStats.winCount
    : achievements.filter((a) => a.type === "win").length;
  const submissionCount = user
    ? userStats.totalSubmissions
    : submissions.length;

  // Add state for each profile field
  const [editUsername, setEditUsername] = useState(username);
  const [editEmail, setEditEmail] = useState(email);
  const [editFirstName, setEditFirstName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName);
  const [editBio, setEditBio] = useState(bio);
  const [editLocation, setEditLocation] = useState(apiProfile?.location || "");
  const [editWebsite, setEditWebsite] = useState(apiProfile?.website || "");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // When apiProfile loads, update the edit fields
  useEffect(() => {
    setEditUsername(apiProfile?.username || username);
    setEditEmail(apiProfile?.email || email);
    setEditFirstName(apiProfile?.firstName || firstName);
    setEditLastName(apiProfile?.lastName || lastName);
    setEditBio(apiProfile?.bio || bio);
    setEditLocation(apiProfile?.location || "");
    setEditWebsite(apiProfile?.website || "");
  }, [apiProfile]);

  // Handle update
  const handleUpdateProfile = async () => {
    if (!user?._id) return;
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          firstName: editFirstName,
          lastName: editLastName,
          bio: editBio,
          location: editLocation,
          website: editWebsite,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setUpdateSuccess(true);
      // Optionally, refresh profile data here
    } catch (err: any) {
      setUpdateError(err.message || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-background">
      <MainHeader />
      <Card className="mb-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback>
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{username}</CardTitle>
              <CardDescription>Member since {joinDate}</CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{winCount} Wins</Badge>
                <Badge variant="outline">{submissionCount} Submissions</Badge>
                {!subscriptionLoading && user && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{bio}</p>
          {!subscriptionLoading && user && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Subscription Status</span>
                </div>
                <Link to="/pricing">
                  <Button variant="outline" size="sm">
                    Upgrade
                  </Button>
                </Link>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-2 border rounded-md text-center">
                  <div className="text-sm text-muted-foreground">Plan</div>
                  <div className="font-medium">
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </div>
                </div>
                <div className="p-2 border rounded-md text-center">
                  <div className="text-sm text-muted-foreground">
                    Submissions Left
                  </div>
                  <div className="font-medium">{remainingSubmissions}</div>
                </div>
                <div className="p-2 border rounded-md text-center">
                  <div className="text-sm text-muted-foreground">Renewal</div>
                  <div className="font-medium">
                    {new Date().getDate() === 1
                      ? "Today"
                      : `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="submissions">
            <ImageIcon className="mr-2 h-4 w-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Submissions</h2>
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={submission.imageUrl}
                      alt={submission.title}
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      {submission.title}
                    </CardTitle>
                    <CardDescription>{submission.contestName}</CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {submission.date}
                    </span>
                    <Badge>{submission.votes.length} votes</Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-2">
                    <Image as ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">
                    {userStats.totalSubmissions}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Submissions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-2">
                    <BarChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">
                    {userStats.contestsParticipated}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contests Entered
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-2">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.winCount}</div>
                  <p className="text-sm text-muted-foreground">Contest Wins</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">
                    {userStats.totalVotes}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Votes Received
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {achievement.type === "win" ? (
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    ) : achievement.type === "milestone" ? (
                      <Medal className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Badge className="h-8 w-8 flex items-center justify-center text-green-500">
                        P
                      </Badge>
                    )}
                    <div>
                      <CardTitle>{achievement.title}</CardTitle>
                      <CardDescription>
                        {achievement.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <span className="text-sm text-muted-foreground">
                      {achievement.date}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Profile Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              {updateError && (
                <div className="text-destructive text-sm">{updateError}</div>
              )}
              {updateSuccess && (
                <div className="text-green-600 text-sm">Profile updated!</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={updateLoading}>
                {updateLoading ? "Updating..." : "Update Profile"}
              </Button>
            </CardFooter>
          </Card>

          {/* Account Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password & Security
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Login Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new logins
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language & Region
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="utc">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="est">Eastern Time</SelectItem>
                          <SelectItem value="pst">Pacific Time</SelectItem>
                          <SelectItem value="cet">
                            Central European Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how and when you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Contest Announcements</p>
                      <p className="text-sm text-muted-foreground">
                        New daily contests and challenges
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Voting Results</p>
                      <p className="text-sm text-muted-foreground">
                        When voting ends and winners are announced
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Comments & Feedback</p>
                      <p className="text-sm text-muted-foreground">
                        When someone comments on your submissions
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Weekly digest of your activity
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Push Notifications
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Contest Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Reminders before contest deadlines
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">New Votes</p>
                      <p className="text-sm text-muted-foreground">
                        When your submissions receive votes
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Achievement Unlocked</p>
                      <p className="text-sm text-muted-foreground">
                        When you earn new achievements
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control your privacy and what others can see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Profile Visibility
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted-foreground">
                        Allow others to view your profile
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Show Submission History</p>
                      <p className="text-sm text-muted-foreground">
                        Display your past submissions publicly
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Show Achievement Badges</p>
                      <p className="text-sm text-muted-foreground">
                        Display your earned badges on profile
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Show Join Date</p>
                      <p className="text-sm text-muted-foreground">
                        Display when you joined the platform
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Data & Analytics</h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Analytics Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Help improve the platform with usage data
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        Personalized Recommendations
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get contest suggestions based on your activity
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-destructive">
                  Data Management
                </h4>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Download My Data</p>
                      <p className="text-sm text-muted-foreground">
                        Export all your account data
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-destructive">
                        Delete Account
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-lg">Current Plan</h4>
                    <p className="text-2xl font-bold text-primary">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Submissions Left
                    </div>
                    <div className="text-xl font-semibold">
                      {remainingSubmissions}
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Next Billing
                    </div>
                    <div className="text-xl font-semibold">
                      {new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        1,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Monthly Cost
                    </div>
                    <div className="text-xl font-semibold">
                      {tier === "free"
                        ? "$0"
                        : tier === "pro"
                          ? "$9.99"
                          : "$19.99"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Plan Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={tier === "free" ? "border-primary" : ""}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Free</CardTitle>
                      <CardDescription>$0/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-muted-foreground">
                        3 submissions per month
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={tier === "free" ? "default" : "outline"}
                        className="w-full"
                        disabled={tier === "free"}
                      >
                        {tier === "free" ? "Current Plan" : "Downgrade"}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className={tier === "pro" ? "border-primary" : ""}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Pro</CardTitle>
                      <CardDescription>$9.99/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Unlimited submissions
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={tier === "pro" ? "default" : "outline"}
                        className="w-full"
                        disabled={tier === "pro"}
                      >
                        {tier === "pro" ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className={tier === "premium" ? "border-primary" : ""}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Premium</CardTitle>
                      <CardDescription>$19.99/month</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Unlimited + Priority support
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={tier === "premium" ? "default" : "outline"}
                        className="w-full"
                        disabled={tier === "premium"}
                      >
                        {tier === "premium" ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Billing Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-sm text-muted-foreground">
                        •••• •••• •••• 4242
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Billing Address</p>
                      <p className="text-sm text-muted-foreground">
                        123 Main St, City, State 12345
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Billing History</p>
                      <p className="text-sm text-muted-foreground">
                        View past invoices and payments
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View History
                    </Button>
                  </div>
                </div>
              </div>

              {tier !== "free" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium text-destructive">
                      Danger Zone
                    </h4>
                    <div className="p-4 border border-destructive/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Cancel Subscription</p>
                          <p className="text-sm text-muted-foreground">
                            Cancel your subscription. You'll retain access until
                            the end of your billing period.
                          </p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Cancel Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
